-- Extend ClientType enum
DO $$ BEGIN
  ALTER TYPE "ClientType" ADD VALUE IF NOT EXISTS 'SOLE_PROPRIETORSHIP';
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
  ALTER TYPE "ClientType" ADD VALUE IF NOT EXISTS 'LIMITED_LIABILITY_COMPANY';
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
  ALTER TYPE "ClientType" ADD VALUE IF NOT EXISTS 'JOINT_STOCK_COMPANY';
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
  ALTER TYPE "ClientType" ADD VALUE IF NOT EXISTS 'CIVIL_PARTNERSHIP';
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;

-- Extend InsuranceScope enum
DO $$ BEGIN
  ALTER TYPE "InsuranceScope" ADD VALUE IF NOT EXISTS 'SZYBY';
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
  ALTER TYPE "InsuranceScope" ADD VALUE IF NOT EXISTS 'OC_DISCOUNT_PROTECTION';
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
  ALTER TYPE "InsuranceScope" ADD VALUE IF NOT EXISTS 'ASSISTANCE_ACCIDENT';
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
  ALTER TYPE "InsuranceScope" ADD VALUE IF NOT EXISTS 'ASSISTANCE_BREAKDOWN';
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
  ALTER TYPE "InsuranceScope" ADD VALUE IF NOT EXISTS 'AC_MINI';
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
  ALTER TYPE "InsuranceScope" ADD VALUE IF NOT EXISTS 'AC_ACCIDENT';
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;

-- Add installments fields to calculations table
ALTER TABLE "calculations" 
  ADD COLUMN IF NOT EXISTS "installments" INTEGER,
  ADD COLUMN IF NOT EXISTS "installmentAmount" DECIMAL(10,2);

-- Add configuration fields to policies table
ALTER TABLE "policies"
  ADD COLUMN IF NOT EXISTS "configurationType" TEXT,
  ADD COLUMN IF NOT EXISTS "leasingCompany" TEXT,
  ADD COLUMN IF NOT EXISTS "creditProvider" TEXT,
  ADD COLUMN IF NOT EXISTS "contractNumber" TEXT,
  ADD COLUMN IF NOT EXISTS "configurationMetadata" JSONB;

-- Create offers table
CREATE TABLE IF NOT EXISTS "offers" (
    "id" TEXT NOT NULL,
    "calculationId" TEXT NOT NULL,
    "insuranceCompanyId" TEXT NOT NULL,
    "price" DECIMAL(10,2) NOT NULL,
    "packageType" TEXT,
    "scopes" "InsuranceScope"[] NOT NULL DEFAULT ARRAY[]::"InsuranceScope"[],
    "additionalOptions" JSONB,
    "installments" INTEGER,
    "installmentAmount" DECIMAL(10,2),
    "validUntil" TIMESTAMP(3),
    "status" TEXT,
    "isSelected" BOOLEAN NOT NULL DEFAULT false,
    "externalId" TEXT,
    "metadata" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "offers_pkey" PRIMARY KEY ("id")
);

-- Create indexes for offers table
CREATE INDEX IF NOT EXISTS "offers_calculationId_idx" ON "offers"("calculationId");
CREATE INDEX IF NOT EXISTS "offers_insuranceCompanyId_idx" ON "offers"("insuranceCompanyId");
CREATE INDEX IF NOT EXISTS "offers_calculationId_price_idx" ON "offers"("calculationId", "price");
CREATE INDEX IF NOT EXISTS "offers_isSelected_idx" ON "offers"("isSelected");

-- Add foreign key constraints for offers table
ALTER TABLE "offers" ADD CONSTRAINT "offers_calculationId_fkey" FOREIGN KEY ("calculationId") REFERENCES "calculations"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "offers" ADD CONSTRAINT "offers_insuranceCompanyId_fkey" FOREIGN KEY ("insuranceCompanyId") REFERENCES "insurance_companies"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

