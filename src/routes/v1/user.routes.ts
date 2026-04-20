import { Router } from "express";

import {
  checkDataUser,
  createDataUser,
  getDataUserById,
  getUserList,
  updateUserById,
  updateUserRoleById,
  updateUserStatusById,
} from "../../services/user.service.js";
import { upload } from "../../middlewares/upload.middleware.js";

const router = Router();
router.post("/list", getUserList);
router.post("/", createDataUser);
router.get("/:id", getDataUserById);
router.put("/:id", upload.single("avatar"), updateUserById);
router.put("/status/:id", updateUserStatusById);
router.put("/role/:id", updateUserRoleById);
router.post("/check", checkDataUser);
export default router;
