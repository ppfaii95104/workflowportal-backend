import type { Request, Response } from "express";

import { APIResponse } from "../utils/APIResponse.js";
import { StatusCodes } from "http-status-codes";
import {
  createSystemTools,
  deleteSystemTools,
  getListSystemTools,
  getSystemToolsById,
  updateSystemTools,
} from "../repositories/systemTools.repository.js";

export const getListSystemToolsList = async (req: Request, res: Response) => {
  const authHeader = req.headers["authorization"];
  const token = authHeader && authHeader.split(" ")[1]; // Bearer <token>

  if (!token) {
    return res
      .status(StatusCodes.UNAUTHORIZED)
      .json(APIResponse.error("Access token required"));
  }
  const data = req.body;
  const reslut = await getListSystemTools(data);

  res.status(StatusCodes.OK).json(APIResponse.success(reslut));
};
export const createDataSystemTools = async (req: Request, res: Response) => {
  const authHeader = req.headers["authorization"];
  const token = authHeader && authHeader.split(" ")[1]; // Bearer <token>

  if (!token) {
    return res
      .status(StatusCodes.UNAUTHORIZED)
      .json(APIResponse.error("Access token required"));
  }
  const data = req.body;
  const reslut = await createSystemTools(data);

  res.status(StatusCodes.OK).json(APIResponse.success(reslut));
};
export const getDataSystemToolsById = async (req: Request, res: Response) => {
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
          "Missing or invalid SystemTools ID",
          StatusCodes.BAD_REQUEST
        )
      );
  }

  const id = Number(idParam); // convert เป็น number

  const reslut = await getSystemToolsById(id);

  if (!reslut) {
    return res
      .status(StatusCodes.NOT_FOUND)
      .json(APIResponse.error("System Tools not found", StatusCodes.NOT_FOUND));
  }

  res.status(StatusCodes.OK).json(APIResponse.success(reslut));
};
export const updateSystemToolsById = async (req: Request, res: Response) => {
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
  const result = await updateSystemTools(id, data);
  if (!result) {
    return res
      .status(StatusCodes.NOT_FOUND)
      .json(APIResponse.error("System Tools not found", StatusCodes.NOT_FOUND));
  }

  res.status(StatusCodes.OK).json(APIResponse.success(result));
};
export const deleteSystemToolsById = async (req: Request, res: Response) => {
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
  const result = await deleteSystemTools(id);

  res.status(StatusCodes.OK).json(APIResponse.success(result));
};
