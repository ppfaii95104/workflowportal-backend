import type { Request, Response } from "express";
import jwt from "jsonwebtoken";
import { v4 as uuidv4 } from "uuid";
import { APIResponse } from "../utils/APIResponse.js";
import { StatusCodes } from "http-status-codes";
import {
  createUserDataByEmail,
  getUserDataByEmail,
  getUserDataById,
  saveRefreshToken,
  getRefreshTokenByToken,
  deleteRefreshToken,
  deleteAllRefreshTokensByUserId,
} from "../repositories/auth.repository.js";

// Environment variables (ใส่ใน .env file)
const ACCESS_TOKEN_SECRET =
  process.env.ACCESS_TOKEN_SECRET || "your_access_token_secret_key_change_this";
const REFRESH_TOKEN_SECRET =
  process.env.REFRESH_TOKEN_SECRET ||
  "your_refresh_token_secret_key_change_this";
const ACCESS_TOKEN_EXPIRE = "7d"; // Access token หมดอายุ 7 วัน
const REFRESH_TOKEN_EXPIRE = "7d"; // Refresh token หมดอายุ 90 วัน (3 เดือน)

interface TokenPayload {
  id: string;
  email: string;
  tokenId?: string;
}

interface RefreshTokenData {
  id?: number; // MySQL AUTO_INCREMENT เป็น number
  token: string;
  userId: string | number; // รองรับทั้ง string และ number
  expiresAt: Date;
  createdAt?: Date;
  updatedAt?: Date;
}

// สร้าง Access Token (อายุสั้น)
const generateAccessToken = (user: { id: string; email: string }): string => {
  return jwt.sign(
    {
      id: user.id,
      email: user.email,
    },
    ACCESS_TOKEN_SECRET,
    {
      expiresIn: ACCESS_TOKEN_EXPIRE,
      issuer: "your-app-name",
      audience: "your-app-users",
    },
  );
};

// สร้าง Refresh Token (อายุ 7 วัน)
const generateRefreshToken = (user: { id: string; email: string }): string => {
  const tokenId = uuidv4(); // สำหรับ token revocation
  return jwt.sign(
    {
      id: user.id,
      email: user.email,
      tokenId,
      type: "refresh",
    },
    REFRESH_TOKEN_SECRET,
    {
      expiresIn: REFRESH_TOKEN_EXPIRE,
      issuer: "your-app-name",
      audience: "your-app-users",
    },
  );
};

// คำนวณวันหมดอายุ Refresh Token (90 วันจากวันนี้)
const getRefreshTokenExpiry = (): Date => {
  const now = new Date();
  now.setDate(now.getDate() + 90); // เพิ่ม 90 วัน (3 เดือน)
  return now;
};

// ฟังก์ชัน Login เดิมที่ปรับปรุงแล้ว
export const login = async (req: Request, res: Response) => {
  try {
    const body = req.body;
    const email = body?.email ?? "";
    console.log("🚀 ~ login ~ email:", email);

    if (!email) {
      return res
        .status(StatusCodes.BAD_REQUEST)
        .json(APIResponse.error("Email is required"));
    }

    // หา user ในฐานข้อมูล
    const users = await getUserDataByEmail(email);
    console.log("🚀 ~ login ~ users:", users);

    // ถ้าไม่พบ user ให้รีเทิร์น error
    if (!users) {
      return res
        .status(StatusCodes.NOT_FOUND)
        .json(APIResponse.error("User not found"));
    }

    // ✅ ลบ refresh token เดิมทั้งหมดของผู้ใช้ก่อน
    await deleteAllRefreshTokensByUserId(users.id);

    // สร้าง Access Token และ Refresh Token ใหม่
    const accessToken = generateAccessToken(users);
    const refreshToken = generateRefreshToken(users);

    // บันทึก Refresh Token ลงฐานข้อมูล
    const refreshTokenData: RefreshTokenData = {
      token: refreshToken,
      userId: users.id,
      expiresAt: getRefreshTokenExpiry(),
    };

    const savedToken = await saveRefreshToken(refreshTokenData);

    if (!savedToken) {
      return res
        .status(StatusCodes.INTERNAL_SERVER_ERROR)
        .json(APIResponse.error("Failed to save refresh token"));
    }

    const responseData = {
      user: users,
      tokens: {
        accessToken,
        refreshToken,
        accessTokenExpiresIn: ACCESS_TOKEN_EXPIRE,
        refreshTokenExpiresIn: REFRESH_TOKEN_EXPIRE,
        tokenType: "Bearer",
      },
    };

    res.status(StatusCodes.OK).json(APIResponse.success(responseData));
  } catch (error) {
    console.error("Error in login:", error);
    res
      .status(StatusCodes.INTERNAL_SERVER_ERROR)
      .json(APIResponse.error("Internal server error"));
  }
};

// ขอ Access Token ใหม่ด้วย Refresh Token
export const refreshToken = async (req: Request, res: Response) => {
  try {
    const { refreshToken } = req.body;

    if (!refreshToken) {
      return res
        .status(StatusCodes.BAD_REQUEST)
        .json(APIResponse.error("Refresh token is required"));
    }

    // ตรวจสอบว่า Refresh Token มีอยู่ในฐานข้อมูลหรือไม่
    const tokenData = await getRefreshTokenByToken(refreshToken);

    if (!tokenData) {
      return res
        .status(StatusCodes.UNAUTHORIZED)
        .json(
          APIResponse.error("Invalid refresh token", StatusCodes.UNAUTHORIZED),
        );
    }

    // ตรวจสอบว่า token หมดอายุหรือไม่
    if (new Date() > tokenData.expiresAt) {
      // ลบ token ที่หมดอายุออกจากฐานข้อมูล
      await deleteRefreshToken(refreshToken);
      return res
        .status(StatusCodes.UNAUTHORIZED)
        .json(
          APIResponse.error(
            "Refresh token has expired",
            StatusCodes.UNAUTHORIZED,
          ),
        );
    }

    // ตรวจสอบ JWT signature และ payload
    jwt.verify(
      refreshToken,
      REFRESH_TOKEN_SECRET,
      async (err: any, decoded: any) => {
        if (err) {
          // ถ้า token ไม่ถูกต้อง ให้ลบออกจากฐานข้อมูล
          await deleteRefreshToken(refreshToken);
          return res
            .status(StatusCodes.UNAUTHORIZED)
            .json(
              APIResponse.error(
                "Invalid refresh token signature",
                StatusCodes.UNAUTHORIZED,
              ),
            );
        }

        const payload = decoded as TokenPayload;

        // ดึงข้อมูล user จากฐานข้อมูล
        const user = await getUserDataById(payload.id);

        if (!user) {
          await deleteRefreshToken(refreshToken);
          return res
            .status(StatusCodes.UNAUTHORIZED)
            .json(
              APIResponse.error("User not found", StatusCodes.UNAUTHORIZED),
            );
        }

        // สร้าง Access Token ใหม่
        const newAccessToken = generateAccessToken(user);

        const responseData = {
          accessToken: newAccessToken,
          expiresIn: ACCESS_TOKEN_EXPIRE,
          tokenType: "Bearer",
        };

        res.status(StatusCodes.OK).json(APIResponse.success(responseData));
      },
    );
  } catch (error) {
    console.error("Error in refreshToken:", error);
    res
      .status(StatusCodes.INTERNAL_SERVER_ERROR)
      .json(APIResponse.error("Internal server error"));
  }
};

// ออกจากระบบ (ลบ Refresh Token)
export const logout = async (req: Request, res: Response) => {
  try {
    const { refreshToken } = req.body;

    if (!refreshToken) {
      return res
        .status(StatusCodes.BAD_REQUEST)
        .json(APIResponse.error("Refresh token is required"));
    }

    // ลบ Refresh Token จากฐานข้อมูล
    const deleted = await deleteRefreshToken(refreshToken);

    if (!deleted) {
      return res
        .status(StatusCodes.BAD_REQUEST)
        .json(APIResponse.error("Invalid refresh token"));
    }

    res.status(StatusCodes.OK).json(
      APIResponse.success({
        message: "Logout successful",
        loggedOut: true,
      }),
    );
  } catch (error) {
    console.error("Error in logout:", error);
    res
      .status(StatusCodes.INTERNAL_SERVER_ERROR)
      .json(APIResponse.error("Internal server error"));
  }
};

// ออกจากระบบทุกเครื่อง (ลบ Refresh Token ทั้งหมดของ User)
export const logoutAllDevices = async (req: Request, res: Response) => {
  try {
    // ดึง userId จาก JWT token ที่ authenticated
    const userId = req.user?.id;

    if (!userId) {
      return res
        .status(StatusCodes.UNAUTHORIZED)
        .json(APIResponse.error("User authentication required"));
    }

    // ลบ Refresh Token ทั้งหมดของ User
    const deleted = await deleteAllRefreshTokensByUserId(userId);

    if (!deleted) {
      return res
        .status(StatusCodes.INTERNAL_SERVER_ERROR)
        .json(APIResponse.error("Failed to logout from all devices"));
    }

    res.status(StatusCodes.OK).json(
      APIResponse.success({
        message: "Logged out from all devices successfully",
        loggedOutFromAllDevices: true,
      }),
    );
  } catch (error) {
    console.error("Error in logoutAllDevices:", error);
    res
      .status(StatusCodes.INTERNAL_SERVER_ERROR)
      .json(APIResponse.error("Internal server error"));
  }
};

// Middleware ตรวจสอบ Access Token
export const authenticateAccessToken = (
  req: Request,
  res: Response,
  next: Function,
) => {
  const authHeader = req.headers["authorization"];
  const token = authHeader && authHeader.split(" ")[1]; // Bearer <token>

  if (!token) {
    return res
      .status(StatusCodes.UNAUTHORIZED)
      .json(
        APIResponse.error("Access token required", StatusCodes.UNAUTHORIZED),
      );
  }

  jwt.verify(token, ACCESS_TOKEN_SECRET, (err, user) => {
    if (err) {
      let errorMessage = "Invalid access token";
      let statusCode = StatusCodes.FORBIDDEN;

      if (err.name === "TokenExpiredError") {
        errorMessage = "Access token has expired";
        statusCode = StatusCodes.UNAUTHORIZED; // ส่ง 401 เพื่อให้ frontend refresh token
      } else if (err.name === "JsonWebTokenError") {
        errorMessage = "Invalid access token format";
        statusCode = StatusCodes.FORBIDDEN;
      }

      return res
        .status(statusCode)
        .json(APIResponse.error(errorMessage, statusCode));
    }

    // เพิ่มข้อมูล user ลงใน request object
    req.user = user as TokenPayload;
    next();
  });
};

// ดึงข้อมูล User ปัจจุบัน (Protected Route)
export const getCurrentUser = async (req: Request, res: Response) => {
  try {
    const userId = req.user?.id;
    console.log("🚀 ~ getCurrentUser ~ userId:", userId);

    if (!userId) {
      return res
        .status(StatusCodes.UNAUTHORIZED)
        .json(APIResponse.error("User not authenticated"));
    }

    const user = await getUserDataById(userId);

    if (!user) {
      return res
        .status(StatusCodes.NOT_FOUND)
        .json(APIResponse.error("User not found"));
    }

    // ส่งข้อมูล user ครบถ้วน (ไม่ส่ง sensitive data)
    const userData = {
      id: user.id,
      email: user.email,
      name_en: user.name_en,
      name_th: user.name_th,
      position_name: user.position_name,
      team_name: user.team_name,
      department_name: user.department_name,
      status: user.status,
      position_id: user.position_id,
      team_id: user.team_id,
      department_id: user.department_id,
      avatar: user.avatar,
      nickname: user.nickname,
      title: user.title,
      role: typeof user.role === "string" ? JSON.parse(user.role) : user.role,
    };

    res.status(StatusCodes.OK).json(APIResponse.success(userData));
  } catch (error) {
    console.error("Error in getCurrentUser:", error);
    res
      .status(StatusCodes.INTERNAL_SERVER_ERROR)
      .json(APIResponse.error("Internal server error"));
  }
};

// ตรวจสอบสถานะการ login
export const checkAuthStatus = async (req: Request, res: Response) => {
  try {
    const userId = req.user?.id;

    if (!userId) {
      return res.status(StatusCodes.OK).json(
        APIResponse.success({
          isAuthenticated: false,
          user: null,
        }),
      );
    }

    const user = await getUserDataById(userId);

    const responseData = {
      isAuthenticated: !!user,
      user:
        user ?
          {
            id: user.id,
            email: user.email,
          }
        : null,
    };

    res.status(StatusCodes.OK).json(APIResponse.success(responseData));
  } catch (error) {
    console.error("Error in checkAuthStatus:", error);
    res
      .status(StatusCodes.INTERNAL_SERVER_ERROR)
      .json(APIResponse.error("Internal server error"));
  }
};

// Type augmentation สำหรับ Express Request
declare global {
  namespace Express {
    interface Request {
      user?: TokenPayload;
    }
  }
}
