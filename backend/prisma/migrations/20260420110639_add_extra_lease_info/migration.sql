-- AlterTable
ALTER TABLE "lease_informations" ADD COLUMN     "assumed_costs" TEXT,
ADD COLUMN     "comparator_bond_spread" TEXT,
ADD COLUMN     "duration_years" TEXT,
ADD COLUMN     "gross_price_percentage" TEXT,
ADD COLUMN     "illiquidity_premium_percent" TEXT,
ADD COLUMN     "income_cover_ratio_percent" TEXT,
ADD COLUMN     "internal_rate_of_return" TEXT,
ADD COLUMN     "loan_to_value_percent" TEXT,
ADD COLUMN     "voluntary_provided_funding" TEXT,
ADD COLUMN     "weighted_average_lease_expiry_years" TEXT;
