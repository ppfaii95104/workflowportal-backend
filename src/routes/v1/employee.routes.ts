import { Router } from "express";

import {
  createDataEmployee,
  deleteEmployeeById,
  getDataEmployeeById,
  getEmployeeList,
  updateEmployeeById,
} from "../../services/employee.service.js";
import { upload } from "../../middlewares/upload.middleware.js";

const router = Router();
router.post("/list", getEmployeeList);
router.post("/", upload.single("avatar"), createDataEmployee);
router.get("/:id", getDataEmployeeById);
router.delete("/:id", deleteEmployeeById);
router.put("/:id", upload.single("avatar"), updateEmployeeById);
export default router;
