import jwt, { type SignOptions } from "jsonwebtoken";
import env from "../config/env.js";
import { tokenPayloadSchema } from "../schemas/token.schema.js";

export const ACCESS_TOKEN_EXPIRATION = "7d";
export const REFRESH_TOKEN_EXPIRATION = "30d";

type AuthTokenPayload = {
  userId: number;
  email: string;
};

const signToken = (
  payload: AuthTokenPayload,
  secret: string,
  expiresIn: string,
): string => {
  return jwt.sign(payload, secret, { expiresIn: expiresIn as NonNullable<SignOptions["expiresIn"]> });
};

export const signAccessToken = (payload: AuthTokenPayload): string => {
  return signToken(payload, env.JWT_ACCESS_TOKEN_SECRET, ACCESS_TOKEN_EXPIRATION);
};

export const signRefreshToken = (payload: AuthTokenPayload): string => {
  return signToken(payload, env.JWT_REFRESH_TOKEN_SECRET, REFRESH_TOKEN_EXPIRATION);
};

export const verifyAccessToken = (token: string): AuthTokenPayload | null => {
  try {
    const payload = jwt.verify(token, env.JWT_ACCESS_TOKEN_SECRET);
    return tokenPayloadSchema.safeParse(payload).data || null;
  } catch {
    return null;
  }
};

export const verifyRefreshToken = (token: string): AuthTokenPayload | null => {
  try {
    const payload = jwt.verify(token, env.JWT_REFRESH_TOKEN_SECRET);
    return tokenPayloadSchema.safeParse(payload).data || null;
  } catch {
    return null;
  }
};

export type { AuthTokenPayload };
