import { z } from "zod";

export const createDealSchema = z.object({
  dealName: z.string().trim().min(1).max(255),
  description: z.string().trim().max(5000).optional(),
  dealLead: z.string().trim().min(1).max(255).optional(),
  ref: z.string().trim().max(255).optional(),
  location: z.string().trim().max(255),
  transactionValue: z.coerce.number().nonnegative(),
  assetClass: z.string().trim().max(255).optional(),
  sector: z.string().trim().max(255).optional(),
  progress: z.coerce.number().int().min(0).max(100).optional(),
  stage: z.string().trim().max(255).optional(),
  tenant: z.string().trim().max(255),
  leaseTerm: z.string().trim().max(255),
  remainingLease: z.string().trim().max(255).optional(),
});
