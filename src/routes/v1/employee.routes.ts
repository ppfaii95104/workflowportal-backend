import { Router } from "express";

import {
  createDataEmployee,
  deleteEmployeeById,
  getDataEmployeeById,
  getEmployeeList,
  updateEmployeeById,
} from "../../services/employee.service.js";

const router = Router();
router.post("/list", getEmployeeList);
router.post("/", createDataEmployee);
router.get("/:id", getDataEmployeeById);
router.delete("/:id", deleteEmployeeById);
router.put("/:id", updateEmployeeById);
export default router;
