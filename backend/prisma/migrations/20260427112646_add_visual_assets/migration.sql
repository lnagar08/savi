-- CreateTable
CREATE TABLE "visual_assets" (
    "id" SERIAL NOT NULL,
    "deal_id" INTEGER NOT NULL,
    "asset_images" JSONB,
    "aerial_views" JSONB,
    "site_plans" JSONB,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "visual_assets_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "visual_assets_deal_id_key" ON "visual_assets"("deal_id");

-- AddForeignKey
ALTER TABLE "visual_assets" ADD CONSTRAINT "visual_assets_deal_id_fkey" FOREIGN KEY ("deal_id") REFERENCES "deals"("id") ON DELETE CASCADE ON UPDATE CASCADE;
