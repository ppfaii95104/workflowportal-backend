import { dbConnection } from "../config/db.js";

export const getDepartment = async () => {
  const [rows] = await dbConnection.query(
    "SELECT * FROM department WHERE status IS NOT NULL"
  );
  return rows;
};
export const getTeam = async (body: any) => {
  let query = `
   SELECT * FROM department_team WHERE name IS NOT NULL
  \n`;
  const params: any[] = [];

  if (body?.department_id) {
    query += ` AND department_id = ? \n`;
    params.push(body.department_id);
  }

  query += ";";
  const [rows]: any[] = await dbConnection.query(query, params);

  return rows;
};
export const getDepartmentTeam = async () => {
  const [rows] = await dbConnection.query(
    `SELECT 
      d.id,
      d.name,
      dt.id AS team_id,
      dt.name AS team_name
    FROM department d
    LEFT JOIN department_team dt ON dt.department_id = d.id
    ORDER BY 
      CASE 
        WHEN d.department_code IS NULL OR d.department_code = '' THEN 1
        ELSE 0
      END,
      d.id;;`
  );
  return rows;
};
export const getPosition = async () => {
  const [rows] = await dbConnection.query("SELECT * FROM position");
  return rows;
};

export const getEmployee = async () => {
  const [rows] =
    await dbConnection.query(`SELECT e.*,p.name AS position_name , dt.name AS team_name,d.name AS department_name FROM employee e
    left join position p on p.id = e.position_id
    left join department_team dt  on dt.department_id  = e.department_id AND e.team_id = dt.id
    left join department d  on d.id  = e.department_id `);
  return rows;
};
export const getSystemTool = async () => {
  const [rows] = await dbConnection.query("SELECT * FROM system_tools");
  return rows;
};

export const getEmployeeByPosition = async (body: {
  department_id?: number[];
  team_id?: number[];
  position_id?: number;
}) => {
  console.log("getEmployeeByPosition CALLED WITH BODY:", JSON.stringify(body));

  let query = `SELECT e.* 
    FROM employee e 
    LEFT JOIN department d ON d.id = e.department_id
    WHERE e.id IS NOT NULL`;
  const params: any[] = [];

  // ✅ case พิเศษ: department_id = 11 → ข้าม filter ดึงทั้งหมด
  if (Array.isArray(body?.department_id) && body.department_id.includes(11)) {
    const [rows]: any[] = await dbConnection.query(
      `SELECT e.* 
        FROM employee e 
        LEFT JOIN department d ON d.id = e.department_id`
    );
    return rows;
  }

  // 🔥 รวมทุกเงื่อนไขเป็น OR
  const orConditions: string[] = [];

  // e.department_id
  if (Array.isArray(body?.department_id) && body.department_id.length > 0) {
    const placeholders = body.department_id.map(() => "?").join(", ");
    orConditions.push(`e.department_id IN (${placeholders})`);
    params.push(...body.department_id);

    // mapping d.type สำหรับ department_id เฉพาะ
    const typeMap: Record<number, number> = { 10: 1, 12: 2, 14: 3 };
    body.department_id.forEach((depId) => {
      if (typeMap[depId]) orConditions.push(`d.type = ${typeMap[depId]}`);
    });
  }

  // e.team_id
  if (Array.isArray(body?.team_id) && body.team_id.length > 0) {
    const placeholdersTeam = body.team_id.map(() => "?").join(", ");
    orConditions.push(`e.team_id IN (${placeholdersTeam})`);
    params.push(...body.team_id);
  }

  // e.position_id
  if (body?.position_id !== undefined && body.position_id !== null) {
    orConditions.push(`e.position_id = ?`);
    params.push(body.position_id);
  }

  // ถ้ามี OR condition อย่างน้อย 1 อัน → wrap ด้วยวงเล็บ
  if (orConditions.length > 0) {
    query += ` AND ( ${orConditions.join(" OR ")} )`;
  }

  // Debug log
  console.log("QUERY:", query);
  console.log("PARAMS:", JSON.stringify(params));

  const [rows]: any[] = await dbConnection.query(query, params);
  return rows;
};

export const getEmployeeByDepartment = async (id: number) => {
  const [rows]: any[] = await dbConnection.query(
    `SELECT * FROM employee WHERE department_id = ? ;`,
    [id]
  );

  return rows; // คืนค่า index 0 หรือ null ถ้าไม่มีข้อมูล
};

export const getPositionEmployee = async (body: {
  department_id: number[];
  team_id: number[];
}) => {
  let query = `SELECT 
      p.id, 
      p.name, 
      CONCAT(e.name_th, ' (', e.nickname, ')') AS employee_name
    FROM position p
    LEFT JOIN employee e ON e.position_id = p.id
    LEFT JOIN department d ON d.id = p.department_id
    WHERE p.department_id IS NOT NULL`;
  const params: any[] = [];

  // ✅ case พิเศษ: department_id = 11 → ข้าม filter ดึงทั้งหมด
  if (Array.isArray(body?.department_id) && body.department_id.includes(11)) {
    const [rows]: any[] = await dbConnection.query(
      `SELECT 
          p.id, 
          p.name, 
          CONCAT(e.name_th, ' (', e.nickname, ')') AS employee_name
        FROM position p
        LEFT JOIN employee e ON e.position_id = p.id
        LEFT JOIN department d ON d.id = p.department_id
        WHERE p.department_id IS NOT NULL
        GROUP BY p.id
        UNION 
        SELECT p.id, 
              p.name,
              null AS employee_name 
        FROM position p
        WHERE p.department_id IS NULL`
    );
    return rows;
  }

  // 🔥 รวมทุกเงื่อนไขเป็น OR
  const orConditions: string[] = [];

  // p.department_id
  if (Array.isArray(body?.department_id) && body.department_id.length > 0) {
    const placeholders = body.department_id.map(() => "?").join(", ");
    orConditions.push(`p.department_id IN (${placeholders})`);
    params.push(...body.department_id);

    // mapping d.type สำหรับ department_id เฉพาะ
    const typeMap: Record<number, number> = { 10: 1, 12: 2, 14: 3 };
    body.department_id.forEach((depId) => {
      if (typeMap[depId]) orConditions.push(`d.type = ${typeMap[depId]}`);
    });
  }

  // e.job_band = 3 สำหรับ department_id = 13
  if (
    (Array.isArray(body?.department_id) && body.department_id.includes(13)) ||
    (Array.isArray(body?.department_id) && body.department_id.includes(20))
  ) {
    orConditions.push(`e.job_band = 3`);
  }

  // p.team_id
  if (Array.isArray(body?.team_id) && body.team_id.length > 0) {
    const placeholdersTeam = body.team_id.map(() => "?").join(", ");
    orConditions.push(`p.team_id IN (${placeholdersTeam})`);
    params.push(...body.team_id);
  }

  // ถ้ามี OR conditionอย่างน้อย 1 อัน → wrap ด้วยวงเล็บ
  if (orConditions.length > 0) {
    query += ` AND ( ${orConditions.join(" OR ")} )`;
  }

  // ✅ group by p.id เพื่อไม่ให้ซ้ำ
  query += `
          UNION
          SELECT p.id, 
              p.name,
              null AS employee_name 
        FROM position p
        WHERE p.department_id IS NULL`;

  console.log("QUERY:", query);
  console.log("PARAMS:", JSON.stringify(params));

  const [rows]: any[] = await dbConnection.query(query, params);
  return rows;
};

export const getPositioneByDepartment = async (body: {
  department_id: number[];
  team_id: number[];
}) => {
  let query = `SELECT p.* FROM position p
    LEFT JOIN department d ON d.id = p.department_id
    LEFT JOIN employee e ON e.position_id = p.id
    WHERE p.department_id IS NOT NULL`;
  const params: any[] = [];

  // ✅ case พิเศษ: department_id = 11 → ข้าม filter ดึงทั้งหมด
  if (Array.isArray(body?.department_id) && body.department_id.includes(11)) {
    const [rows]: any[] = await dbConnection.query(
      `SELECT p.* FROM position p 
        LEFT JOIN department d ON d.id = p.department_id
        LEFT JOIN employee e ON e.position_id = p.id
        GROUP BY p.id`
    );
    return rows;
  }

  // 🔥 รวมทุกเงื่อนไขเป็น OR
  const orConditions: string[] = [];

  // p.department_id
  if (Array.isArray(body?.department_id) && body.department_id.length > 0) {
    const placeholders = body.department_id.map(() => "?").join(", ");
    orConditions.push(`p.department_id IN (${placeholders})`);
    params.push(...body.department_id);

    // mapping d.type
    const typeMap: Record<number, number> = { 10: 1, 12: 2, 14: 3 };
    body.department_id.forEach((depId) => {
      if (typeMap[depId]) orConditions.push(`d.type = ${typeMap[depId]}`);
    });
  }

  // e.job_band (เฉพาะกรณี department_id = 13)
  if (
    (Array.isArray(body?.department_id) && body.department_id.includes(13)) ||
    (Array.isArray(body?.department_id) && body.department_id.includes(20))
  ) {
    orConditions.push(`e.job_band = 3`);
  }

  // p.team_id
  if (Array.isArray(body?.team_id) && body.team_id.length > 0) {
    const placeholdersTeam = body.team_id.map(() => "?").join(", ");
    orConditions.push(`p.team_id IN (${placeholdersTeam})`);
    params.push(...body.team_id);
  }

  // ถ้ามี OR conditionอย่างน้อย 1 อัน → wrap ด้วยวงเล็บ
  if (orConditions.length > 0) {
    query += ` AND ( ${orConditions.join(" OR ")} )`;
  }

  // ✅ group by p.id เพื่อไม่ให้ซ้ำ
  query += ` GROUP BY p.id;`;

  console.log("QUERY:", query);
  console.log("PARAMS:", JSON.stringify(params));

  const [rows]: any[] = await dbConnection.query(query, params);
  return rows;
};
