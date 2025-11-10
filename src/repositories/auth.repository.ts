import { dbConnection } from "../config/db.js";

// ============================================
// User Functions (เดิมที่มีอยู่แล้ว)
// ============================================

export const getUserDataByEmail = async (email: string) => {
  const [rows]: any[] = await dbConnection.query(
    `SELECT e.*,p.name AS position_name , dt.name AS team_name,d.name AS department_name FROM employee e
    left join position p on p.id = e.position_id
    left join department_team dt  on dt.department_id  = e.department_id AND e.team_id = dt.id
    left join department d  on d.id  = e.department_id 
    WHERE e.email = ?;
    `,
    [email]
  );
  return rows ? rows[0] : null;
};

export const getUserDataById = async (id: number | string) => {
  const [rows]: any[] = await dbConnection.query(
    `SELECT e.*,p.name AS position_name , dt.name AS team_name,d.name AS department_name FROM employee e
    left join position p on p.id = e.position_id
    left join department_team dt  on dt.department_id  = e.department_id AND e.team_id = dt.id
    left join department d  on d.id  = e.department_id 
    WHERE e.id = ?;
    `,
    [id]
  );
  return rows ? rows[0] : null;
};

export const createUserDataByEmail = async (email: string) => {
  const [insertResult] = await dbConnection.query(
    `
    INSERT INTO employee (email, status, created_at)
    VALUES (?, 1, NOW())
    `,
    [email]
  );

  return { id: (insertResult as any).insertId };
};

// ============================================
// Refresh Token Functions (ใหม่)
// ============================================

interface RefreshTokenData {
  id?: number;
  token: string;
  userId: string | number;
  expiresAt: Date;
  createdAt?: Date;
  updatedAt?: Date;
}

/**
 * บันทึก Refresh Token ลงฐานข้อมูล MySQL
 * @param tokenData ข้อมูล refresh token
 * @returns RefreshTokenData หรือ null ถ้าบันทึกไม่สำเร็จ
 */
export const saveRefreshToken = async (
  tokenData: RefreshTokenData
): Promise<RefreshTokenData | null> => {
  try {
    const [insertResult] = await dbConnection.query(
      `INSERT INTO refresh_tokens (token, user_id, expires_at, created_at) 
       VALUES (?, ?, ?, NOW())`,
      [tokenData.token, tokenData.userId, tokenData.expiresAt]
    );

    const insertId = (insertResult as any).insertId;

    if (insertId) {
      return {
        id: insertId,
        ...tokenData,
        createdAt: new Date(),
      };
    }

    return null;
  } catch (error) {
    console.error("Error saving refresh token:", error);
    return null;
  }
};

/**
 * ดึง Refresh Token จากฐานข้อมูลโดยใช้ token string
 * @param token refresh token string
 * @returns RefreshTokenData หรือ null ถ้าไม่พบ
 */
export const getRefreshTokenByToken = async (
  token: string
): Promise<RefreshTokenData | null> => {
  try {
    const [rows]: any[] = await dbConnection.query(
      "SELECT * FROM refresh_tokens WHERE token = ?",
      [token]
    );

    return rows && rows.length > 0 ? rows[0] : null;
  } catch (error) {
    console.error("Error getting refresh token:", error);
    return null;
  }
};

/**
 * ลบ Refresh Token จากฐานข้อมูล
 * @param token refresh token string ที่จะลบ
 * @returns boolean สำเร็จหรือไม่
 */
export const deleteRefreshToken = async (token: string): Promise<boolean> => {
  try {
    const [result] = await dbConnection.query(
      "DELETE FROM refresh_tokens WHERE token = ?",
      [token]
    );

    return (result as any).affectedRows > 0;
  } catch (error) {
    console.error("Error deleting refresh token:", error);
    return false;
  }
};

/**
 * ลบ Refresh Token ทั้งหมดของ User (สำหรับ logout all devices)
 * @param userId ID ของ User
 * @returns boolean สำเร็จหรือไม่
 */
export const deleteAllRefreshTokensByUserId = async (
  userId: string | number
): Promise<boolean> => {
  try {
    const [result] = await dbConnection.query(
      "DELETE FROM refresh_tokens WHERE user_id = ?",
      [userId]
    );

    // ถือว่าสำเร็จแม้จะลบ 0 รายการ (employee อาจไม่มี active token)
    return true;
  } catch (error) {
    console.error("Error deleting all refresh tokens for employee:", error);
    return false;
  }
};

/**
 * ลบ Refresh Token ที่หมดอายุแล้ว (Cleanup function)
 * @returns จำนวน token ที่ลบ
 */
export const deleteExpiredRefreshTokens = async (): Promise<number> => {
  try {
    const [result] = await dbConnection.query(
      "DELETE FROM refresh_tokens WHERE expires_at < NOW()"
    );

    return (result as any).affectedRows || 0;
  } catch (error) {
    console.error("Error deleting expired refresh tokens:", error);
    return 0;
  }
};

/**
 * ดึง Refresh Token ทั้งหมดของ User (สำหรับ admin หรือ debugging)
 * @param userId ID ของ User
 * @returns array ของ RefreshTokenData
 */
export const getRefreshTokensByUserId = async (
  userId: string | number
): Promise<RefreshTokenData[]> => {
  try {
    const [rows]: any[] = await dbConnection.query(
      `SELECT * FROM refresh_tokens 
       WHERE user_id = ? AND expires_at > NOW()
       ORDER BY created_at DESC`,
      [userId]
    );

    return rows || [];
  } catch (error) {
    console.error("Error getting refresh tokens by employee ID:", error);
    return [];
  }
};

/**
 * นับจำนวน Active Refresh Token ของ User
 * @param userId ID ของ User
 * @returns จำนวน active refresh tokens
 */
export const countActiveRefreshTokensByUserId = async (
  userId: string | number
): Promise<number> => {
  try {
    const [rows]: any[] = await dbConnection.query(
      `SELECT COUNT(*) as count FROM refresh_tokens 
       WHERE user_id = ? AND expires_at > NOW()`,
      [userId]
    );

    return rows && rows.length > 0 ? parseInt(rows[0].count) : 0;
  } catch (error) {
    console.error("Error counting active refresh tokens:", error);
    return 0;
  }
};

/**
 * ตรวจสอบว่า User มี Active Refresh Token หรือไม่
 * @param userId ID ของ User
 * @returns boolean มี active token หรือไม่
 */
export const hasActiveRefreshToken = async (
  userId: string | number
): Promise<boolean> => {
  try {
    const count = await countActiveRefreshTokensByUserId(userId);
    return count > 0;
  } catch (error) {
    console.error("Error checking active refresh tokens:", error);
    return false;
  }
};

/**
 * ดึง Refresh Token ที่ใหม่ที่สุดของ User
 * @param userId ID ของ User
 * @returns RefreshTokenData หรือ null
 */
export const getLatestRefreshTokenByUserId = async (
  userId: string | number
): Promise<RefreshTokenData | null> => {
  try {
    const [rows]: any[] = await dbConnection.query(
      `SELECT * FROM refresh_tokens 
       WHERE user_id = ? AND expires_at > NOW()
       ORDER BY created_at DESC 
       LIMIT 1`,
      [userId]
    );

    return rows && rows.length > 0 ? rows[0] : null;
  } catch (error) {
    console.error("Error getting latest refresh token:", error);
    return null;
  }
};

/**
 * อัพเดท Refresh Token (ถ้าต้องการ)
 * @param id ID ของ refresh token
 * @param expiresAt วันหมดอายุใหม่
 * @returns boolean สำเร็จหรือไม่
 */
export const updateRefreshTokenExpiry = async (
  id: number,
  expiresAt: Date
): Promise<boolean> => {
  try {
    const [result] = await dbConnection.query(
      "UPDATE refresh_tokens SET expires_at = ?, updated_at = NOW() WHERE id = ?",
      [expiresAt, id]
    );

    return (result as any).affectedRows > 0;
  } catch (error) {
    console.error("Error updating refresh token expiry:", error);
    return false;
  }
};

/* 
============================================
Database Schema สำหรับ refresh_tokens table (MySQL):
============================================

CREATE TABLE refresh_tokens (
    id INT AUTO_INCREMENT PRIMARY KEY,
    token TEXT NOT NULL,
    user_id INT NOT NULL,
    expires_at DATETIME NOT NULL,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    INDEX idx_token (token(255)),
    INDEX idx_user_id (user_id),
    INDEX idx_expires_at (expires_at),
    INDEX idx_user_expires (user_id, expires_at),
    FOREIGN KEY (user_id) REFERENCES employee(id) ON DELETE CASCADE
);

-- หรือถ้าต้องการใช้ UUID แทน AUTO_INCREMENT:

CREATE TABLE refresh_tokens (
    id VARCHAR(36) PRIMARY KEY DEFAULT (UUID()),
    token TEXT NOT NULL,
    user_id INT NOT NULL,
    expires_at DATETIME NOT NULL,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    UNIQUE KEY unique_token (token(255)),
    INDEX idx_user_id (user_id),
    INDEX idx_expires_at (expires_at),
    INDEX idx_user_expires (user_id, expires_at),
    FOREIGN KEY (user_id) REFERENCES employee(id) ON DELETE CASCADE
);

============================================
ตัวอย่างการใช้งาน:
============================================

// บันทึก refresh token
const tokenData = {
  token: "jwt_refresh_token_here",
  userId: 123,
  expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000) // 7 วัน
};
const saved = await saveRefreshToken(tokenData);

// ตรวจสอบ refresh token
const tokenInfo = await getRefreshTokenByToken("jwt_refresh_token_here");

// ลบ refresh token เมื่อ logout
await deleteRefreshToken("jwt_refresh_token_here");

// ลบ refresh token ทั้งหมดของ employee (logout all devices)
await deleteAllRefreshTokensByUserId(123);

// Cleanup expired tokens (ควรรันเป็น cron job)
const deletedCount = await deleteExpiredRefreshTokens();
*/
