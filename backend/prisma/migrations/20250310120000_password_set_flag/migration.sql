-- AlterTable
ALTER TABLE "User" ADD COLUMN "password_set" BOOLEAN NOT NULL DEFAULT true;

-- Set existing users as having password set
UPDATE "User" SET "password_set" = true;
