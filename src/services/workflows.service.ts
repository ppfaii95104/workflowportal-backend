import type { Request, Response } from "express";
import {
  createWorkflows,
  getListWorkflow,
  getWorkflowsById,
  updateWorkflow,
  updateWorkflowsStatusById,
} from "../repositories/workflows.repository.js";
import { APIResponse } from "../utils/APIResponse.js";
import { StatusCodes } from "http-status-codes";
export const createWorkflow = async (_req: Request, res: Response) => {
  const data = _req.body;
  const users = await createWorkflows(data);

  res.status(StatusCodes.OK).json(APIResponse.success(users));
};
export const getWorkflowById = async (req: Request, res: Response) => {
  const idParam = req.params.id;

  // ตรวจสอบว่า id มีค่าและเป็นตัวเลข
  if (!idParam || isNaN(Number(idParam))) {
    return res
      .status(StatusCodes.BAD_REQUEST)
      .json(
        APIResponse.error(
          "Missing or invalid workflow ID",
          StatusCodes.BAD_REQUEST
        )
      );
  }

  const id = Number(idParam); // convert เป็น number
  const workflow = await getWorkflowsById(id);

  if (!workflow) {
    return res
      .status(StatusCodes.NOT_FOUND)
      .json(APIResponse.error("Workflow not found", StatusCodes.NOT_FOUND));
  }

  res.status(StatusCodes.OK).json(APIResponse.success(workflow));
};
export const updateWorkflowById = async (req: Request, res: Response) => {
  const idParam = req.params.id;

  // ตรวจสอบว่า id มีค่าและเป็นตัวเลข
  if (!idParam || isNaN(Number(idParam))) {
    return res
      .status(StatusCodes.BAD_REQUEST)
      .json(
        APIResponse.error(
          "Missing or invalid workflow ID",
          StatusCodes.BAD_REQUEST
        )
      );
  }

  const id = Number(idParam); // convert เป็น number
  const data = req.body;
  const workflow = await updateWorkflow(id, data);

  if (!workflow) {
    return res
      .status(StatusCodes.NOT_FOUND)
      .json(APIResponse.error("Workflow not found", StatusCodes.NOT_FOUND));
  }

  res.status(StatusCodes.OK).json(APIResponse.success(workflow));
};
export const getWorkflowList = async (_req: Request, res: Response) => {
  const users = await getListWorkflow();

  res.status(StatusCodes.OK).json(APIResponse.success(users));
};

export const updateWorkflowStatusById = async (req: Request, res: Response) => {
  const idParam = req.params.id;

  // ตรวจสอบว่า id มีค่าและเป็นตัวเลข
  if (!idParam || isNaN(Number(idParam))) {
    return res
      .status(StatusCodes.BAD_REQUEST)
      .json(
        APIResponse.error(
          "Missing or invalid workflow ID",
          StatusCodes.BAD_REQUEST
        )
      );
  }

  const id = Number(idParam); // convert เป็น number
  const data = req.body;
  const workflow = await updateWorkflowsStatusById(data, id);

  if (!workflow) {
    return res
      .status(StatusCodes.NOT_FOUND)
      .json(APIResponse.error("Workflow not found", StatusCodes.NOT_FOUND));
  }

  res.status(StatusCodes.OK).json(APIResponse.success(workflow));
};
