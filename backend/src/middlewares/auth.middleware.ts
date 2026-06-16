import type { NextFunction, Request, Response } from "express";
import { verifyAccessToken } from "../lib/jwt.js";
import { prisma } from "../lib/prisma.js";
import { CustomError } from "../lib/custom-error.js";
import { AuthenticatedRequest } from '../types/express.js';
const getAccessTokenFromRequest = (req: Request): string | undefined => {
  const cookieToken = req.cookies?.accessToken as string | undefined;
  if (cookieToken) {
    return cookieToken;
  }

  const authorization = req.get("authorization");
  if (!authorization) {
    return undefined;
  }

  const [scheme, token] = authorization.split(" ");
  if (scheme?.toLowerCase() !== "bearer" || !token) {
    return undefined;
  }

  return token;
};

export const authMiddleware = async (
  req: Request,
  _res: Response,
  next: NextFunction,
): Promise<void> => {
  const accessToken = getAccessTokenFromRequest(req);

  const tokenPayload = verifyAccessToken(accessToken!);
  if (!tokenPayload) {
    throw new CustomError("Invalid access token", 401);
  }

  const { userId } = tokenPayload;

  const user = await prisma.user.findUnique({
    where: { id: userId },
    omit: {
      password: true,
    },
  });

  if (!user) {
    throw new CustomError("User not found", 404);
  }

  (req as AuthenticatedRequest).user = user;
  next();
};

