import { Router } from "express";

import {
  createWorkflow,
  getWorkflowById,
  getWorkflowList,
  updateWorkflowById,
} from "@/services/workflows.service.js";

const router = Router();

router.post("/", createWorkflow);
router.get("/", getWorkflowList);
router.get("/:id", getWorkflowById);
router.put("/:id", updateWorkflowById);
export default router;
