import { Router } from "express";

import {
  getDataEmployeeByDepartment,
  getDataEmployeeByPosition,
  getDepartmentList,
  getEmployeeList,
  getPositionList,
  getSystemToolList,
} from "../../services/masterData.service.js";

const router = Router();
router.get("/employee/department/:id", getDataEmployeeByDepartment);
router.get("/employee/position/:id", getDataEmployeeByPosition);
router.get("/department", getDepartmentList);
router.get("/position", getPositionList);
router.get("/employee", getEmployeeList);

router.get("/system", getSystemToolList);

export default router;
