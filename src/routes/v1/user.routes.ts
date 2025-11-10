import { Router } from "express";

import {
  checkDataUser,
  createDataUser,
  deleteUserById,
  getDataUserById,
  getUserList,
  updateUserById,
} from "../../services/user.service.js";
import { upload } from "../../middlewares/upload.middleware.js";

const router = Router();
router.post("/list", getUserList);
router.post("/", createDataUser);
router.get("/:id", getDataUserById);
router.delete("/:id", deleteUserById);
router.put("/:id", upload.single("avatar"), updateUserById);
router.post("/check", checkDataUser);
export default router;
