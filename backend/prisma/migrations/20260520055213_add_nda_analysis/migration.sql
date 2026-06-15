-- CreateTable
CREATE TABLE "NdaAnalysis" (
    "id" SERIAL NOT NULL,
    "dealId" INTEGER NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'Amber',
    "issues" INTEGER NOT NULL DEFAULT 0,
    "ndaTemplate" TEXT,
    "ndaDraft" TEXT,
    "analysisResult" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "NdaAnalysis_pkey" PRIMARY KEY ("id")
);

-- AddForeignKey
ALTER TABLE "NdaAnalysis" ADD CONSTRAINT "NdaAnalysis_dealId_fkey" FOREIGN KEY ("dealId") REFERENCES "deals"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
