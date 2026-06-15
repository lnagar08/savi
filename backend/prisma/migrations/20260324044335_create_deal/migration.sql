-- CreateTable
CREATE TABLE "deals" (
    "id" SERIAL NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "deal_lead" TEXT NOT NULL,
    "ref" TEXT,
    "location" TEXT,
    "value" DOUBLE PRECISION,
    "sector" TEXT,
    "progress" INTEGER NOT NULL DEFAULT 0,
    "stage" TEXT,
    "tenant" TEXT,
    "lease_term" TEXT,
    "remaining_lease" TEXT,
    "extracted_text" TEXT,
    "user_id" INTEGER NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "deals_pkey" PRIMARY KEY ("id")
);

-- AddForeignKey
ALTER TABLE "deals" ADD CONSTRAINT "deals_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
