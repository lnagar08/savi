/*
  Warnings:

  - Added the required column `user_id` to the `documents` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "documents" ADD COLUMN     "user_id" INTEGER NOT NULL;

-- CreateTable
CREATE TABLE "deal_identifications" (
    "id" SERIAL NOT NULL,
    "deal_id" INTEGER NOT NULL,
    "deal_name" TEXT,
    "location" TEXT,
    "asset_type" TEXT,
    "transaction_type" TEXT,
    "tenure" TEXT,
    "ref" TEXT,
    "value" DOUBLE PRECISION,
    "sector" TEXT,
    "stage" TEXT,
    "deal_lead" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "deal_identifications_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "property_details" (
    "id" SERIAL NOT NULL,
    "deal_id" INTEGER NOT NULL,
    "property_description" TEXT,
    "number_of_rooms" INTEGER,
    "floors" INTEGER,
    "site_area" DOUBLE PRECISION,
    "site_area_unit" TEXT,
    "parking_spaces" INTEGER,
    "number_of_assets" INTEGER,
    "assets" JSONB,
    "site_description" TEXT,
    "additional_features" TEXT[],
    "contacts" JSONB,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "property_details_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "tenant_informations" (
    "id" SERIAL NOT NULL,
    "deal_id" INTEGER NOT NULL,
    "tenant_name" TEXT,
    "tenant_parent_company" TEXT,
    "tenants" JSONB,
    "operator" TEXT,
    "backing_investor" TEXT,
    "other_brands" TEXT[],
    "credit_rating" TEXT,
    "business_description" TEXT,
    "financials" JSONB,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "tenant_informations_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "lease_informations" (
    "id" SERIAL NOT NULL,
    "deal_id" INTEGER NOT NULL,
    "lease_type" TEXT,
    "lease_start_date" TIMESTAMP(3),
    "lease_expiry_date" TIMESTAMP(3),
    "lease_term_years" DOUBLE PRECISION,
    "break_option" TEXT,
    "break_option_years" DOUBLE PRECISION,
    "break_option_date" TIMESTAMP(3),
    "remaining_lease" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "lease_informations_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "financial_informations" (
    "id" SERIAL NOT NULL,
    "deal_id" INTEGER NOT NULL,
    "purchase_price" DOUBLE PRECISION,
    "asking_price" DOUBLE PRECISION,
    "net_initial_yield_percent" DOUBLE PRECISION,
    "initial_payment" DOUBLE PRECISION,
    "vat_applicable" BOOLEAN,
    "site_purchase_price" DOUBLE PRECISION,
    "transaction_structure" TEXT,
    "costs" JSONB,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "financial_informations_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "market_contexts" (
    "id" SERIAL NOT NULL,
    "deal_id" INTEGER NOT NULL,
    "location_overview" TEXT,
    "tourism" TEXT,
    "connectivity" TEXT,
    "rental_levels" TEXT,
    "rental_growth_forecast_percent" DOUBLE PRECISION,
    "economic_drivers" TEXT[],
    "economic_indicators" TEXT[],
    "market_characteristics" TEXT[],
    "retail_presence" TEXT[],
    "hotel_market" TEXT,
    "demographics" JSONB,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "market_contexts_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "deal_pipelines" (
    "id" SERIAL NOT NULL,
    "deal_id" INTEGER NOT NULL,
    "planning_status" TEXT,
    "build_period_weeks" INTEGER,
    "handover_period_days" INTEGER,
    "expected_handover" TEXT,
    "expected_operational_date" TEXT,
    "construction_year" INTEGER,
    "redevelopment_years" INTEGER[],
    "ownership_entity" TEXT,
    "developer" TEXT,
    "contractor" TEXT,
    "architect" TEXT,
    "legal_advisor" TEXT,
    "capex_required" TEXT,
    "esg_rating" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "deal_pipelines_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "source_traceability" (
    "id" SERIAL NOT NULL,
    "page" INTEGER NOT NULL,
    "section" TEXT,
    "fields" TEXT[],
    "deal_id" INTEGER NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "source_traceability_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "additional_infos" (
    "id" SERIAL NOT NULL,
    "key" TEXT NOT NULL,
    "value" JSONB NOT NULL,
    "deal_id" INTEGER NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "additional_infos_pkey" PRIMARY KEY ("id")
);

-- AddForeignKey
ALTER TABLE "deal_identifications" ADD CONSTRAINT "deal_identifications_deal_id_fkey" FOREIGN KEY ("deal_id") REFERENCES "deals"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "property_details" ADD CONSTRAINT "property_details_deal_id_fkey" FOREIGN KEY ("deal_id") REFERENCES "deals"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "tenant_informations" ADD CONSTRAINT "tenant_informations_deal_id_fkey" FOREIGN KEY ("deal_id") REFERENCES "deals"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "lease_informations" ADD CONSTRAINT "lease_informations_deal_id_fkey" FOREIGN KEY ("deal_id") REFERENCES "deals"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "financial_informations" ADD CONSTRAINT "financial_informations_deal_id_fkey" FOREIGN KEY ("deal_id") REFERENCES "deals"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "market_contexts" ADD CONSTRAINT "market_contexts_deal_id_fkey" FOREIGN KEY ("deal_id") REFERENCES "deals"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "deal_pipelines" ADD CONSTRAINT "deal_pipelines_deal_id_fkey" FOREIGN KEY ("deal_id") REFERENCES "deals"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "source_traceability" ADD CONSTRAINT "source_traceability_deal_id_fkey" FOREIGN KEY ("deal_id") REFERENCES "deals"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "additional_infos" ADD CONSTRAINT "additional_infos_deal_id_fkey" FOREIGN KEY ("deal_id") REFERENCES "deals"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "documents" ADD CONSTRAINT "documents_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
