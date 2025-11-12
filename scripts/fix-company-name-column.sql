-- Fix missing companyName column and related fields
-- This script is idempotent and can be run multiple times safely

-- Create enum type if it doesn't exist
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'ClientType') THEN
    CREATE TYPE "ClientType" AS ENUM ('PERSON', 'COMPANY');
  END IF;
END $$;

-- Add columns if they don't exist
ALTER TABLE "clients" 
  ADD COLUMN IF NOT EXISTS "type" "ClientType" DEFAULT 'PERSON',
  ADD COLUMN IF NOT EXISTS "firstName" TEXT,
  ADD COLUMN IF NOT EXISTS "lastName" TEXT,
  ADD COLUMN IF NOT EXISTS "companyName" TEXT,
  ADD COLUMN IF NOT EXISTS "taxId" TEXT;

-- Set default value for existing rows
UPDATE "clients" SET "type" = 'PERSON' WHERE "type" IS NULL;

-- Make type NOT NULL after setting defaults (only if column was just added)
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'clients' 
    AND column_name = 'type' 
    AND is_nullable = 'YES'
  ) THEN
    ALTER TABLE "clients" ALTER COLUMN "type" SET NOT NULL;
  END IF;
END $$;

-- Migrate existing data: If agencyName exists, move it to companyName
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'clients' 
    AND column_name = 'agencyName'
  ) THEN
    UPDATE "clients" 
    SET 
      "companyName" = "agencyName",
      "type" = 'COMPANY'
    WHERE "agencyName" IS NOT NULL AND "agencyName" != '';
    
    ALTER TABLE "clients" DROP COLUMN IF EXISTS "agencyName";
  END IF;
END $$;

