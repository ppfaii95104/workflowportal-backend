import express from "express";
import cors from "cors";
import routes from "./routes/index.js"; // หรือ "./routes"

const app = express();
const port = process.env.PORT || 8000;

app.use(express.json());

// 🔹 เพิ่ม CORS middleware
app.use(
  cors({
    origin: "http://localhost:5173", // frontend ของคุณ
    methods: ["GET", "POST", "PUT", "DELETE"],
    credentials: true,
  })
);

app.get("/", (_req, res) => {
  res.send("✅ Server is running!");
});

app.use("/api", routes); // base path เป็น /api/*

app.listen(port, () => {
  console.log(`🚀 Server is running at http://localhost:${port}`);
});
