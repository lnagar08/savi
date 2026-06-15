-- CreateTable
CREATE TABLE "BidLetter" (
    "id" SERIAL NOT NULL,
    "dealId" INTEGER NOT NULL,
    "projectName" TEXT,
    "purchasePrice" DOUBLE PRECISION,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "rawContent" TEXT,

    CONSTRAINT "BidLetter_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "BidLetterUpdated" (
    "id" SERIAL NOT NULL,
    "dealId" INTEGER NOT NULL,
    "projectName" TEXT,
    "purchasePrice" DOUBLE PRECISION,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "rawContent" TEXT,

    CONSTRAINT "BidLetterUpdated_pkey" PRIMARY KEY ("id")
);

-- AddForeignKey
ALTER TABLE "BidLetter" ADD CONSTRAINT "BidLetter_dealId_fkey" FOREIGN KEY ("dealId") REFERENCES "deals"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "BidLetterUpdated" ADD CONSTRAINT "BidLetterUpdated_dealId_fkey" FOREIGN KEY ("dealId") REFERENCES "deals"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
