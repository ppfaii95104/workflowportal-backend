import type { Request, Response } from "express";

import { APIResponse } from "../utils/APIResponse.js";
import { StatusCodes } from "http-status-codes";
import {
  getDepartment,
  getDepartmentTeam,
  getEmployee,
  getEmployeeByDepartment,
  getEmployeeByPosition,
  getPosition,
  getPositioneByDepartment,
  getPositionEmployee,
  getSystemTool,
} from "../repositories/masterData.repository.js";
export const getDepartmentList = async (_req: Request, res: Response) => {
  const users = await getDepartment();

  res.status(StatusCodes.OK).json(APIResponse.success(users));
};
export const getDepartmentTeamList = async (_req: Request, res: Response) => {
  const users = await getDepartmentTeam();

  res.status(StatusCodes.OK).json(APIResponse.success(users));
};
export const getPositionList = async (_req: Request, res: Response) => {
  const users = await getPosition();

  res.status(StatusCodes.OK).json(APIResponse.success(users));
};
export const getPositionEmployeeList = async (_req: Request, res: Response) => {
  const users = await getPositionEmployee();

  res.status(StatusCodes.OK).json(APIResponse.success(users));
};
export const getEmployeeList = async (_req: Request, res: Response) => {
  const users = await getEmployee();

  res.status(StatusCodes.OK).json(APIResponse.success(users));
};

export const getSystemToolList = async (_req: Request, res: Response) => {
  const users = await getSystemTool();

  res.status(StatusCodes.OK).json(APIResponse.success(users));
};

export const getDataEmployeeByPosition = async (
  req: Request,
  res: Response
) => {
  const idParam = req.params.id;

  // ตรวจสอบว่า id มีค่าและเป็นตัวเลข
  if (!idParam || isNaN(Number(idParam))) {
    return res
      .status(StatusCodes.BAD_REQUEST)
      .json(
        APIResponse.error(
          "Missing or invalid Positio ID",
          StatusCodes.BAD_REQUEST
        )
      );
  }

  const id = Number(idParam); // convert เป็น number

  const data = await getEmployeeByPosition(id);

  if (!data) {
    return res
      .status(StatusCodes.NOT_FOUND)
      .json(APIResponse.error("Workflow not found", StatusCodes.NOT_FOUND));
  }

  res.status(StatusCodes.OK).json(APIResponse.success(data));
};
export const getDataEmployeeByDepartment = async (
  req: Request,
  res: Response
) => {
  const idParam = req.params.id;

  // ตรวจสอบว่า id มีค่าและเป็นตัวเลข
  if (!idParam || isNaN(Number(idParam))) {
    return res
      .status(StatusCodes.BAD_REQUEST)
      .json(
        APIResponse.error(
          "Missing or invalid Department ID",
          StatusCodes.BAD_REQUEST
        )
      );
  }

  const id = Number(idParam); // convert เป็น number

  const data = await getEmployeeByDepartment(id);

  if (!data) {
    return res
      .status(StatusCodes.NOT_FOUND)
      .json(APIResponse.error("Workflow not found", StatusCodes.NOT_FOUND));
  }

  res.status(StatusCodes.OK).json(APIResponse.success(data));
};
export const getPositioneByDepartmentList = async (
  _req: Request,
  res: Response
) => {
  const data = _req.body;
  const users = await getPositioneByDepartment(data);

  res.status(StatusCodes.OK).json(APIResponse.success(users));
};
