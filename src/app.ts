import express from "express";
import cors from "cors";
import routes from "./routes/index.js";
import { dbConnection } from "./config/db.js";

const app = express();
const port = process.env.PORT || 8000;

// อนุญาตทุก origin
app.use(
  cors({
    origin: "*", // อนุญาตทุก domain
    methods: ["GET", "POST", "PUT", "DELETE"],
  }),
);

app.use(express.json());

// Serve static files จากโฟลเดอร์ uploads
app.use("/uploads", express.static("uploads"));

app.use("/api", routes);

app.listen(port, async () => {
  try {
    const connection = await dbConnection.getConnection();
    console.log(
      `Database connected successfully (DB_HOST: ${process.env.DB_HOST})`,
    );
    connection.release();
  } catch (error) {
    console.error("Database connection failed:", error);
  }
  console.log(`🚀 Server running on port ${port}`, "------");
});
