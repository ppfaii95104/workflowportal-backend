import { Router } from "express";

import {
  countDepartmentList,
  countTeamtList,
  createWorkflow,
  deleteWorkflowById,
  duplicateDataWorkflow,
  getPositionEmployeeListByWorkflowsId,
  getWorkflowById,
  getWorkflowList,
  importWorkflows,
  updateWorkflowById,
  updateWorkflowStatusById,
} from "../../services/workflows.service.js";

const router = Router();
router.post("/list", getWorkflowList);
router.post("/import", importWorkflows);
router.post("/", createWorkflow);
router.post("/count/department", countDepartmentList);
router.post("/count/team", countTeamtList);
router.post("/duplicate", duplicateDataWorkflow);
router.put("/status/:id", updateWorkflowStatusById);
router.get("/position/employee/:id", getPositionEmployeeListByWorkflowsId);
router.get("/:id", getWorkflowById);
router.delete("/:id", deleteWorkflowById);
router.put("/:id", updateWorkflowById);

export default router;
