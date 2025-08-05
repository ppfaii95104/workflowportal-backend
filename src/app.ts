import express from "express";
import routes from "./routes/index.js"; // หรือ "./routes"

const app = express();
const port = process.env.PORT || 8000;

app.use(express.json());

app.get("/", (_req, res) => {
  res.send("✅ Server is running!");
});

app.use("/api", routes); // base path เป็น /api/*

app.listen(port, () => {
  console.log(`🚀 Server is running at http://localhost:${port}`);
});
