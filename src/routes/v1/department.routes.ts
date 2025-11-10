import { Router } from "express";

import {
  createDataDepartment,
  getDepartmentList,
  getDataDepartmentById,
  updateDepartmentById,
  deleteDepartmentById,
  getDataPositionByTeamId,
  updatePositionById,
  getDataPositionById,
  deleteDataPositionById,
  creaetePositionById,
} from "../../services/department.service.js";

const router = Router();
router.post("/list", getDepartmentList);
router.post("/", createDataDepartment);
router.get("/:id", getDataDepartmentById);
router.delete("/:id", deleteDepartmentById);
router.put("/:id", updateDepartmentById);
router.get("/team/position/:id", getDataPositionByTeamId);
router.post("/position", creaetePositionById);
router.put("/position/:id", updatePositionById);
router.get("/position/:id", getDataPositionById);
router.delete("/position/:id", deleteDataPositionById);
export default router;
