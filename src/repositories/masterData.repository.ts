import { dbConnection } from "../config/db.js";

export const getDepartment = async () => {
  const [rows] = await dbConnection.query("SELECT * FROM department");
  return rows;
};
export const getDepartmentTeam = async () => {
  const [rows] = await dbConnection.query(
    `select d.id,d.name,dt.id AS team_id, dt.name AS team_name FROM department d 
      left join department_team dt  on dt.department_id  = d.id`
  );
  return rows;
};
export const getPosition = async () => {
  const [rows] = await dbConnection.query("SELECT * FROM position");
  return rows;
};

export const getEmployee = async () => {
  const [rows] = await dbConnection.query("SELECT * FROM employee");
  return rows;
};
export const getSystemTool = async () => {
  const [rows] = await dbConnection.query("SELECT * FROM system_tools");
  return rows;
};

export const getEmployeeByPosition = async (id: number) => {
  const [rows]: any[] = await dbConnection.query(
    `SELECT * FROM employee WHERE position_id =?;`,
    [id]
  );

  return rows; // คืนค่า index 0 หรือ null ถ้าไม่มีข้อมูล
};
export const getEmployeeByDepartment = async (id: number) => {
  const [rows]: any[] = await dbConnection.query(
    `SELECT * FROM employee WHERE department_id = ? ;`,
    [id]
  );

  return rows; // คืนค่า index 0 หรือ null ถ้าไม่มีข้อมูล
};

export const getPositionEmployee = async () => {
  const [rows] = await dbConnection.query(
    `select p.id,p.name,CONCAT(e.first_name_th,' ',e.last_name_th,' (',e.nickname,')') As employee_name
      FROM position p
      left join employee e on e.position_id  = p.id;`
  );
  return rows;
};
export const getPositioneByDepartment = async (body: {
  department_id: number[];
  team_id: number[];
}) => {
  let query = `SELECT * FROM position WHERE id IS NOT NULL`;
  const params: any[] = [];

  if (body?.department_id && body.department_id.length > 0) {
    const placeholders = body.department_id.map(() => "?").join(", ");
    query += ` AND department_id IN (${placeholders})`;
    params.push(...body.department_id);
  }

  if (body?.team_id && body.team_id.length > 0) {
    const placeholders = body.team_id.map(() => "?").join(", ");
    query += ` AND team_id IN (${placeholders})`;
    params.push(...body.team_id);
  }

  query += ";";

  const [rows]: any[] = await dbConnection.query(query, params);
  return rows;
};
