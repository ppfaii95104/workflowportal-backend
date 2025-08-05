import type { Request, Response } from "express";
import { findAllUsers, addUser } from "../repositories/user.repository.js";

export const getUsers = (_req: Request, res: Response) => {
  const users = findAllUsers();
  res.json(users);
};

export const createUser = (req: Request, res: Response) => {
  const { name } = req.body;
  if (!name) return res.status(400).json({ error: "Name is required" });

  const newUser = addUser({ name });
  res.status(201).json(newUser);
};
