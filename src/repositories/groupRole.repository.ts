import type { GroupRoleBody } from "interfaces/groupRole.js";
import { dbConnection } from "../config/db.js";

export const createGroupRole = async (data: GroupRoleBody) => {
  const [insertResult] = await dbConnection.query(
    `
     INSERT INTO group_role
     (name,
     workflow,
     department,
     employee,
     system,
     role_management,
     user,
     color,
     created_at,
     updated_at,
     created_by,
     updated_by)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, NOW(), NOW(), ?, ?)
     `,
    [
      data?.name,
      data?.workflow,
      data?.department,
      data?.employee,
      data?.system,
      data?.role_management,
      data?.user,
      data?.color,
      data?.created_by,
      data?.updated_by,
    ]
  );
  const GroupRoleId = (insertResult as any).insertId;

  // คืนค่า insertId หรือ docId ก็ได้
  return { id: GroupRoleId };
};

export const getGroupRoleById = async (id: number) => {
  const [rows]: any[] = await dbConnection.query(
    `SELECT * FROM group_role WHERE id = ?;
     `,
    [id]
  );

  return rows ? rows[0] : {}; // คืนค่า index 0 หรือ null ถ้าไม่มีข้อมูล
};
export const getListGroupRole = async (body: any) => {
  let query = `SELECT * FROM group_role
    WHERE id is not null \n`;
  const params: any[] = [];
  if (body?.name) {
    query += `AND name LIKE ? \n`;
    params.push(`%${body.name}%`);
  }
  query += ";";

  const [rows]: any[] = await dbConnection.query(query, params);
  return rows;
};

export const updateGroupRole = async (id: number, data: GroupRoleBody) => {
  const [rows]: any[] = await dbConnection.query(
    `UPDATE group_role
      SET name=?,
          workflow=?,
          department=?,
          employee=?,
          system=?,
          role_management=?,
          user=?,
          color=?,
          updated_by=?,
          updated_at=current_timestamp()
      WHERE id= ?`,
    [
      data?.name,
      data?.workflow,
      data?.department,
      data?.employee,
      data?.system,
      data?.role_management,
      data?.user,
      data?.color,
      data?.updated_by,
      id,
    ]
  );
  return { success: true };
};
export const deleteGroupRole = async (id: number) => {
  await dbConnection.query("DELETE FROM group_role WHERE id = ?;", [id]);

  return { success: true };
};
