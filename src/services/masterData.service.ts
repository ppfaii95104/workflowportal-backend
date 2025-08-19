import type { Request, Response } from "express";

import { APIResponse } from "../utils/APIResponse.js";
import { StatusCodes } from "http-status-codes";
import {
  getDepartment,
  getEmployee,
  getPosition,
} from "../repositories/masterData.repository.js";
export const getDepartmentList = async (_req: Request, res: Response) => {
  const users = await getDepartment();

  res.status(StatusCodes.OK).json(APIResponse.success(users));
};

export const getPositionList = async (_req: Request, res: Response) => {
  const users = await getPosition();

  res.status(StatusCodes.OK).json(APIResponse.success(users));
};

export const getEmployeeList = async (_req: Request, res: Response) => {
  const users = await getEmployee();

  res.status(StatusCodes.OK).json(APIResponse.success(users));
};
