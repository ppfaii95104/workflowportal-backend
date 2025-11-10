import type { employeeBody } from "../interfaces/employee.js";
import { dbConnection } from "../config/db.js";

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
     job_band)
     VALUES (?, ?, ?, ?, ?, ?, 1,  ?, ?, ?, NOW(), NOW(), ?, ?, ?)
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
      data?.job_band,
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
       e.job_band,
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
       e.job_band,
       d.name AS department_name,
       dt.name  AS team_name,
       p.name AS position_name
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
    query += ` AND (e.name_th  LIKE '%${body.name}%' OR e.name_en  LIKE '%${body.name}%') \n`;
  }
  query += ";";

  const [rows]: any[] = await dbConnection.query(query, params);
  return rows;
};

export const updateEmployee = async (id: number, data: employeeBody) => {
  const [rows]: any[] = await dbConnection.query(
    `UPDATE employee
      SET name_th=?, 
          name_en=?, 
          department_id=?, 
          position_id=?, 
          email=?, 
          nickname=?, 
          title=?, 
          report_to=?, 
          team_id=?, 
          job_band=?,
          updated_by =?,
          updated_at=current_timestamp()
      WHERE id= ?`,
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
      data?.job_band,
      data?.updated_by,
      id,
    ]
  );
  return { success: true };
};
export const deleteEmployee = async (id: number) => {
  await dbConnection.query("DELETE FROM employee WHERE id=?;", [id]);

  return { success: true };
};
