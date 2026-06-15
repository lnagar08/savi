/*
  Warnings:

  - You are about to drop the column `issues` on the `NdaAnalysis` table. All the data in the column will be lost.
  - You are about to drop the column `ndaDraft` on the `NdaAnalysis` table. All the data in the column will be lost.
  - You are about to drop the column `ndaTemplate` on the `NdaAnalysis` table. All the data in the column will be lost.
  - You are about to drop the column `status` on the `NdaAnalysis` table. All the data in the column will be lost.

*/
-- AlterTable
ALTER TABLE "NdaAnalysis" DROP COLUMN "issues",
DROP COLUMN "ndaDraft",
DROP COLUMN "ndaTemplate",
DROP COLUMN "status",
ADD COLUMN     "fileName" TEXT,
ADD COLUMN     "fileUrl" TEXT,
ADD COLUMN     "type" TEXT NOT NULL DEFAULT 'draft',
ADD COLUMN     "version" INTEGER NOT NULL DEFAULT 1;
