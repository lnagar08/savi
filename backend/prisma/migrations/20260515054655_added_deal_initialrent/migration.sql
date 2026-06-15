/*
  Warnings:

  - You are about to drop the column `starting_rent` on the `lease_informations` table. All the data in the column will be lost.

*/
-- AlterTable
ALTER TABLE "deal_identifications" ADD COLUMN     "starting_rent" INTEGER;

-- AlterTable
ALTER TABLE "lease_informations" DROP COLUMN "starting_rent";
