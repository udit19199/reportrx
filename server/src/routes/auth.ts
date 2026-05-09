import { Router } from "express";
import { z } from "zod";
import { hashPassword, signToken, verifyPassword } from "../services/auth.js";
import { env } from "../config/env.js";
import type { PrismaClient } from "../generated/prisma/client.js";

const authSchema = z.object({
  email: z.string().email(),
  password: z.string().min(8),
});

export const createAuthRouter = ({ prisma }: { prisma: PrismaClient }) => {
  const router = Router();

  router.post("/register", async (req, res) => {
    const parsed = authSchema.safeParse(req.body);
    if (!parsed.success) {
      return res.status(400).json({ error: "Invalid input" });
    }

    const { email, password } = parsed.data;
    const existing = await prisma.user.findUnique({ where: { email } });
    if (existing) {
      return res.status(409).json({ error: "Email already registered" });
    }

    const passwordHash = await hashPassword(password);
    const user = await prisma.user.create({ data: { email, passwordHash } });
    const token = signToken({ sub: user.id, email: user.email });

    res.cookie("token", token, {
      httpOnly: true,
      sameSite: "lax",
      secure: env.cookieSecure,
      path: "/",
    });

    return res.json({ id: user.id, email: user.email });
  });

  router.post("/login", async (req, res) => {
    const parsed = authSchema.safeParse(req.body);
    if (!parsed.success) {
      return res.status(400).json({ error: "Invalid input" });
    }

    const { email, password } = parsed.data;
    const user = await prisma.user.findUnique({ where: { email } });
    if (!user) {
      return res.status(401).json({ error: "Invalid credentials" });
    }

    const valid = await verifyPassword(password, user.passwordHash);
    if (!valid) {
      return res.status(401).json({ error: "Invalid credentials" });
    }

    const token = signToken({ sub: user.id, email: user.email });
    res.cookie("token", token, {
      httpOnly: true,
      sameSite: "lax",
      secure: env.cookieSecure,
      path: "/",
    });

    return res.json({ id: user.id, email: user.email });
  });

  router.post("/logout", (_req, res) => {
    res.clearCookie("token", { path: "/" });
    return res.json({ ok: true });
  });

  return router;
};
