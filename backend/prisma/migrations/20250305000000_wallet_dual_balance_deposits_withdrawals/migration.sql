-- AlterTable: Add balance_ves and balance_usdt to Wallet
ALTER TABLE "Wallet" ADD COLUMN IF NOT EXISTS "balance_ves" DECIMAL(18,2) NOT NULL DEFAULT 0;
ALTER TABLE "Wallet" ADD COLUMN IF NOT EXISTS "balance_usdt" DECIMAL(18,6) NOT NULL DEFAULT 0;

-- Migrate existing balance to balance_usdt
UPDATE "Wallet" SET "balance_usdt" = "balance" WHERE "balance" IS NOT NULL;

-- Drop old columns
ALTER TABLE "Wallet" DROP COLUMN IF EXISTS "balance";
ALTER TABLE "Wallet" DROP COLUMN IF EXISTS "currency";

-- Add new enum values to TransactionType (PostgreSQL: ADD VALUE cannot run in transaction with other DDL in some versions, run separately if needed)
ALTER TYPE "TransactionType" ADD VALUE 'P2P_VES';
ALTER TYPE "TransactionType" ADD VALUE 'CONVERSION_VES_TO_USDT';
ALTER TYPE "TransactionType" ADD VALUE 'CONVERSION_USDT_TO_VES';

-- CreateEnum DepositStatus
CREATE TYPE "DepositStatus" AS ENUM ('PENDING', 'CONFIRMED', 'REJECTED');

-- CreateEnum WithdrawalStatus
CREATE TYPE "WithdrawalStatus" AS ENUM ('PENDING', 'PROCESSING', 'COMPLETED', 'FAILED');

-- CreateTable Deposit
CREATE TABLE "Deposit" (
    "id" TEXT NOT NULL,
    "user_id" TEXT NOT NULL,
    "amount" DECIMAL(18,2) NOT NULL,
    "reference" TEXT NOT NULL,
    "status" "DepositStatus" NOT NULL DEFAULT 'PENDING',
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Deposit_pkey" PRIMARY KEY ("id")
);

-- CreateTable Withdrawal
CREATE TABLE "Withdrawal" (
    "id" TEXT NOT NULL,
    "user_id" TEXT NOT NULL,
    "amount" DECIMAL(18,6) NOT NULL,
    "destination" TEXT NOT NULL,
    "destination_email" TEXT,
    "destination_name" TEXT,
    "status" "WithdrawalStatus" NOT NULL DEFAULT 'PENDING',
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Withdrawal_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "Deposit_reference_key" ON "Deposit"("reference");

-- AddForeignKey
ALTER TABLE "Deposit" ADD CONSTRAINT "Deposit_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "Withdrawal" ADD CONSTRAINT "Withdrawal_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
