-- CreateTable
CREATE TABLE "NdaRevised" (
    "id" SERIAL NOT NULL,
    "ndaAnalysisId" INTEGER NOT NULL,
    "type" TEXT NOT NULL DEFAULT 'template',
    "version" INTEGER NOT NULL DEFAULT 1,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "NdaRevised_pkey" PRIMARY KEY ("id")
);

-- AddForeignKey
ALTER TABLE "NdaRevised" ADD CONSTRAINT "NdaRevised_ndaAnalysisId_fkey" FOREIGN KEY ("ndaAnalysisId") REFERENCES "NdaAnalysis"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
