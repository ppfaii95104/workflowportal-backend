import express from "express";
import cors from "cors";
import routes from "./routes/index.js"; // หรือ "./routes"

const app = express();
const port = process.env.PORT || 8000;

// 🔹 กำหนด allowed origins
const allowedOrigins = [
  "http://localhost:3000", // สำหรับ dev
  process.env.DOMAIN, // สำหรับ production frontend
];

// 🔹 เพิ่ม CORS middleware
app.use(
  cors({
    origin: (origin, callback) => {
      // ถ้า origin ว่าง เช่น Postman, curl ให้อนุญาต
      if (!origin || allowedOrigins.includes(origin)) {
        callback(null, true);
      } else {
        callback(new Error(`CORS policy: ${origin} not allowed`));
      }
    },
    methods: ["GET", "POST", "PUT", "DELETE"],
    credentials: true, // ถ้าใช้ cookies / auth
  })
);

// 🔹 body parser
app.use(express.json());

// 🔹 Test endpoint
app.get("/", (_req, res) => {
  res.send(
    `✅ Server is running! Allowed frontend: ${allowedOrigins.join(", ")}`
  );
});

// 🔹 API routes
app.use("/api", routes);

// 🔹 Start server
app.listen(port, () => {
  console.log(
    `🚀 Server is running at http://localhost:${port} or ${process.env.DOMAIN}`
  );
});
