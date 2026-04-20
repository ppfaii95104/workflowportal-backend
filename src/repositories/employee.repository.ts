import type { employeeBody } from "../interfaces/employee.js";
import { dbConnection } from "../config/db.js";
import fs from "fs";
import path from "path";

export const createEmployee = async (data: employeeBody) => {
  const [insertResult] = await dbConnection.query(
    `
     INSERT INTO employee
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
     updated_by,
     role,
     avatar
     )
     VALUES (?, ?, ?, ?, ?, ?, 1,  ?, ?, ?, NOW(), NOW(), ?, ?,?,?)
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
      data?.role,
      data?.avatar,
    ]
  );
  const employeeId = (insertResult as any).insertId;

  // คืนค่า insertId หรือ docId ก็ได้
  return { id: employeeId };
};

export const getEmployeeById = async (id: number) => {
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
export const getListEmployee = async (body: any) => {
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
       d.name AS department_name,
       dt.name  AS team_name,
       p.name AS position_name,
       p.job_band
    FROM employee e
    LEFT JOIN department d ON e.department_id = d.id
    LEFT JOIN department_team dt ON dt.id = e.team_id
    LEFT JOIN position p ON p.id = e.position_id
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

  const [rows]: any[] = await dbConnection.query(query, params);
  return rows;
};

export const countListEmployee = async (body: any) => {
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

  query += ";";

  const [rows]: any[] = await dbConnection.query(query, params);
  return rows ? rows[0] : { total: 0 };
};

export const updateEmployee = async (id: number, data: employeeBody) => {
  // ถ้ามีการอัปโหลดไฟล์ avatar ใหม่ ให้ลบไฟล์เก่าก่อน
  if (data?.avatar) {
    try {
      // ดึงข้อมูล avatar เก่าจาก database
      const [oldData]: any[] = await dbConnection.query(
        `SELECT avatar FROM employee WHERE id = ?`,
        [id]
      );

      if (oldData && oldData[0]?.avatar && oldData[0].avatar !== data.avatar) {
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

  // สร้าง SET clause แบบ dynamic
  const updateFields: string[] = [];
  const updateValues: any[] = [];

  if (data?.name_th !== undefined) {
    updateFields.push("name_th=?");
    updateValues.push(data.name_th);
  }
  if (data?.name_en !== undefined) {
    updateFields.push("name_en=?");
    updateValues.push(data.name_en);
  }
  if (data?.department_id !== undefined) {
    updateFields.push("department_id=?");
    updateValues.push(data.department_id);
  }
  if (data?.position_id !== undefined) {
    updateFields.push("position_id=?");
    updateValues.push(data.position_id);
  }
  if (data?.email !== undefined) {
    updateFields.push("email=?");
    updateValues.push(data.email);
  }
  if (data?.nickname !== undefined) {
    updateFields.push("nickname=?");
    updateValues.push(data.nickname);
  }
  if (data?.title !== undefined) {
    updateFields.push("title=?");
    updateValues.push(data.title);
  }
  if (data?.report_to !== undefined) {
    updateFields.push("report_to=?");
    updateValues.push(data.report_to);
  }
  if (data?.team_id !== undefined) {
    updateFields.push("team_id=?");
    updateValues.push(data.team_id);
  }
  if (data?.avatar !== undefined) {
    updateFields.push("avatar=?");
    updateValues.push(data.avatar);
  }
  if (data?.updated_by !== undefined) {
    updateFields.push("updated_by=?");
    updateValues.push(data.updated_by);
  }

  updateFields.push("updated_at=current_timestamp()");
  updateValues.push(id);

  const query = `UPDATE employee SET ${updateFields.join(", ")} WHERE id=?`;

  const [rows]: any[] = await dbConnection.query(query, updateValues);
  return { success: true };
};
export const deleteEmployee = async (id: number) => {
  await dbConnection.query("DELETE FROM employee WHERE id=?;", [id]);

  return { success: true };
};
