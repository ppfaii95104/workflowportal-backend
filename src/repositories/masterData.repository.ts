import { dbConnection } from "../config/db.js";

export const getDepartment = async () => {
  const [rows] = await dbConnection.query("SELECT * FROM department");
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
