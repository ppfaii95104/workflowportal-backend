import { Router } from "express";

import { createWorkflow } from "@/services/workflows.service.js";
import {
  getDepartmentList,
  getEmployeeList,
  getPositionList,
} from "@/services/masterData.service.js";

const router = Router();

router.get("/department", getDepartmentList);
router.get("/position", getPositionList);
router.get("/employee", getEmployeeList);

export default router;
