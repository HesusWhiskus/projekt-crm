-- CreateEnum
CREATE TYPE "ClientPriority" AS ENUM ('LOW', 'MEDIUM', 'HIGH');

-- AlterTable
ALTER TABLE "clients" ADD COLUMN "lastContactAt" TIMESTAMP(3),
ADD COLUMN "nextFollowUpAt" TIMESTAMP(3),
ADD COLUMN "priority" "ClientPriority";

-- AlterTable
ALTER TABLE "contacts" ADD COLUMN "isNote" BOOLEAN NOT NULL DEFAULT false,
ALTER COLUMN "type" DROP NOT NULL;

-- Update existing contacts to set isNote=false
UPDATE "contacts" SET "isNote" = false WHERE "isNote" IS NULL;

