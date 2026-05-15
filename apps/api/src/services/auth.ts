import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";
import { env } from "../config/env.js";

const SALT_ROUNDS = 10;

export const hashPassword = async (password: string) => {
  return bcrypt.hash(password, SALT_ROUNDS);
};

export const verifyPassword = async (password: string, hash: string) => {
  try {
    return await bcrypt.compare(password, hash);
  } catch {
    return false;
  }
};

export type JwtPayload = {
  sub: string;
  email: string;
};

export const signToken = (payload: JwtPayload) => {
  return jwt.sign(payload, env.jwtSecret, {
    expiresIn: `${env.jwtExpiresMinutes}m`,
  });
};

export const verifyToken = (token: string): JwtPayload => {
  return jwt.verify(token, env.jwtSecret) as JwtPayload;
};

export const authCookieOptions = {
  httpOnly: true,
  sameSite: "lax" as const,
  secure: env.cookieSecure,
  path: "/",
};
