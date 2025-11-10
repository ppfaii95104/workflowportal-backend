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
  getTeamList,
} from "../../services/masterData.service.js";

const router = Router();
router.get("/employee/department/:id", getDataEmployeeByDepartment);
router.post("/employee/position/", getDataEmployeeByPosition);
router.get("/department/team", getDepartmentTeamList);
router.post("/team", getTeamList);
router.get("/department", getDepartmentList);
router.post("/position/employee", getPositionEmployeeList);
router.get("/position", getPositionList);
router.post("/position/department", getPositioneByDepartmentList);
router.get("/employee", getEmployeeList);

router.get("/system", getSystemToolList);

export default router;
