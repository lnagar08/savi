-- CreateTable
CREATE TABLE "DealReport" (
    "id" SERIAL NOT NULL,
    "dealId" INTEGER NOT NULL,
    "fileName" TEXT,
    "fileUrl" TEXT,
    "reportContent" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "DealReport_pkey" PRIMARY KEY ("id")
);

-- AddForeignKey
ALTER TABLE "DealReport" ADD CONSTRAINT "DealReport_dealId_fkey" FOREIGN KEY ("dealId") REFERENCES "deals"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
