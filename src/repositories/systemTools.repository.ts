import type { systemToolsBody } from "interfaces/systemTools.js";
import { dbConnection } from "../config/db.js";

export const createSystemTools = async (data: systemToolsBody) => {
  const [insertResult] = await dbConnection.query(
    `
     INSERT INTO system_tools
     (name, 
     description, 
     created_at, 
     updated_at, 
     created_by, 
     updated_by)
     VALUES (?, ?, NOW(), NOW(), ?, ?)
     `,
    [data?.name, data?.description, data?.created_by, data?.updated_by]
  );
  const systemToolsId = (insertResult as any).insertId;

  // คืนค่า insertId หรือ docId ก็ได้
  return { id: systemToolsId };
};

export const getSystemToolsById = async (id: number) => {
  const [rows]: any[] = await dbConnection.query(
    `SELECT * FROM system_tools WHERE id = ?;
     `,
    [id]
  );

  return rows ? rows[0] : {}; // คืนค่า index 0 หรือ null ถ้าไม่มีข้อมูล
};
export const getListSystemTools = async (body: any) => {
  let query = `SELECT * FROM system_tools
    WHERE id is not null \n`;
  const params: any[] = [];
  if (body?.name) {
    query += `AND e.name  LIKE '%${body.name}%' \n`;
  }
  query += ";";

  const [rows]: any[] = await dbConnection.query(query, params);
  return rows;
};

export const updateSystemTools = async (id: number, data: systemToolsBody) => {
  const [rows]: any[] = await dbConnection.query(
    `UPDATE system_tools
      SET name=?, 
          description=?, 
          updated_by =?,
          updated_at=current_timestamp()
      WHERE id= ?`,
    [data?.name, data?.description, data?.updated_by, id]
  );
  return { success: true };
};
export const deleteSystemTools = async (id: number) => {
  await dbConnection.query("DELETE FROM system_tools WHERE id = ?;", [id]);

  return { success: true };
};
