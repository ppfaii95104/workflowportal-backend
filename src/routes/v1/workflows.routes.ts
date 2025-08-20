import { Router } from "express";

import {
  createWorkflow,
  getWorkflowById,
  getWorkflowList,
  updateWorkflowById,
  updateWorkflowStatusById,
} from "../../services/workflows.service.js";

const router = Router();

// สร้าง workflow
router.post("/", createWorkflow);

// อัปเดต status ต้องอยู่ก่อน /:id
router.put("/status/:id", updateWorkflowStatusById);

// ดึงรายการ workflow
router.get("/", getWorkflowList);

// ดึง workflow ตาม id
router.get("/:id", getWorkflowById);

// อัปเดต workflow ตาม id
router.put("/:id", updateWorkflowById);

export default router;
