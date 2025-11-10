import { Router } from "express";
import {
  authenticateAccessToken,
  checkAuthStatus,
  getCurrentUser,
  login,
  logout,
  logoutAllDevices,
  refreshToken,
} from "../../services/auth.service.js";

const router = Router();
// **
//  * POST /api/auth/login
//  * เข้าสู่ระบบ หรือ สร้าง user ใหม่ถ้าไม่มี
//  * Body: { email: string }
//  * Response: { user, tokens: { accessToken, refreshToken, ... } }
//  */
router.post("/login", login);

/**
 * POST /api/auth/refresh
 * ขอ access token ใหม่ด้วย refresh token
 * Body: { refreshToken: string }
 * Response: { accessToken, expiresIn, tokenType }
 */
router.post("/refresh", refreshToken);

/**
 * POST /api/auth/logout
 * ออกจากระบบ (ลบ refresh token)
 * Body: { refreshToken: string }
 * Response: { message, loggedOut: true }
 */

router.post("/logout", logout);

// ==========================================
// PROTECTED ROUTES (ต้องมี access token)
// ==========================================

/**
 * GET /api/auth/me
 * ดูข้อมูล user ปัจจุบัน
 * Headers: Authorization: Bearer <access_token>
 * Response: { id, email, ... }
 */
router.get("/me", authenticateAccessToken, getCurrentUser);

/**
 * GET /api/auth/status
 * ตรวจสอบสถานะการ login
 * Headers: Authorization: Bearer <access_token>
 * Response: { isAuthenticated: boolean, user: object | null }
 */
router.get("/status", authenticateAccessToken, checkAuthStatus);

/**
 * POST /api/auth/logout-all
 * ออกจากระบบทุกเครื่อง (ลบ refresh token ทั้งหมด)
 * Headers: Authorization: Bearer <access_token>
 * Response: { message, loggedOutFromAllDevices: true }
 */
router.post("/logout-all", authenticateAccessToken, logoutAllDevices);
export default router;
