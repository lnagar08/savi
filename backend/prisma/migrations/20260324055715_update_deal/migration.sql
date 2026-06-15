-- AlterTable
ALTER TABLE "deals" ADD COLUMN     "asset_class" TEXT,
ALTER COLUMN "deal_lead" DROP NOT NULL;
