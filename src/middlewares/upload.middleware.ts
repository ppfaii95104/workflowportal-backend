import multer, { type FileFilterCallback } from "multer";
import path from "path";
import fs from "fs";
import type { Request } from "express";

// สร้างโฟลเดอร์ uploads ถ้ายังไม่มี
const uploadDir = "uploads/";
if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir, { recursive: true });
}

const storage = multer.diskStorage({
  destination: (req: Request, file: Express.Multer.File, cb) => {
    cb(null, uploadDir); // เก็บไฟล์ไว้ในโฟลเดอร์ uploads
  },
  filename: (req: Request, file: Express.Multer.File, cb) => {
    const uniqueSuffix = Date.now() + "-" + Math.round(Math.random() * 1e9);
    const filename = `${uniqueSuffix}${path.extname(file.originalname)}`;
    cb(null, filename);
  },
});

const fileFilter = (
  req: Request,
  file: Express.Multer.File,
  cb: FileFilterCallback
) => {
  const allowedTypes = ["image/jpeg", "image/png", "image/jpg"];
  if (allowedTypes.includes(file.mimetype)) {
    cb(null, true);
  } else {
    cb(new Error("Invalid file type. Only JPG, JPEG, PNG allowed."));
  }
};

export const upload = multer({ storage, fileFilter });
