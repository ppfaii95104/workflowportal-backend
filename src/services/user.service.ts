import type { Request, Response } from "express";
import { APIResponse } from "../utils/APIResponse.js";
import { StatusCodes } from "http-status-codes";

import {
  createUser,
  deleteUser,
  getUserById,
  getListUser,
  updateUser,
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

  res.status(StatusCodes.OK).json(APIResponse.success(result));
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

  if (req.file) {
    data.avatar = req.file.filename;
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

export const deleteUserById = async (req: Request, res: Response) => {
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
  const result = await deleteUser(id);

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
