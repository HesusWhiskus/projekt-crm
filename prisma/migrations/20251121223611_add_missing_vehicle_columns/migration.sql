-- Add missing columns to vehicles table
-- These columns exist in schema.prisma but were missing from the initial migration

ALTER TABLE "vehicles" 
ADD COLUMN IF NOT EXISTS "brand" TEXT,
ADD COLUMN IF NOT EXISTS "model" TEXT,
ADD COLUMN IF NOT EXISTS "productionYear" INTEGER,
ADD COLUMN IF NOT EXISTS "eurotaxId" TEXT,
ADD COLUMN IF NOT EXISTS "infoEkspertId" TEXT;

