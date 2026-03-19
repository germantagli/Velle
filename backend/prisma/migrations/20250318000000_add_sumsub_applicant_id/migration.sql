-- AlterTable
ALTER TABLE "User" ADD COLUMN "sumsub_applicant_id" TEXT;

-- CreateIndex
CREATE UNIQUE INDEX "User_sumsub_applicant_id_key" ON "User"("sumsub_applicant_id");
