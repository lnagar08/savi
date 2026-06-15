/*
  Warnings:

  - You are about to drop the column `starting_rent` on the `deal_identifications` table. All the data in the column will be lost.

*/
-- AlterTable
ALTER TABLE "deal_identifications" DROP COLUMN "starting_rent";

-- AlterTable
ALTER TABLE "lease_informations" ADD COLUMN     "starting_rent" INTEGER;
