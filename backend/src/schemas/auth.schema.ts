import { z } from "zod";

const password = z.string().min(8).max(128).regex(
  /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/,
  'Password must contain uppercase, lowercase, and numbers'
)

export const signupSchema = z.object({
  name: z.string().trim().min(2).max(100),
  email: z.string().trim().pipe(z.email()),
  password: password,
});

export const signinSchema = z.object({
  email: z.string().trim().pipe(z.email()),
  password: z.string().min(1),
});

export const resetPasswordSchema = z.object({
  token: z.string().trim().min(1),
  userId: z.coerce.number().int().positive(),
  email: z.string().trim().pipe(z.email()),
  newPassword: password
});
