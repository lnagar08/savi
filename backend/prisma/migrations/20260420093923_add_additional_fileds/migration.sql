-- AlterTable
ALTER TABLE "lease_informations" ADD COLUMN     "cap" TEXT,
ADD COLUMN     "collar" TEXT,
ADD COLUMN     "creadit_rating" TEXT,
ADD COLUMN     "indexation_formula" TEXT,
ADD COLUMN     "pricing_date" TIMESTAMP(3),
ADD COLUMN     "review_pattern" TEXT,
ADD COLUMN     "spread" TEXT,
ADD COLUMN     "stabllised_NOI" TEXT;
