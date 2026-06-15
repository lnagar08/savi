/*
  Warnings:

  - A unique constraint covering the columns `[deal_id]` on the table `deal_identifications` will be added. If there are existing duplicate values, this will fail.
  - A unique constraint covering the columns `[deal_id]` on the table `deal_pipelines` will be added. If there are existing duplicate values, this will fail.
  - A unique constraint covering the columns `[deal_id]` on the table `financial_informations` will be added. If there are existing duplicate values, this will fail.
  - A unique constraint covering the columns `[deal_id]` on the table `lease_informations` will be added. If there are existing duplicate values, this will fail.
  - A unique constraint covering the columns `[deal_id]` on the table `market_contexts` will be added. If there are existing duplicate values, this will fail.
  - A unique constraint covering the columns `[deal_id]` on the table `property_details` will be added. If there are existing duplicate values, this will fail.
  - A unique constraint covering the columns `[deal_id]` on the table `tenant_informations` will be added. If there are existing duplicate values, this will fail.

*/
-- CreateIndex
CREATE UNIQUE INDEX "deal_identifications_deal_id_key" ON "deal_identifications"("deal_id");

-- CreateIndex
CREATE UNIQUE INDEX "deal_pipelines_deal_id_key" ON "deal_pipelines"("deal_id");

-- CreateIndex
CREATE UNIQUE INDEX "financial_informations_deal_id_key" ON "financial_informations"("deal_id");

-- CreateIndex
CREATE UNIQUE INDEX "lease_informations_deal_id_key" ON "lease_informations"("deal_id");

-- CreateIndex
CREATE UNIQUE INDEX "market_contexts_deal_id_key" ON "market_contexts"("deal_id");

-- CreateIndex
CREATE UNIQUE INDEX "property_details_deal_id_key" ON "property_details"("deal_id");

-- CreateIndex
CREATE UNIQUE INDEX "tenant_informations_deal_id_key" ON "tenant_informations"("deal_id");
