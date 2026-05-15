import type { Request } from "express";
import type { AuthedRequest } from "../middleware/authMiddleware.js";

export const getAuthedUserId = (req: Request) => {
  return (req as AuthedRequest).user.id;
};
