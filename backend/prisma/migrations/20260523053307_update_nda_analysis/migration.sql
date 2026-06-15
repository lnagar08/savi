/*
  Warnings:

  - You are about to drop the `NdaRevised` table. If the table is not empty, all the data it contains will be lost.

*/
-- DropForeignKey
ALTER TABLE "NdaRevised" DROP CONSTRAINT "NdaRevised_ndaAnalysisId_fkey";

-- AlterTable
ALTER TABLE "NdaAnalysis" ADD COLUMN     "parent_id" INTEGER;

-- DropTable
DROP TABLE "NdaRevised";
