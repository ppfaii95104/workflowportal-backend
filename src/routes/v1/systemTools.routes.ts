import { Router } from "express";

import {
  createDataSystemTools,
  deleteSystemToolsById,
  getDataSystemToolsById,
  getListSystemToolsList,
  updateSystemToolsById,
} from "../../services/systemTools.service.js";

const router = Router();
router.post("/list", getListSystemToolsList);
router.post("/", createDataSystemTools);
router.get("/:id", getDataSystemToolsById);
router.delete("/:id", deleteSystemToolsById);
router.put("/:id", updateSystemToolsById);
export default router;
