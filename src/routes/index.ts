import { Router } from "express";

import workflowsRoutes from "./v1/workflows.routes.js";
import masterDataRoutes from "./v1/masterData.routes.js";
import authRoutes from "./v1/auth.routes.js";
import departmentRoutes from "./v1/department.routes.js";
import employeeRoutes from "./v1/employee.routes.js";
import userRoutes from "./v1/user.routes.js";
import systemToolsRoutes from "./v1/systemTools.routes.js";
const router = Router();

router.use("/workflow", workflowsRoutes);
router.use("/master-data", masterDataRoutes);
router.use("/auth", authRoutes);
router.use("/department", departmentRoutes);
router.use("/employee", employeeRoutes);
router.use("/user", userRoutes);
router.use("/system", systemToolsRoutes);
export default router;
