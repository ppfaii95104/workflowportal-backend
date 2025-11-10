import type { Request, Response } from "express";

import { APIResponse } from "../utils/APIResponse.js";
import { StatusCodes } from "http-status-codes";

import {
  createEmployee,
  deleteEmployee,
  getEmployeeById,
  getListEmployee,
  updateEmployee,
} from "../repositories/employee.repository.js";
export const getEmployeeList = async (req: Request, res: Response) => {
  const authHeader = req.headers["authorization"];
  const token = authHeader && authHeader.split(" ")[1]; // Bearer <token>

  if (!token) {
    return res
      .status(StatusCodes.UNAUTHORIZED)
      .json(APIResponse.error("Access token required"));
  }
  const data = req.body;
  const reslut = await getListEmployee(data);

  res.status(StatusCodes.OK).json(APIResponse.success(reslut));
};
export const createDataEmployee = async (req: Request, res: Response) => {
  const authHeader = req.headers["authorization"];
  const token = authHeader && authHeader.split(" ")[1]; // Bearer <token>

  if (!token) {
    return res
      .status(StatusCodes.UNAUTHORIZED)
      .json(APIResponse.error("Access token required"));
  }
  const data = req.body;
  const reslut = await createEmployee(data);

  res.status(StatusCodes.OK).json(APIResponse.success(reslut));
};
export const getDataEmployeeById = async (req: Request, res: Response) => {
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
          "Missing or invalid Employee ID",
          StatusCodes.BAD_REQUEST
        )
      );
  }

  const id = Number(idParam); // convert เป็น number

  const reslut = await getEmployeeById(id);

  if (!reslut) {
    return res
      .status(StatusCodes.NOT_FOUND)
      .json(APIResponse.error("Employee not found", StatusCodes.NOT_FOUND));
  }

  res.status(StatusCodes.OK).json(APIResponse.success(reslut));
};
export const updateEmployeeById = async (req: Request, res: Response) => {
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
          "Missing or invalid result ID",
          StatusCodes.BAD_REQUEST
        )
      );
  }

  const id = Number(idParam); // convert เป็น number
  const data = req.body;
  const result = await updateEmployee(id, data);
  if (!result) {
    return res
      .status(StatusCodes.NOT_FOUND)
      .json(APIResponse.error("Workflow not found", StatusCodes.NOT_FOUND));
  }

  res.status(StatusCodes.OK).json(APIResponse.success(result));
};
export const deleteEmployeeById = async (req: Request, res: Response) => {
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
          "Missing or invalid result ID",
          StatusCodes.BAD_REQUEST
        )
      );
  }

  const id = Number(idParam); // convert เป็น number
  const result = await deleteEmployee(id);

  res.status(StatusCodes.OK).json(APIResponse.success(result));
};
