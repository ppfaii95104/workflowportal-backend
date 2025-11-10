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
  getTeam,
} from "../repositories/masterData.repository.js";
export const getDepartmentList = async (req: Request, res: Response) => {
  const authHeader = req.headers["authorization"];
  const token = authHeader && authHeader.split(" ")[1]; // Bearer <token>

  if (!token) {
    return res
      .status(StatusCodes.UNAUTHORIZED)
      .json(APIResponse.error("Access token required"));
  }
  const result = await getDepartment();

  res.status(StatusCodes.OK).json(APIResponse.success(result));
};
export const getTeamList = async (req: Request, res: Response) => {
  const authHeader = req.headers["authorization"];
  const token = authHeader && authHeader.split(" ")[1]; // Bearer <token>

  if (!token) {
    return res
      .status(StatusCodes.UNAUTHORIZED)
      .json(APIResponse.error("Access token required"));
  }
  const data = req.body;
  const result = await getTeam(data);

  res.status(StatusCodes.OK).json(APIResponse.success(result));
};
export const getDepartmentTeamList = async (req: Request, res: Response) => {
  const authHeader = req.headers["authorization"];
  const token = authHeader && authHeader.split(" ")[1]; // Bearer <token>

  if (!token) {
    return res
      .status(StatusCodes.UNAUTHORIZED)
      .json(APIResponse.error("Access token required"));
  }
  const result = await getDepartmentTeam();

  res.status(StatusCodes.OK).json(APIResponse.success(result));
};
export const getPositionList = async (req: Request, res: Response) => {
  const authHeader = req.headers["authorization"];
  const token = authHeader && authHeader.split(" ")[1]; // Bearer <token>

  if (!token) {
    return res
      .status(StatusCodes.UNAUTHORIZED)
      .json(APIResponse.error("Access token required"));
  }
  const data = req.body;
  const result = await getPosition();

  res.status(StatusCodes.OK).json(APIResponse.success(result));
};
export const getPositionEmployeeList = async (req: Request, res: Response) => {
  const authHeader = req.headers["authorization"];
  const token = authHeader && authHeader.split(" ")[1]; // Bearer <token>

  if (!token) {
    return res
      .status(StatusCodes.UNAUTHORIZED)
      .json(APIResponse.error("Access token required"));
  }
  const data = req.body;
  const result = await getPositionEmployee(data);

  res.status(StatusCodes.OK).json(APIResponse.success(result));
};
export const getEmployeeList = async (req: Request, res: Response) => {
  const authHeader = req.headers["authorization"];
  const token = authHeader && authHeader.split(" ")[1]; // Bearer <token>

  if (!token) {
    return res
      .status(StatusCodes.UNAUTHORIZED)
      .json(APIResponse.error("Access token required"));
  }
  const result = await getEmployee();

  res.status(StatusCodes.OK).json(APIResponse.success(result));
};

export const getSystemToolList = async (req: Request, res: Response) => {
  const authHeader = req.headers["authorization"];
  const token = authHeader && authHeader.split(" ")[1]; // Bearer <token>

  if (!token) {
    return res
      .status(StatusCodes.UNAUTHORIZED)
      .json(APIResponse.error("Access token required"));
  }
  const result = await getSystemTool();

  res.status(StatusCodes.OK).json(APIResponse.success(result));
};

export const getDataEmployeeByPosition = async (
  req: Request,
  res: Response
) => {
  const authHeader = req.headers["authorization"];
  const token = authHeader && authHeader.split(" ")[1]; // Bearer <token>

  if (!token) {
    return res
      .status(StatusCodes.UNAUTHORIZED)
      .json(APIResponse.error("Access token required"));
  }
  const body = req.body;

  const data = await getEmployeeByPosition(body);

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
  const authHeader = req.headers["authorization"];
  const token = authHeader && authHeader.split(" ")[1]; // Bearer <token>

  if (!token) {
    return res
      .status(StatusCodes.UNAUTHORIZED)
      .json(APIResponse.error("Access token required"));
  }
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
  req: Request,
  res: Response
) => {
  const authHeader = req.headers["authorization"];
  const token = authHeader && authHeader.split(" ")[1]; // Bearer <token>

  if (!token) {
    return res
      .status(StatusCodes.UNAUTHORIZED)
      .json(APIResponse.error("Access token required"));
  }
  const data = req.body;
  const result = await getPositioneByDepartment(data);

  res.status(StatusCodes.OK).json(APIResponse.success(result));
};
