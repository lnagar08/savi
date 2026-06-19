-- DropForeignKey
ALTER TABLE "BidLetter" DROP CONSTRAINT "BidLetter_dealId_fkey";

-- DropForeignKey
ALTER TABLE "BidLetterUpdated" DROP CONSTRAINT "BidLetterUpdated_dealId_fkey";

-- DropForeignKey
ALTER TABLE "DealReport" DROP CONSTRAINT "DealReport_dealId_fkey";

-- DropForeignKey
ALTER TABLE "NdaAnalysis" DROP CONSTRAINT "NdaAnalysis_dealId_fkey";

-- DropForeignKey
ALTER TABLE "documents" DROP CONSTRAINT "documents_deal_id_fkey";

-- AddForeignKey
ALTER TABLE "documents" ADD CONSTRAINT "documents_deal_id_fkey" FOREIGN KEY ("deal_id") REFERENCES "deals"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "BidLetter" ADD CONSTRAINT "BidLetter_dealId_fkey" FOREIGN KEY ("dealId") REFERENCES "deals"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "BidLetterUpdated" ADD CONSTRAINT "BidLetterUpdated_dealId_fkey" FOREIGN KEY ("dealId") REFERENCES "deals"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "DealReport" ADD CONSTRAINT "DealReport_dealId_fkey" FOREIGN KEY ("dealId") REFERENCES "deals"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "NdaAnalysis" ADD CONSTRAINT "NdaAnalysis_dealId_fkey" FOREIGN KEY ("dealId") REFERENCES "deals"("id") ON DELETE CASCADE ON UPDATE CASCADE;
