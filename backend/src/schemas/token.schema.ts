import { z } from "zod";

export const tokenPayloadSchema = z.object({
  userId: z.number(),
  email: z.string(),
});
