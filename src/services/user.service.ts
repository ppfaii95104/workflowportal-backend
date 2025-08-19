import type { Request, Response } from "express";
import { findAllUsers } from "../repositories/user.repository.js";
import { APIResponse } from "@/utils/APIResponse.js";
import { StatusCodes } from "http-status-codes";
export const getUsers = async (_req: Request, res: Response) => {
  const users = await findAllUsers();
  console.log("🚀 ~ getUsers ~ users:", users);

  res.status(StatusCodes.OK).json(APIResponse.success(users));
};
