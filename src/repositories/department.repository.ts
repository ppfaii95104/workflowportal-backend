import type {
  departmentBody,
  positionBody,
  teamBody,
} from "../interfaces/department.js";

import { dbConnection } from "../config/db.js";

export const createDepartment = async (data: departmentBody) => {
  const [insertResult] = await dbConnection.query(
    `
     INSERT INTO department
     ( name, department_code, status, created_at, updated_at, created_by, updated_by,type)
     VALUES (?, ?,  1, NOW(), NOW(), ?, ?,?)
     `,
    [
      data.name,
      data.department_code,
      data?.created_by,
      data?.created_by,
      data?.type,
    ]
  );
  const departmentId = (insertResult as any).insertId;
  if (data?.team) {
    await createDepartmentTeam(data?.team, departmentId);
  }

  // คืนค่า insertId หรือ docId ก็ได้
  return { id: departmentId };
};
export const createDepartmentTeam = async (
  data: teamBody[],
  departmentId: number
) => {
  if (data.length === 0) return;
  const values = data.map((items) => [
    items?.id,
    items.name,
    departmentId,
    1,
    items.team_code,
  ]);
  await dbConnection.query(
    `INSERT INTO department_team (id,name, department_id, status, team_code) VALUES ?`,
    [values]
  );
};
export const getDepartmentById = async (id: number) => {
  const [rows]: any[] = await dbConnection.query(
    `SELECT 
    d.*,
    (
        SELECT COALESCE(
            JSON_ARRAYAGG(
                JSON_OBJECT(
                    'id', x.id,
                    'name', x.name,
                    'team_code', x.team_code,
                    'total', x.total
                )
            ),
            JSON_ARRAY()
        )
        FROM (
            select  dt.id,
            dt.name,
            dt.team_code,
            COUNT (*) AS total,
            dt.department_id 
            from  department_team dt
            left join employee e on dt.department_id = e.department_id
            WHERE dt.name is not null
            GROUP By dt.name
        ) AS x
        WHERE x.department_id = d.id
    ) AS team
    FROM department d
    WHERE  d.id = ?;
     `,
    [id]
  );

  return rows ? rows[0] : {}; // คืนค่า index 0 หรือ null ถ้าไม่มีข้อมูล
};
export const getListDepartment = async (body: any) => {
  let query = `select d.* ,(
         SELECT COALESCE(
             JSON_ARRAYAGG(
                 JSON_OBJECT(
                     'id', dt.id ,
                     'name', dt.name ,
                     'team_code', dt.team_code
                 )
             ),
             JSON_ARRAY()
         )
         FROM department_team dt 
         WHERE dt.department_id  = d.id
     ) AS team
     from department d 
     left join department_team dt on dt.department_id  = d.id
     WHERE d.status IS NOT NULL
     Group BY  d.id \n`;
  const params: any[] = [];

  const [rows]: any[] = await dbConnection.query(query, params);
  return rows;
};

export const updateDepartmentData = async (
  data: departmentBody,
  id: number
) => {
  const [rows]: any[] = await dbConnection.query(
    `UPDATE department
      SET name =?,
          department_code  =?,
          type =?,
          updated_by =?,
          updated_at=current_timestamp()
      WHERE id= ?`,
    [data.name, data.department_code, data.type, data.updated_by, id]
  );
  return rows ? rows[0] : {};
};
export const updateDepartment = async (id: number, data: departmentBody) => {
  await updateDepartmentData(data, id);
  await deleteDepartmentTeam(id);
  await createDepartmentTeam(data?.team, id);
  return { success: true };
};
export const deleteDepartmentTeam = async (id: number) => {
  await dbConnection.query(
    "DELETE FROM department_team WHERE department_id=?;",
    [id]
  );
};
export const deleteDepartment = async (id: number) => {
  await dbConnection.query("DELETE FROM department WHERE id=?;", [id]);
  await deleteDepartmentTeam(id);
  return { success: true };
};
export const getPositionByTeamId = async (id: number) => {
  const [rows]: any[] = await dbConnection.query(
    `Select * from position p 
      WHERE p.team_id =?
     `,
    [id]
  );

  return rows; // คืนค่า index 0 หรือ null ถ้าไม่มีข้อมูล
};
export const getTeamById = async (id: number) => {
  const [rows]: any[] = await dbConnection.query(
    `Select
      d.id AS department_id,
      d.name AS department_name,
      dt.id AS team_id,
      dt.name AS team_name
    from department_team dt
    left join department d on d.id = dt.department_id
    WHERE dt.id =?
     `,
    [id]
  );

  return rows ? rows[0] : {}; // คืนค่า index 0 หรือ null ถ้าไม่มีข้อมูล
};
export const getPositionById = async (id: number) => {
  const [rows]: any[] = await dbConnection.query(
    `Select p.id,
    p.name,
    d.id AS department_id,
    d.name AS department_name,
    dt.id AS team_id,
    dt.name AS team_name,
    p.job_band
    from position p 
    left join department d on d.id = p.department_id
    LEFT  join department_team dt on dt.id = p.team_id AND p.department_id =dt.department_id
      WHERE p.id =?
     `,
    [id]
  );

  return rows ? rows[0] : {}; // คืนค่า index 0 หรือ null ถ้าไม่มีข้อมูล
};

export const deletePosition = async (id: number) => {
  await dbConnection.query("DELETE FROM position WHERE id=?;", [id]);
  return { success: true };
};
export const createPosition = async (data: positionBody) => {
  const [insertResult] = await dbConnection.query(
    `
     INSERT INTO \`position\`
     (name, department_id, team_id, job_band, status, created_at, updated_at, created_by, updated_by)
     VALUES (?, ?, ?, ?, ?, NOW(), NOW(), ?, ?)
     `,
    [
      data.name,
      data.department_id,
      data.team_id,
      data.job_band,
      1,
      data?.created_by,
      data?.created_by,
    ]
  );

  const id = (insertResult as any).insertId;
  console.log("🚀 ~ createPosition ~ id:", id);
  return { id };
};

export const updateDataPosition = async (id: number, data: positionBody) => {
  console.log("🚀 ~ updateDataPosition ~ data:", data);
  const [rows]: any[] = await dbConnection.query(
    `UPDATE position
      SET name = ?,
        job_band= ?, 
        updated_by=?,
        updated_at=current_timestamp()
      WHERE id= ?`,
    [data.name, data.job_band, data?.updated_by, id]
  );
  return { success: true };
};
