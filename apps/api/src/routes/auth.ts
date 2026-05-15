import { Router, type Response } from "express";
import { z } from "zod";
import { authCookieOptions, hashPassword, signToken, verifyPassword } from "../services/auth.js";
import type { PrismaClient } from "../generated/prisma/client.js";

const authSchema = z.object({
  email: z.string().email(),
  password: z.string().min(8),
});

const setAuthCookie = (res: Pick<Response, "cookie">, token: string) => {
  res.cookie("token", token, authCookieOptions);
};

const validateAuthBody = (body: unknown) => {
  const parsed = authSchema.safeParse(body);
  if (!parsed.success) {
    throw new Error("Invalid input");
  }
  return parsed.data;
};

export const createAuthRouter = ({ prisma }: { prisma: PrismaClient }) => {
  const router = Router();

  router.post("/register", async (req, res) => {
    let email: string;
    let password: string;

    try {
      ({ email, password } = validateAuthBody(req.body));
    } catch {
      return res.status(400).json({ error: "Invalid input" });
    }

    const existing = await prisma.user.findUnique({ where: { email } });
    if (existing) {
      return res.status(409).json({ error: "Email already registered" });
    }

    const passwordHash = await hashPassword(password);
    const user = await prisma.user.create({ data: { email, passwordHash } });
    const token = signToken({ sub: user.id, email: user.email });

    setAuthCookie(res, token);
    return res.json({ id: user.id, email: user.email });
  });

  router.post("/login", async (req, res) => {
    let email: string;
    let password: string;

    try {
      ({ email, password } = validateAuthBody(req.body));
    } catch {
      return res.status(400).json({ error: "Invalid input" });
    }

    const user = await prisma.user.findUnique({ where: { email } });
    if (!user) {
      return res.status(401).json({ error: "Invalid credentials" });
    }

    const valid = await verifyPassword(password, user.passwordHash);
    if (!valid) {
      return res.status(401).json({ error: "Invalid credentials" });
    }

    const token = signToken({ sub: user.id, email: user.email });
    setAuthCookie(res, token);
    return res.json({ id: user.id, email: user.email });
  });

  router.post("/logout", (_req, res) => {
    res.clearCookie("token", { path: "/" });
    return res.json({ ok: true });
  });

  return router;
};
