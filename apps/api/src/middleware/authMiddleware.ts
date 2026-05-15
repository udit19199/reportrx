import { type NextFunction, type Request, type Response } from "express";

import { verifyToken } from "../services/auth.js";
import { verifyAuth0AccessToken } from "../services/auth0.js";
import { createPrismaClient } from "../services/prisma.js";

export type AuthedRequest = Request & { user: { id: string; email: string } };

const prisma = createPrismaClient();

const getBearerToken = (req: Request) => {
  const authorization = req.headers.authorization;
  if (!authorization) return null;

  const match = authorization.match(/^Bearer\s+(.+)$/i);
  return match?.[1]?.trim() ?? null;
};

export const requireAuth = async (req: Request, res: Response, next: NextFunction) => {
  const bearerToken = getBearerToken(req);
  const cookieToken = req.cookies?.token as string | undefined;
  const token = bearerToken ?? cookieToken ?? null;

  if (!token) {
    return res.status(401).json({ error: "Unauthorized" });
  }

  try {
    if (bearerToken) {
      const profile = await verifyAuth0AccessToken(token);
      const user =
        (await prisma.user.findUnique({ where: { email: profile.email } })) ??
        (await prisma.user.create({ data: { email: profile.email, passwordHash: profile.sub } }));

      (req as AuthedRequest).user = { id: user.id, email: user.email };
      return next();
    }

    const payload = verifyToken(token);
    (req as AuthedRequest).user = { id: payload.sub, email: payload.email };
    return next();
  } catch {
    return res.status(401).json({ error: "Unauthorized" });
  }
};
