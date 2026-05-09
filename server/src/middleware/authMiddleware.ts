import { Request, Response, NextFunction } from "express";
import { verifyToken } from "../services/auth.js";

export type AuthedRequest = Request & { user: { id: string; email: string } };

export const requireAuth = (req: Request, res: Response, next: NextFunction) => {
  const token = req.cookies?.token as string | undefined;
  if (!token) {
    return res.status(401).json({ error: "Unauthorized" });
  }

  try {
    const payload = verifyToken(token);
    (req as AuthedRequest).user = { id: payload.sub, email: payload.email };
    return next();
  } catch (error) {
    return res.status(401).json({ error: "Unauthorized" });
  }
};
