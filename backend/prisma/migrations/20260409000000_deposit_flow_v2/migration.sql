-- Expand DepositStatus enum for the new VES deposit flow
DO $$
BEGIN
  ALTER TYPE "DepositStatus" ADD VALUE IF NOT EXISTS 'PENDING_PAYMENT';
  ALTER TYPE "DepositStatus" ADD VALUE IF NOT EXISTS 'PAYMENT_SUBMITTED';
  ALTER TYPE "DepositStatus" ADD VALUE IF NOT EXISTS 'VERIFICATION_PENDING';
  ALTER TYPE "DepositStatus" ADD VALUE IF NOT EXISTS 'MANUAL_REVIEW';
  ALTER TYPE "DepositStatus" ADD VALUE IF NOT EXISTS 'EXPIRED';
EXCEPTION
  WHEN duplicate_object THEN NULL;
END $$;

-- Add new columns required by the improved deposit flow
ALTER TABLE "Deposit"
  ADD COLUMN IF NOT EXISTS "amount_requested" DECIMAL(18,2),
  ADD COLUMN IF NOT EXISTS "exact_amount_to_pay" DECIMAL(18,2),
  ADD COLUMN IF NOT EXISTS "expires_at" TIMESTAMP(3),
  ADD COLUMN IF NOT EXISTS "payment_submitted_at" TIMESTAMP(3),
  ADD COLUMN IF NOT EXISTS "verification_started_at" TIMESTAMP(3),
  ADD COLUMN IF NOT EXISTS "verified_at" TIMESTAMP(3),
  ADD COLUMN IF NOT EXISTS "confirmed_at" TIMESTAMP(3),
  ADD COLUMN IF NOT EXISTS "credited_at" TIMESTAMP(3),
  ADD COLUMN IF NOT EXISTS "payer_phone" TEXT,
  ADD COLUMN IF NOT EXISTS "payer_bank" TEXT,
  ADD COLUMN IF NOT EXISTS "payer_reference" TEXT,
  ADD COLUMN IF NOT EXISTS "payer_receipt_url" TEXT,
  ADD COLUMN IF NOT EXISTS "bank_provider_result" JSONB,
  ADD COLUMN IF NOT EXISTS "bank_reconciliation_ref" TEXT,
  ADD COLUMN IF NOT EXISTS "manual_review_reason" TEXT,
  ADD COLUMN IF NOT EXISTS "reviewed_by" TEXT,
  ADD COLUMN IF NOT EXISTS "reviewed_at" TIMESTAMP(3),
  ADD COLUMN IF NOT EXISTS "updated_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP;

-- Backfill existing rows so NOT NULL constraints can be enforced
UPDATE "Deposit"
SET
  "amount_requested" = COALESCE("amount_requested", "amount"),
  "exact_amount_to_pay" = COALESCE("exact_amount_to_pay", "amount"),
  "expires_at" = COALESCE("expires_at", "created_at" + INTERVAL '15 minutes')
WHERE
  "amount_requested" IS NULL
  OR "exact_amount_to_pay" IS NULL
  OR "expires_at" IS NULL;

-- Normalize old enum state to the new state machine
UPDATE "Deposit"
SET "status" = 'PENDING_PAYMENT'
WHERE "status" = 'PENDING';

-- Enforce constraints and defaults
ALTER TABLE "Deposit"
  ALTER COLUMN "amount_requested" SET NOT NULL,
  ALTER COLUMN "exact_amount_to_pay" SET NOT NULL,
  ALTER COLUMN "expires_at" SET NOT NULL,
  ALTER COLUMN "status" SET DEFAULT 'PENDING_PAYMENT';
