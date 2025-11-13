-- Add companyName column to clients table
ALTER TABLE "clients" ADD COLUMN IF NOT EXISTS "companyName" TEXT;

