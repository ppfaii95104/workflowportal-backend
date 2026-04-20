import type { employeeBody } from "../interfaces/employee.js";
import { dbConnection } from "../config/db.js";
import fs from "fs";
import path from "path";

export const createUser = async (data: employeeBody) => {
  const [insertResult] = await dbConnection.query(
    `
     INSERT INTO useemployeer
     (name_th, 
     name_en, 
     department_id, 
     position_id, 
     email, 
     nickname, 
     status, 
     title, 
     report_to, 
     team_id, 
     created_at, 
     updated_at, 
     created_by, 
     updated_by)
     VALUES (?, ?, ?, ?, ?, ?, 1,  ?, ?, ?, NOW(), NOW(), ?, ?)
     `,
    [
      data?.name_th,
      data?.name_en,
      data?.department_id,
      data?.position_id,
      data?.email,
      data?.nickname,
      data?.title,
      data?.report_to,
      data?.team_id,
      data?.created_by,
      data?.updated_by,
    ]
  );
  const userId = (insertResult as any).insertId;

  // คืนค่า insertId หรือ docId ก็ได้
  return { id: userId };
};

export const getUserById = async (id: number) => {
  const [rows]: any[] = await dbConnection.query(
    `SELECT e.id,
       e.name_th, 
       e.name_en, 
       e.department_id,
       e.position_id,
       e.email,
       e.nickname,
       e.title,
       e.report_to,
       e.team_id,
       e.created_at,
       e.updated_at,
       e.created_by,
       e.updated_by,
       e.avatar,
       d.name AS department_name,
       dt.name  AS team_name,
       p.name AS position_name,
       JSON_ARRAYAGG(
           JSON_OBJECT(
               'id', r.id,
               'name_th', r.name_th,
               'name_en', r.name_en,
               'email', r.email
           )
       ) AS report_to_info
    FROM employee e
    LEFT JOIN department d ON e.department_id = d.id
    LEFT JOIN department_team dt ON dt.id = e.team_id
    LEFT JOIN position p ON p.id = e.position_id
    LEFT JOIN employee r ON FIND_IN_SET(r.id, e.report_to)  -- 👈 join ตรงนี้
    WHERE e.id = ?
    GROUP BY e.id;;
     `,
    [id]
  );

  return rows ? rows[0] : {}; // คืนค่า index 0 หรือ null ถ้าไม่มีข้อมูล
};
export const getListUser = async (body: any) => {
  console.log("🚀 ~ getListUser ~ body?.status:", body?.status);
  let query = `SELECT e.id,
       e.name_th,
       e.name_en,
       e.department_id,
       e.position_id,
       e.email,
       e.nickname,
       e.title,
       e.report_to,
       e.team_id,
       e.created_at,
       e.updated_at,
       e.created_by,
       e.updated_by,
       e.avatar,
       e.status,
       e.role,
       gr.name AS role_name,
       gr.color,
       d.name AS department_name,
       dt.name  AS team_name,
       p.name AS position_name
    FROM employee e
    LEFT JOIN department d ON e.department_id = d.id
    LEFT JOIN department_team dt ON dt.id = e.team_id
    LEFT JOIN position p ON p.id = e.position_id
    LEFT JOIN group_role gr on gr.id = e.role
    WHERE e.id is not null \n`;
  const params: any[] = [];
  if (body?.department_id) {
    query += ` AND e.department_id = ?`;
    params.push(body.department_id);
  }
  if (body?.name) {
    query += ` AND (e.name_th LIKE ? OR e.name_en LIKE ?) \n`;
    params.push(`%${body.name}%`, `%${body.name}%`);
  }
  if (body?.role) {
    query += ` AND e.role = ?`;
    params.push(body.role);
  }

  if (body?.status !== undefined && body?.status !== null) {
    query += ` AND e.status = ?`;
    params.push(body.status);
  }
  // Sorting
  const sortBy = body?.sort_by || "updated_at";
  const sortDirection =
    body?.sort_direction?.toUpperCase() === "ASC" ? "ASC" : "DESC";
  query += ` ORDER BY e.${sortBy} ${sortDirection} \n`;

  // Pagination
  if (body?.page && body?.per_page) {
    query += ` LIMIT ? OFFSET ? \n`;
    params.push(body.per_page, (body.page - 1) * body.per_page);
  }

  query += ";";
  console.log("🚀 ~ getListUser ~ query:", query);
  const [rows]: any[] = await dbConnection.query(query, params);

  return rows;
};

export const countListUser = async (body: any) => {
  let query = `
    SELECT COUNT(*) AS total
    FROM employee e
    LEFT JOIN department d ON e.department_id = d.id
    LEFT JOIN department_team dt ON dt.id = e.team_id
    LEFT JOIN position p ON p.id = e.position_id
    WHERE e.id is not null
  `;

  const params: any[] = [];

  if (body?.department_id) {
    query += ` AND e.department_id = ?`;
    params.push(body.department_id);
  }
  if (body?.name) {
    query += ` AND (e.name_th LIKE ? OR e.name_en LIKE ?) \n`;
    params.push(`%${body.name}%`, `%${body.name}%`);
  }
  if (body?.role) {
    query += ` AND e.role = ?`;
    params.push(body.role);
  }

  if (body?.status !== undefined && body?.status !== null) {
    query += ` AND e.status = ?`;
    params.push(body.status);
  }
  query += ";";

  const [rows]: any[] = await dbConnection.query(query, params);
  return rows ? rows[0] : { total: 0 };
};

export const updateUser = async (id: number, data: employeeBody) => {
  // ถ้ามีการอัปโหลดไฟล์ avatar ใหม่ ให้ลบไฟล์เก่าก่อน
  if (data?.avatar) {
    try {
      // ดึงข้อมูล avatar เก่าจาก database
      const [oldData]: any[] = await dbConnection.query(
        `SELECT avatar FROM employee WHERE id = ?`,
        [id]
      );

      if (oldData && oldData[0]?.avatar) {
        const oldAvatarPath = path.join("uploads", oldData[0].avatar);
        // ตรวจสอบว่าไฟล์เก่ามีอยู่จริงก่อนลบ
        if (fs.existsSync(oldAvatarPath)) {
          fs.unlinkSync(oldAvatarPath);
        }
      }
    } catch (error) {
      console.error("Error deleting old avatar:", error);
      // ไม่ throw error ออกไป เพื่อให้สามารถอัปเดต database ต่อได้
    }
  }

  const [rows]: any[] = await dbConnection.query(
    `UPDATE employee
      SET
          updated_by =?,
          avatar=?,
          updated_at=current_timestamp()
      WHERE id= ?`,
    [data?.updated_by, data?.avatar, id]
  );
  return { success: true };
};
export const updateUserStatus = async (id: number, data: employeeBody) => {
  const [rows]: any[] = await dbConnection.query(
    `UPDATE employee
      SET 
        status=?,
        updated_by =?,
        updated_at=current_timestamp()
      WHERE id= ?`,
    [data?.status, data?.updated_by, id]
  );
  return { success: true };
};
export const updateUserRole = async (id: number, data: employeeBody) => {
  const [rows]: any[] = await dbConnection.query(
    `UPDATE employee
      SET 
        role=?,
        updated_by =?,
        updated_at=current_timestamp()
      WHERE id= ?`,
    [data?.role, data?.updated_by, id]
  );
  return { success: true };
};
