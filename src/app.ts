import express from "express";
import cors from "cors";
import routes from "./routes/index.js";

const app = express();
const port = process.env.PORT || 8000;

// อนุญาตทุก origin
app.use(
  cors({
    origin: "*", // อนุญาตทุก domain
    methods: ["GET", "POST", "PUT", "DELETE"],
  })
);

app.use(express.json());
app.use("/api", routes);

app.listen(port, () => {
  console.log(`🚀 Server running on port ${port}`);
});
