-- CreateEnum
CREATE TYPE "ClientType" AS ENUM ('PERSON', 'COMPANY');

-- AlterTable: Add new columns for Client type system
ALTER TABLE "clients" 
  ADD COLUMN IF NOT EXISTS "type" "ClientType" NOT NULL DEFAULT 'PERSON',
  ADD COLUMN IF NOT EXISTS "firstName" TEXT,
  ADD COLUMN IF NOT EXISTS "lastName" TEXT,
  ADD COLUMN IF NOT EXISTS "companyName" TEXT,
  ADD COLUMN IF NOT EXISTS "taxId" TEXT;

-- Migrate existing data: If agencyName exists, move it to companyName and set type to COMPANY
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'clients' AND column_name = 'agencyName') THEN
    -- Migrate agencyName to companyName for existing records
    UPDATE "clients" 
    SET 
      "companyName" = "agencyName",
      "type" = 'COMPANY'
    WHERE "agencyName" IS NOT NULL AND "agencyName" != '';
    
    -- Drop agencyName column after migration
    ALTER TABLE "clients" DROP COLUMN IF EXISTS "agencyName";
  END IF;
END $$;

