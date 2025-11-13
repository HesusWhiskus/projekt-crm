-- CreateEnum
DO $$ BEGIN
 CREATE TYPE "ClientType" AS ENUM ('PERSON', 'COMPANY');
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;

-- AlterTable
ALTER TABLE "clients" ADD COLUMN IF NOT EXISTS "type" "ClientType" DEFAULT 'PERSON';
ALTER TABLE "clients" ADD COLUMN IF NOT EXISTS "companyName" TEXT;
ALTER TABLE "clients" ADD COLUMN IF NOT EXISTS "taxId" TEXT;

-- Update existing rows to have default type
UPDATE "clients" SET "type" = 'PERSON' WHERE "type" IS NULL;

-- Make type NOT NULL after setting defaults
ALTER TABLE "clients" ALTER COLUMN "type" SET NOT NULL;

