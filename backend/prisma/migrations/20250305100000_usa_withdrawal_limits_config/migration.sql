-- CreateTable SystemConfig
CREATE TABLE "SystemConfig" (
    "id" TEXT NOT NULL,
    "key" TEXT NOT NULL,
    "value" JSONB NOT NULL,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "SystemConfig_pkey" PRIMARY KEY ("id")
);

-- CreateTable LimitTier
CREATE TABLE "LimitTier" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "daily_limit_usdt" DECIMAL(18,6) NOT NULL,
    "monthly_limit_usdt" DECIMAL(18,6) NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "LimitTier_pkey" PRIMARY KEY ("id")
);

-- CreateTable LimitUsage
CREATE TABLE "LimitUsage" (
    "id" TEXT NOT NULL,
    "user_id" TEXT NOT NULL,
    "period_type" TEXT NOT NULL,
    "period_key" TEXT NOT NULL,
    "amount_usdt" DECIMAL(18,6) NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "LimitUsage_pkey" PRIMARY KEY ("id")
);

-- CreateTable BankAccount
CREATE TABLE "BankAccount" (
    "id" TEXT NOT NULL,
    "user_id" TEXT NOT NULL,
    "account_holder" TEXT NOT NULL,
    "account_number" TEXT NOT NULL,
    "routing_number" TEXT NOT NULL,
    "account_type" TEXT NOT NULL,
    "bank_name" TEXT,
    "last_four" TEXT NOT NULL,
    "external_id" TEXT,
    "status" TEXT NOT NULL DEFAULT 'pending',
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "BankAccount_pkey" PRIMARY KEY ("id")
);

-- AlterTable User
ALTER TABLE "User" ADD COLUMN "limit_tier_id" TEXT;

-- AlterTable Withdrawal
ALTER TABLE "Withdrawal" ADD COLUMN "bank_account_id" TEXT;
ALTER TABLE "Withdrawal" ADD COLUMN "partner_transfer_id" TEXT;
ALTER TABLE "Withdrawal" ADD COLUMN "usd_amount" DECIMAL(18,2);
ALTER TABLE "Withdrawal" ADD COLUMN "fee" DECIMAL(18,6);
ALTER TABLE "Withdrawal" ADD COLUMN "eta_minutes" INTEGER;
ALTER TABLE "Withdrawal" ADD COLUMN "metadata" JSONB;
ALTER TABLE "Withdrawal" ADD COLUMN "updated_at" TIMESTAMP(3);

-- CreateIndex
CREATE UNIQUE INDEX "SystemConfig_key_key" ON "SystemConfig"("key");
CREATE UNIQUE INDEX "LimitTier_name_key" ON "LimitTier"("name");
CREATE UNIQUE INDEX "BankAccount_external_id_key" ON "BankAccount"("external_id");
CREATE UNIQUE INDEX "LimitUsage_user_id_period_type_period_key_key" ON "LimitUsage"("user_id", "period_type", "period_key");

-- AddEnumValue
ALTER TYPE "TransactionType" ADD VALUE 'USA_BANK_WITHDRAWAL';

-- AddForeignKey
ALTER TABLE "User" ADD CONSTRAINT "User_limit_tier_id_fkey" FOREIGN KEY ("limit_tier_id") REFERENCES "LimitTier"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "LimitUsage" ADD CONSTRAINT "LimitUsage_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "BankAccount" ADD CONSTRAINT "BankAccount_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "Withdrawal" ADD CONSTRAINT "Withdrawal_bank_account_id_fkey" FOREIGN KEY ("bank_account_id") REFERENCES "BankAccount"("id") ON DELETE SET NULL ON UPDATE CASCADE;
