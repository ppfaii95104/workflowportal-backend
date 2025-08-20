import { Router } from "express";

import {
  getDataEmployeeByDepartment,
  getDataEmployeeByPosition,
  getDepartmentList,
  getDepartmentTeamList,
  getEmployeeList,
  getPositioneByDepartmentList,
  getPositionEmployeeList,
  getPositionList,
  getSystemToolList,
} from "../../services/masterData.service.js";

const router = Router();
router.get("/employee/department/:id", getDataEmployeeByDepartment);
router.get("/employee/position/:id", getDataEmployeeByPosition);
router.get("/department/team", getDepartmentTeamList);
router.get("/department", getDepartmentList);
router.get("/position/employee", getPositionEmployeeList);
router.get("/position", getPositionList);
router.post("/position/department", getPositioneByDepartmentList);
router.get("/employee", getEmployeeList);

router.get("/system", getSystemToolList);

export default router;
