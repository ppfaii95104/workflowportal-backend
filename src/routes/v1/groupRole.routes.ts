import { Router } from "express";

import {
  createDataGroupRole,
  deleteGroupRoleById,
  getDataGroupRoleById,
  getListGroupRoleList,
  updateGroupRoleById,
} from "../../services/groupRole.service.js";

const router = Router();
router.post("/list", getListGroupRoleList);
router.post("/", createDataGroupRole);
router.get("/:id", getDataGroupRoleById);
router.delete("/:id", deleteGroupRoleById);
router.put("/:id", updateGroupRoleById);
export default router;
