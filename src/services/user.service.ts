import type { Request, Response } from "express";
import { APIResponse } from "../utils/APIResponse.js";
import { StatusCodes } from "http-status-codes";

import {
  createUser,
  getUserById,
  getListUser,
  countListUser,
  updateUser,
  updateUserStatus,
  updateUserRole,
} from "../repositories/user.repository.js";
import { getUserDataByEmail } from "../repositories/auth.repository.js";

export const getUserList = async (req: Request, res: Response) => {
  const authHeader = req.headers["authorization"];
  const token = authHeader && authHeader.split(" ")[1];

  if (!token) {
    return res
      .status(StatusCodes.UNAUTHORIZED)
      .json(APIResponse.error("Access token required"));
  }

  const data = req.body;
  const result = await getListUser(data);
  const count = await countListUser(data);

  res
    .status(StatusCodes.OK)
    .json(
      APIResponse.successWithPaging(result, { ...data, total: count.total })
    );
};

// ✅ Create User พร้อมอัปโหลดรูป
export const createDataUser = async (req: Request, res: Response) => {
  const authHeader = req.headers["authorization"];
  const token = authHeader && authHeader.split(" ")[1];

  if (!token) {
    return res
      .status(StatusCodes.UNAUTHORIZED)
      .json(APIResponse.error("Access token required"));
  }

  const data = req.body;
  const email = data?.email ?? "";

  if (!email) {
    return res
      .status(StatusCodes.BAD_REQUEST)
      .json(APIResponse.error("Email is required"));
  }

  // หา user ในฐานข้อมูล
  const users = await getUserDataByEmail(email);

  // ถ้าไม่พบ user ให้รีเทิร์น error
  if (!users) {
    return res
      .status(StatusCodes.NOT_FOUND)
      .json(APIResponse.error("User not found"));
  }
  const result = await createUser(data);

  res.status(StatusCodes.OK).json(
    APIResponse.success({
      ...result,
      uploadedFile: req.file ? req.file.filename : null,
    })
  );
};

// ✅ Update User พร้อมอัปโหลดรูป
export const updateUserById = async (req: Request, res: Response) => {
  const authHeader = req.headers["authorization"];
  const token = authHeader && authHeader.split(" ")[1];

  if (!token) {
    return res
      .status(StatusCodes.UNAUTHORIZED)
      .json(APIResponse.error("Access token required"));
  }

  const idParam = req.params.id;

  if (!idParam || isNaN(Number(idParam))) {
    return res
      .status(StatusCodes.BAD_REQUEST)
      .json(APIResponse.error("Missing or invalid User ID"));
  }

  const id = Number(idParam);
  const data = req.body;

  // รองรับทั้งการ upload ผ่าน FormData และ Base64 string
  if (req.file) {
    // กรณี upload ผ่าน FormData
    data.avatar = req.file.filename;
  } else if (data.avatar && typeof data.avatar === 'object') {
    // กรณีส่งมาเป็น file object (จะไม่ทำอะไร ให้ใช้ชื่อไฟล์เดิมจาก DB)
    delete data.avatar;
  }

  const result = await updateUser(id, data);

  if (!result) {
    return res
      .status(StatusCodes.NOT_FOUND)
      .json(APIResponse.error("User not found"));
  }

  res.status(StatusCodes.OK).json(
    APIResponse.success({
      ...result,
      uploadedFile: req.file ? req.file.filename : null,
    })
  );
};

// ✅ ฟังก์ชันอื่น ๆ เหมือนเดิม
export const getDataUserById = async (req: Request, res: Response) => {
  const authHeader = req.headers["authorization"];
  const token = authHeader && authHeader.split(" ")[1];

  if (!token) {
    return res
      .status(StatusCodes.UNAUTHORIZED)
      .json(APIResponse.error("Access token required"));
  }

  const idParam = req.params.id;

  if (!idParam || isNaN(Number(idParam))) {
    return res
      .status(StatusCodes.BAD_REQUEST)
      .json(APIResponse.error("Missing or invalid User ID"));
  }

  const id = Number(idParam);
  const result = await getUserById(id);

  if (!result) {
    return res
      .status(StatusCodes.NOT_FOUND)
      .json(APIResponse.error("User not found"));
  }

  res.status(StatusCodes.OK).json(APIResponse.success(result));
};

export const checkDataUser = async (req: Request, res: Response) => {
  const authHeader = req.headers["authorization"];
  const token = authHeader && authHeader.split(" ")[1];

  if (!token) {
    return res
      .status(StatusCodes.UNAUTHORIZED)
      .json(APIResponse.error("Access token required"));
  }

  const data = req.body;
  const email = data?.email ?? "";

  if (!email) {
    return res
      .status(StatusCodes.BAD_REQUEST)
      .json(APIResponse.error("Email is required"));
  }

  // หา user ในฐานข้อมูล
  const users = await getUserDataByEmail(email);

  if (!users) {
    return res
      .status(StatusCodes.NOT_FOUND)
      .json(APIResponse.error("Workflow not found", StatusCodes.NOT_FOUND));
  }

  res.status(StatusCodes.OK).json(APIResponse.success(users));
};

export const updateUserStatusById = async (req: Request, res: Response) => {
  const authHeader = req.headers["authorization"];
  const token = authHeader && authHeader.split(" ")[1];

  if (!token) {
    return res
      .status(StatusCodes.UNAUTHORIZED)
      .json(APIResponse.error("Access token required"));
  }

  const idParam = req.params.id;

  if (!idParam || isNaN(Number(idParam))) {
    return res
      .status(StatusCodes.BAD_REQUEST)
      .json(APIResponse.error("Missing or invalid User ID"));
  }

  const id = Number(idParam);
  const data = req.body;

  const result = await updateUserStatus(id, data);

  if (!result) {
    return res
      .status(StatusCodes.NOT_FOUND)
      .json(APIResponse.error("User not found"));
  }

  res.status(StatusCodes.OK).json(
    APIResponse.success({
      ...result,
      uploadedFile: req.file ? req.file.filename : null,
    })
  );
};
export const updateUserRoleById = async (req: Request, res: Response) => {
  const authHeader = req.headers["authorization"];
  const token = authHeader && authHeader.split(" ")[1];

  if (!token) {
    return res
      .status(StatusCodes.UNAUTHORIZED)
      .json(APIResponse.error("Access token required"));
  }

  const idParam = req.params.id;

  if (!idParam || isNaN(Number(idParam))) {
    return res
      .status(StatusCodes.BAD_REQUEST)
      .json(APIResponse.error("Missing or invalid User ID"));
  }

  const id = Number(idParam);
  const data = req.body;

  const result = await updateUserRole(id, data);

  if (!result) {
    return res
      .status(StatusCodes.NOT_FOUND)
      .json(APIResponse.error("User not found"));
  }

  res.status(StatusCodes.OK).json(
    APIResponse.success({
      ...result,
      uploadedFile: req.file ? req.file.filename : null,
    })
  );
};
