import { Router } from "express";
import { getUsers, createUser } from "../../services/user.service.js";

const router = Router();

router.get("/", getUsers);
router.post("/", createUser);

export default router;
