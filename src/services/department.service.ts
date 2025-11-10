import type { Request, Response } from "express";

import { APIResponse } from "../utils/APIResponse.js";
import { StatusCodes } from "http-status-codes";

import {
  createDepartment,
  createPosition,
  deleteDepartment,
  deletePosition,
  getDepartmentById,
  getListDepartment,
  getPositionById,
  getPositionByTeamId,
  getTeamById,
  updateDataPosition,
  updateDepartment,
} from "../repositories/department.repository.js";
export const getDepartmentList = async (req: Request, res: Response) => {
  const authHeader = req.headers["authorization"];
  const token = authHeader && authHeader.split(" ")[1]; // Bearer <token>

  if (!token) {
    return res
      .status(StatusCodes.UNAUTHORIZED)
      .json(APIResponse.error("Access token required"));
  }
  const data = req.body;
  const reslut = await getListDepartment(data);

  res.status(StatusCodes.OK).json(APIResponse.success(reslut));
};

export const createDataDepartment = async (req: Request, res: Response) => {
  const authHeader = req.headers["authorization"];
  const token = authHeader && authHeader.split(" ")[1]; // Bearer <token>

  if (!token) {
    return res
      .status(StatusCodes.UNAUTHORIZED)
      .json(APIResponse.error("Access token required"));
  }
  const data = req.body;
  const reslut = await createDepartment(data);

  res.status(StatusCodes.OK).json(APIResponse.success(reslut));
};
export const getDataDepartmentById = async (req: Request, res: Response) => {
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

  const reslut = await getDepartmentById(id);

  if (!reslut) {
    return res
      .status(StatusCodes.NOT_FOUND)
      .json(APIResponse.error("Department not found", StatusCodes.NOT_FOUND));
  }

  res.status(StatusCodes.OK).json(APIResponse.success(reslut));
};
export const updateDepartmentById = async (req: Request, res: Response) => {
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
  const result = await updateDepartment(id, data);

  if (!result) {
    return res
      .status(StatusCodes.NOT_FOUND)
      .json(APIResponse.error("Workflow not found", StatusCodes.NOT_FOUND));
  }

  res.status(StatusCodes.OK).json(APIResponse.success(result));
};
export const deleteDepartmentById = async (req: Request, res: Response) => {
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
  const result = await deleteDepartment(id);

  res.status(StatusCodes.OK).json(APIResponse.success(result));
};
export const getDataPositionByTeamId = async (req: Request, res: Response) => {
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
  const team = await getTeamById(id);
  const reslut = await getPositionByTeamId(id);

  if (!reslut || !team) {
    return res
      .status(StatusCodes.NOT_FOUND)
      .json(APIResponse.error("Department not found", StatusCodes.NOT_FOUND));
  }

  res
    .status(StatusCodes.OK)
    .json(APIResponse.success({ ...team, position_list: reslut }));
};
export const updatePositionById = async (req: Request, res: Response) => {
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
  console.log("🚀 ~ updatePositionById ~ req.body:", req.body);
  const result = await updateDataPosition(id, data);

  if (!result) {
    return res
      .status(StatusCodes.NOT_FOUND)
      .json(APIResponse.error("Workflow not found", StatusCodes.NOT_FOUND));
  }

  res.status(StatusCodes.OK).json(APIResponse.success(result));
};
export const creaetePositionById = async (req: Request, res: Response) => {
  const authHeader = req.headers["authorization"];
  const token = authHeader && authHeader.split(" ")[1]; // Bearer <token>

  if (!token) {
    return res
      .status(StatusCodes.UNAUTHORIZED)
      .json(APIResponse.error("Access token required"));
  }

  const data = req.body;
  const result = await createPosition(data);

  if (!result) {
    return res
      .status(StatusCodes.NOT_FOUND)
      .json(APIResponse.error("Workflow not found", StatusCodes.NOT_FOUND));
  }

  res.status(StatusCodes.OK).json(APIResponse.success(result));
};

export const getDataPositionById = async (req: Request, res: Response) => {
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

  const reslut = await getPositionById(id);

  if (!reslut) {
    return res
      .status(StatusCodes.NOT_FOUND)
      .json(APIResponse.error("Department not found", StatusCodes.NOT_FOUND));
  }

  res.status(StatusCodes.OK).json(APIResponse.success(reslut));
};
export const deleteDataPositionById = async (req: Request, res: Response) => {
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

  const reslut = await deletePosition(id);

  if (!reslut) {
    return res
      .status(StatusCodes.NOT_FOUND)
      .json(APIResponse.error("Department not found", StatusCodes.NOT_FOUND));
  }

  res.status(StatusCodes.OK).json(APIResponse.success(reslut));
};
