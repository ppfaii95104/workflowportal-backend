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
