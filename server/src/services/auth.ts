import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";
import { env } from "../config/env.js";

export const hashPassword = async (password: string) => {
  const saltRounds = 10;
  return bcrypt.hash(password, saltRounds);
};

export const verifyPassword = async (password: string, hash: string) => {
  return bcrypt.compare(password, hash);
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
