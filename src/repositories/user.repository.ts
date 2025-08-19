import { dbConnection } from "../config/db.js";

export const findAllUsers = async () => {
  const [rows] = await dbConnection.query("SELECT * FROM position");
  return rows;
};
