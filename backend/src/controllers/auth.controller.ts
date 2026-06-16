import type { CookieOptions, Request, Response } from "express";
import { compareSync, hashSync } from "bcrypt-ts";
import { z } from "zod";
import { prisma } from "../lib/prisma.js";
import {
  signAccessToken,
  signRefreshToken,
  verifyRefreshToken,
} from "../lib/jwt.js";
import { resetPasswordSchema, signinSchema, signupSchema } from "../schemas/auth.schema.js";
import { CustomError } from "../lib/custom-error.js";
import crypto from "crypto";
import { AuthenticatedRequest } from '../types/express.js';
const accessTokenMaxAge = 7 * 24 * 60 * 60 * 1000;
const refreshTokenMaxAge = 30 * 24 * 60 * 60 * 1000;

const baseCookieOptions: CookieOptions = {
  httpOnly: true,
  sameSite: "strict",
  secure: process.env.NODE_ENV === "production",
};

const accessTokenOptions: CookieOptions = {
  ...baseCookieOptions,
  path: "/api",
  maxAge: accessTokenMaxAge,
};

const refreshTokenOptions: CookieOptions = {
  ...baseCookieOptions,
  path: "/api/auth",
  maxAge: refreshTokenMaxAge,
};

const issueAuthCookies = (res: Response, accessToken: string, refreshToken: string): void => {
  res.cookie("accessToken", accessToken, accessTokenOptions);
  res.cookie("refreshToken", refreshToken, refreshTokenOptions);
};

export const signup = async (req: Request, res: Response) => {
  const parsedBody = signupSchema.safeParse(req.body);
  if (!parsedBody.success) {
    throw new CustomError("Invalid request body", 400, z.treeifyError(parsedBody.error));
  }

  const { name, email, password } = parsedBody.data;

  const existingUser = await prisma.user.findUnique({ where: { email: email.toLowerCase() } });
  if (existingUser) {
    throw new CustomError("Email is already registered", 409);
  }

  const hashedPassword = hashSync(password, 10);
  const user = await prisma.user.create({
    data: {
      name,
      email: email.toLowerCase(),
      password: hashedPassword,
    },
  });

  const tokenPayload = { userId: user.id, email: user.email };
  const accessToken = signAccessToken(tokenPayload);
  const refreshToken = signRefreshToken(tokenPayload);
  issueAuthCookies(res, accessToken, refreshToken);

  res.status(201).json({
    success: true,
    message: "Signup successful",
    data: {
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
      },
    },
  });
};

export const signin = async (req: Request, res: Response) => {
  const parsedBody = signinSchema.safeParse(req.body);
  if (!parsedBody.success) {
    throw new CustomError("Invalid request body", 400, z.treeifyError(parsedBody.error));
  }

  const { email, password } = parsedBody.data;

  const user = await prisma.user.findUnique({
    where: {
      email: email.toLowerCase(),
    },
  });

  if (!user || !user.password) {
    throw new CustomError("Invalid email or password", 401);
  }

  const isPasswordValid = compareSync(password, user.password);
  if (!isPasswordValid) {
    throw new CustomError("Invalid email or password", 401);
  }

  const tokenPayload = { userId: user.id, email: user.email };
  const accessToken = signAccessToken(tokenPayload);
  const refreshToken = signRefreshToken(tokenPayload);
  issueAuthCookies(res, accessToken, refreshToken);

  res.status(200).json({
    success: true,
    message: "Signin successful",
    data: {
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
      },
    },
  });
};

export const refresh = async (req: Request, res: Response) => {
  const refreshToken = req.cookies?.refreshToken as string | undefined;
  if (!refreshToken) {
    throw new CustomError("Refresh token missing", 401);
  }

  const payload = verifyRefreshToken(refreshToken);
  if (!payload) {
    throw new CustomError("Invalid refresh token", 401);
  }

  const { userId } = payload;

  const user = await prisma.user.findUnique({ where: { id: userId } });
  if (!user) {
    throw new CustomError("Invalid refresh token", 401);
  }

  const tokenPayload = { userId: user.id, email: user.email };
  const nextAccessToken = signAccessToken(tokenPayload);
  const nextRefreshToken = signRefreshToken(tokenPayload);
  issueAuthCookies(res, nextAccessToken, nextRefreshToken);

  res.status(200).json({
    success: true,
    message: "Token refreshed",
  });
};

export const me = async (req: Request, res: Response) => {
  const user = (req as AuthenticatedRequest).user;

  if (!user) {
    throw new CustomError("Unauthorized", 401);
  }

  res.status(200).json({
    success: true,
    message: "Current user fetched successfully",
    data: { user },
  });
};

export const logout = (_req: Request, res: Response) => {
  res.clearCookie("accessToken", accessTokenOptions);
  res.clearCookie("refreshToken", refreshTokenOptions);

  res.status(200).json({
    success: true,
    message: "Logged out successfully",
  });
};


export const resetPasswordLink = async (req: Request, res: Response) => {
  const { email } = req.body;

  if (!email) {
    throw new CustomError("Email is required", 400);
  }

  const user = await prisma.user.findUnique({
    where: {
      email: email.toLowerCase(),
    },
  });

  if (!user) {
    throw new CustomError("If the email is registered, you will receive a password reset link", 200);
  }

  const token = crypto.randomBytes(32).toString("hex");
  const expiresAt = new Date(Date.now() + 15 * 60 * 1000);

  await prisma.passwordResetToken.create({
    data: {
      token,
      expiresAt,
      userId: user.id,
    },
  });

  const resetLink = `${process.env.FRONTEND_URL}/reset-password?token=${token}&email=${encodeURIComponent(user.email)}&userId=${user.id}`;

  console.log(`Password reset link for ${user.email}: ${resetLink}`);

  res.status(200).json({
    success: true,
    message: "If the email is registered, you will receive a password reset link",
  });

}

export const resetPassword = async (req: Request, res: Response) => {
  const parsedBody = resetPasswordSchema.safeParse(req.body);
  if (!parsedBody.success) {
    throw new CustomError("Invalid request body", 400, z.treeifyError(parsedBody.error));
  }

  const { token, userId, email, newPassword } = parsedBody.data;

  const resetTokenRecord = await prisma.passwordResetToken.findUnique({
    where: { token, userId },
  });

  if (!resetTokenRecord || resetTokenRecord.expiresAt < new Date()) {
    throw new CustomError("Link expired, please request a new one", 400);
  }

  const user = await prisma.user.findUnique({
    where: { id: userId, email: email.toLowerCase() },
  });

  if (!user) {
    throw new CustomError("User not found", 404);
  }

  const hashedPassword = hashSync(newPassword, 10);
  await prisma.user.update({
    where: { id: userId },
    data: { password: hashedPassword },
  });

  await prisma.passwordResetToken.delete({
    where: { token, userId },
  });

  res.status(200).json({
    success: true,
    message: "Password reset successful",
  });
}