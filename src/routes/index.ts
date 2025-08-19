import { Router } from "express";
import userRoutes from "./v1/user.routes.js";
import workflowsRoutes from "./v1/workflows.routes.js";
import masterDataRoutes from "./v1/masterData.routes.js";

const router = Router();

router.use("/users", userRoutes);
router.use("/workflow", workflowsRoutes);
router.use("/master-data", masterDataRoutes);
export default router;
