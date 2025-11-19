-- CreateEnum
DO $$ BEGIN
 CREATE TYPE "CalculationStatus" AS ENUM ('DRAFT', 'SENT', 'ACCEPTED', 'REJECTED');
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
 CREATE TYPE "InsuranceVariant" AS ENUM ('MINIMAL', 'OPTIMAL', 'MAXIMAL');
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
 CREATE TYPE "InsuranceScope" AS ENUM ('OC', 'AC', 'NNW', 'ASS');
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
 CREATE TYPE "PolicyStatus" AS ENUM ('ACTIVE', 'EXPIRED', 'CANCELLED', 'RENEWED');
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
 CREATE TYPE "SyncDirection" AS ENUM ('IN', 'OUT');
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
 CREATE TYPE "SyncStatus" AS ENUM ('PENDING', 'SUCCESS', 'FAILED');
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
 CREATE TYPE "ValidationLevel" AS ENUM ('STRICT', 'RELAXED');
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
 CREATE TYPE "DataType" AS ENUM ('PERSONAL_DATA', 'VEHICLE_DATA', 'POLICY_DATA');
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
 CREATE TYPE "ConsentType" AS ENUM ('MARKETING', 'DATA_PROCESSING', 'COMMUNICATION');
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;

-- AlterTable: Add new fields to Client
ALTER TABLE "clients" ADD COLUMN IF NOT EXISTS "previousLastName" TEXT;
ALTER TABLE "clients" ADD COLUMN IF NOT EXISTS "drivingLicenseDate" TIMESTAMP(3);
ALTER TABLE "clients" ADD COLUMN IF NOT EXISTS "occupation" TEXT;
ALTER TABLE "clients" ADD COLUMN IF NOT EXISTS "maritalStatus" TEXT;
ALTER TABLE "clients" ADD COLUMN IF NOT EXISTS "hasChildUnder26" BOOLEAN DEFAULT false;
ALTER TABLE "clients" ADD COLUMN IF NOT EXISTS "correspondenceAddress" JSONB;

-- CreateTable: InsuranceAgent
CREATE TABLE IF NOT EXISTS "insurance_agents" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "licenseNumber" TEXT,
    "settings" JSONB,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "organizationId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "insurance_agents_pkey" PRIMARY KEY ("id")
);

-- CreateTable: Vehicle
CREATE TABLE IF NOT EXISTS "vehicles" (
    "id" TEXT NOT NULL,
    "vin" TEXT,
    "registrationNumber" TEXT,
    "firstRegistrationDate" TIMESTAMP(3),
    "eurotaxData" JSONB,
    "infoEkspertData" JSONB,
    "importedFromAbroad" BOOLEAN NOT NULL DEFAULT false,
    "hasValidInspection" BOOLEAN,
    "hasLpgInstallation" BOOLEAN DEFAULT false,
    "purchaseYear" INTEGER,
    "currentMileage" INTEGER,
    "organizationId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "vehicles_pkey" PRIMARY KEY ("id")
);

-- CreateTable: VehicleOwner
CREATE TABLE IF NOT EXISTS "vehicle_owners" (
    "id" TEXT NOT NULL,
    "vehicleId" TEXT NOT NULL,
    "clientId" TEXT NOT NULL,
    "isPrimary" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "vehicle_owners_pkey" PRIMARY KEY ("id")
);

-- CreateTable: InsuranceCompany
CREATE TABLE IF NOT EXISTS "insurance_companies" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "code" TEXT,
    "logoUrl" TEXT,
    "website" TEXT,
    "integrationConfig" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "insurance_companies_pkey" PRIMARY KEY ("id")
);

-- CreateTable: Calculation
CREATE TABLE IF NOT EXISTS "calculations" (
    "id" TEXT NOT NULL,
    "pesel" TEXT,
    "firstName" TEXT,
    "lastName" TEXT,
    "previousLastName" TEXT,
    "phone" TEXT,
    "email" TEXT,
    "postalCode" TEXT,
    "city" TEXT,
    "street" TEXT,
    "houseNumber" TEXT,
    "apartmentNumber" TEXT,
    "correspondenceAddress" JSONB,
    "hasDrivingLicense" BOOLEAN,
    "drivingLicenseDate" TIMESTAMP(3),
    "occupation" TEXT,
    "maritalStatus" TEXT,
    "hasChildUnder26" BOOLEAN DEFAULT false,
    "clientId" TEXT,
    "vehicleId" TEXT,
    "agentId" TEXT,
    "organizationId" TEXT,
    "status" "CalculationStatus" NOT NULL DEFAULT 'DRAFT',
    "value" DECIMAL(10,2),
    "validUntil" TIMESTAMP(3),
    "variant" "InsuranceVariant",
    "scopes" "InsuranceScope"[],
    "externalId" TEXT,
    "syncedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "calculations_pkey" PRIMARY KEY ("id")
);

-- CreateTable: Policy
CREATE TABLE IF NOT EXISTS "policies" (
    "id" TEXT NOT NULL,
    "policyNumber" TEXT NOT NULL,
    "issueDate" TIMESTAMP(3) NOT NULL,
    "validFrom" TIMESTAMP(3) NOT NULL,
    "validTo" TIMESTAMP(3) NOT NULL,
    "status" "PolicyStatus" NOT NULL DEFAULT 'ACTIVE',
    "calculationId" TEXT,
    "clientId" TEXT,
    "vehicleId" TEXT,
    "insuranceCompanyId" TEXT NOT NULL,
    "agentId" TEXT,
    "organizationId" TEXT,
    "externalId" TEXT,
    "syncedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "policies_pkey" PRIMARY KEY ("id")
);

-- CreateTable: PolicyDocument
CREATE TABLE IF NOT EXISTS "policy_documents" (
    "id" TEXT NOT NULL,
    "policyId" TEXT NOT NULL,
    "filename" TEXT NOT NULL,
    "path" TEXT NOT NULL,
    "size" INTEGER,
    "mimeType" TEXT,
    "uploadedBy" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "policy_documents_pkey" PRIMARY KEY ("id")
);

-- CreateTable: ExternalSync
CREATE TABLE IF NOT EXISTS "external_syncs" (
    "id" TEXT NOT NULL,
    "entityType" TEXT NOT NULL,
    "entityId" TEXT NOT NULL,
    "externalId" TEXT,
    "direction" "SyncDirection" NOT NULL,
    "status" "SyncStatus" NOT NULL DEFAULT 'PENDING',
    "syncedAt" TIMESTAMP(3),
    "error" TEXT,
    "requestPayload" JSONB,
    "responsePayload" JSONB,
    "retryCount" INTEGER NOT NULL DEFAULT 0,
    "nextRetryAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "external_syncs_pkey" PRIMARY KEY ("id")
);

-- CreateTable: OrganizationInsuranceSettings
CREATE TABLE IF NOT EXISTS "organization_insurance_settings" (
    "id" TEXT NOT NULL,
    "organizationId" TEXT NOT NULL,
    "validationLevel" "ValidationLevel" NOT NULL DEFAULT 'RELAXED',
    "encryptionEnabled" BOOLEAN NOT NULL DEFAULT false,
    "auditRetentionDays" INTEGER,
    "gdprEnabled" BOOLEAN NOT NULL DEFAULT false,
    "dataRetentionDays" INTEGER,
    "cacheEnabled" BOOLEAN NOT NULL DEFAULT false,
    "cacheTTL" INTEGER,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "organization_insurance_settings_pkey" PRIMARY KEY ("id")
);

-- CreateTable: CalculationHistory
CREATE TABLE IF NOT EXISTS "calculation_history" (
    "id" TEXT NOT NULL,
    "calculationId" TEXT NOT NULL,
    "field" TEXT NOT NULL,
    "oldValue" TEXT,
    "newValue" TEXT,
    "changedBy" TEXT,
    "changedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "reason" TEXT,

    CONSTRAINT "calculation_history_pkey" PRIMARY KEY ("id")
);

-- CreateTable: PolicyHistory
CREATE TABLE IF NOT EXISTS "policy_history" (
    "id" TEXT NOT NULL,
    "policyId" TEXT NOT NULL,
    "field" TEXT NOT NULL,
    "oldValue" TEXT,
    "newValue" TEXT,
    "changedBy" TEXT,
    "changedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "reason" TEXT,

    CONSTRAINT "policy_history_pkey" PRIMARY KEY ("id")
);

-- CreateTable: AuditLog
CREATE TABLE IF NOT EXISTS "audit_logs" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "action" TEXT NOT NULL,
    "dataType" "DataType" NOT NULL,
    "entityType" TEXT NOT NULL,
    "entityId" TEXT,
    "dataBefore" JSONB,
    "dataAfter" JSONB,
    "ipAddress" TEXT,
    "userAgent" TEXT,
    "retentionPeriod" INTEGER,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "audit_logs_pkey" PRIMARY KEY ("id")
);

-- CreateTable: DataConsent
CREATE TABLE IF NOT EXISTS "data_consents" (
    "id" TEXT NOT NULL,
    "clientId" TEXT NOT NULL,
    "consentType" "ConsentType" NOT NULL,
    "granted" BOOLEAN NOT NULL DEFAULT false,
    "grantedAt" TIMESTAMP(3),
    "expiresAt" TIMESTAMP(3),
    "revokedAt" TIMESTAMP(3),
    "notes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "data_consents_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX IF NOT EXISTS "insurance_agents_userId_key" ON "insurance_agents"("userId");
CREATE INDEX IF NOT EXISTS "insurance_agents_userId_idx" ON "insurance_agents"("userId");
CREATE INDEX IF NOT EXISTS "insurance_agents_organizationId_idx" ON "insurance_agents"("organizationId");
CREATE INDEX IF NOT EXISTS "insurance_agents_isActive_idx" ON "insurance_agents"("isActive");

CREATE UNIQUE INDEX IF NOT EXISTS "vehicles_vin_key" ON "vehicles"("vin");
CREATE INDEX IF NOT EXISTS "vehicles_vin_idx" ON "vehicles"("vin");
CREATE INDEX IF NOT EXISTS "vehicles_registrationNumber_idx" ON "vehicles"("registrationNumber");
CREATE INDEX IF NOT EXISTS "vehicles_organizationId_idx" ON "vehicles"("organizationId");

CREATE UNIQUE INDEX IF NOT EXISTS "vehicle_owners_vehicleId_clientId_key" ON "vehicle_owners"("vehicleId", "clientId");
CREATE INDEX IF NOT EXISTS "vehicle_owners_vehicleId_idx" ON "vehicle_owners"("vehicleId");
CREATE INDEX IF NOT EXISTS "vehicle_owners_clientId_idx" ON "vehicle_owners"("clientId");

CREATE UNIQUE INDEX IF NOT EXISTS "insurance_companies_name_key" ON "insurance_companies"("name");
CREATE UNIQUE INDEX IF NOT EXISTS "insurance_companies_code_key" ON "insurance_companies"("code");
CREATE INDEX IF NOT EXISTS "insurance_companies_code_idx" ON "insurance_companies"("code");

CREATE INDEX IF NOT EXISTS "calculations_clientId_idx" ON "calculations"("clientId");
CREATE INDEX IF NOT EXISTS "calculations_vehicleId_idx" ON "calculations"("vehicleId");
CREATE INDEX IF NOT EXISTS "calculations_agentId_idx" ON "calculations"("agentId");
CREATE INDEX IF NOT EXISTS "calculations_status_idx" ON "calculations"("status");
CREATE INDEX IF NOT EXISTS "calculations_organizationId_idx" ON "calculations"("organizationId");
CREATE INDEX IF NOT EXISTS "calculations_createdAt_idx" ON "calculations"("createdAt");
CREATE INDEX IF NOT EXISTS "calculations_clientId_status_idx" ON "calculations"("clientId", "status");

CREATE UNIQUE INDEX IF NOT EXISTS "policies_policyNumber_key" ON "policies"("policyNumber");
CREATE INDEX IF NOT EXISTS "policies_policyNumber_idx" ON "policies"("policyNumber");
CREATE INDEX IF NOT EXISTS "policies_clientId_idx" ON "policies"("clientId");
CREATE INDEX IF NOT EXISTS "policies_vehicleId_idx" ON "policies"("vehicleId");
CREATE INDEX IF NOT EXISTS "policies_insuranceCompanyId_idx" ON "policies"("insuranceCompanyId");
CREATE INDEX IF NOT EXISTS "policies_status_idx" ON "policies"("status");
CREATE INDEX IF NOT EXISTS "policies_validTo_idx" ON "policies"("validTo");
CREATE INDEX IF NOT EXISTS "policies_organizationId_idx" ON "policies"("organizationId");
CREATE INDEX IF NOT EXISTS "policies_status_validTo_idx" ON "policies"("status", "validTo");

CREATE INDEX IF NOT EXISTS "policy_documents_policyId_idx" ON "policy_documents"("policyId");

CREATE UNIQUE INDEX IF NOT EXISTS "external_syncs_entityType_entityId_direction_key" ON "external_syncs"("entityType", "entityId", "direction");
CREATE INDEX IF NOT EXISTS "external_syncs_entityType_idx" ON "external_syncs"("entityType");
CREATE INDEX IF NOT EXISTS "external_syncs_entityId_idx" ON "external_syncs"("entityId");
CREATE INDEX IF NOT EXISTS "external_syncs_externalId_idx" ON "external_syncs"("externalId");
CREATE INDEX IF NOT EXISTS "external_syncs_status_idx" ON "external_syncs"("status");
CREATE INDEX IF NOT EXISTS "external_syncs_syncedAt_idx" ON "external_syncs"("syncedAt");

CREATE UNIQUE INDEX IF NOT EXISTS "organization_insurance_settings_organizationId_key" ON "organization_insurance_settings"("organizationId");

CREATE INDEX IF NOT EXISTS "calculation_history_calculationId_idx" ON "calculation_history"("calculationId");
CREATE INDEX IF NOT EXISTS "calculation_history_changedAt_idx" ON "calculation_history"("changedAt");

CREATE INDEX IF NOT EXISTS "policy_history_policyId_idx" ON "policy_history"("policyId");
CREATE INDEX IF NOT EXISTS "policy_history_changedAt_idx" ON "policy_history"("changedAt");

CREATE INDEX IF NOT EXISTS "audit_logs_userId_idx" ON "audit_logs"("userId");
CREATE INDEX IF NOT EXISTS "audit_logs_dataType_idx" ON "audit_logs"("dataType");
CREATE INDEX IF NOT EXISTS "audit_logs_entityType_idx" ON "audit_logs"("entityType");
CREATE INDEX IF NOT EXISTS "audit_logs_createdAt_idx" ON "audit_logs"("createdAt");

CREATE UNIQUE INDEX IF NOT EXISTS "data_consents_clientId_consentType_key" ON "data_consents"("clientId", "consentType");
CREATE INDEX IF NOT EXISTS "data_consents_clientId_idx" ON "data_consents"("clientId");
CREATE INDEX IF NOT EXISTS "data_consents_consentType_idx" ON "data_consents"("consentType");
CREATE INDEX IF NOT EXISTS "data_consents_granted_idx" ON "data_consents"("granted");

-- AddForeignKey
ALTER TABLE "insurance_agents" ADD CONSTRAINT "insurance_agents_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "insurance_agents" ADD CONSTRAINT "insurance_agents_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "organizations"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "vehicles" ADD CONSTRAINT "vehicles_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "organizations"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "vehicle_owners" ADD CONSTRAINT "vehicle_owners_vehicleId_fkey" FOREIGN KEY ("vehicleId") REFERENCES "vehicles"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "vehicle_owners" ADD CONSTRAINT "vehicle_owners_clientId_fkey" FOREIGN KEY ("clientId") REFERENCES "clients"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "calculations" ADD CONSTRAINT "calculations_clientId_fkey" FOREIGN KEY ("clientId") REFERENCES "clients"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "calculations" ADD CONSTRAINT "calculations_vehicleId_fkey" FOREIGN KEY ("vehicleId") REFERENCES "vehicles"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "calculations" ADD CONSTRAINT "calculations_agentId_fkey" FOREIGN KEY ("agentId") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "calculations" ADD CONSTRAINT "calculations_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "organizations"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "policies" ADD CONSTRAINT "policies_calculationId_fkey" FOREIGN KEY ("calculationId") REFERENCES "calculations"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "policies" ADD CONSTRAINT "policies_clientId_fkey" FOREIGN KEY ("clientId") REFERENCES "clients"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "policies" ADD CONSTRAINT "policies_vehicleId_fkey" FOREIGN KEY ("vehicleId") REFERENCES "vehicles"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "policies" ADD CONSTRAINT "policies_insuranceCompanyId_fkey" FOREIGN KEY ("insuranceCompanyId") REFERENCES "insurance_companies"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "policies" ADD CONSTRAINT "policies_agentId_fkey" FOREIGN KEY ("agentId") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "policies" ADD CONSTRAINT "policies_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "organizations"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "policy_documents" ADD CONSTRAINT "policy_documents_policyId_fkey" FOREIGN KEY ("policyId") REFERENCES "policies"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "organization_insurance_settings" ADD CONSTRAINT "organization_insurance_settings_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "organizations"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "calculation_history" ADD CONSTRAINT "calculation_history_calculationId_fkey" FOREIGN KEY ("calculationId") REFERENCES "calculations"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "policy_history" ADD CONSTRAINT "policy_history_policyId_fkey" FOREIGN KEY ("policyId") REFERENCES "policies"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "audit_logs" ADD CONSTRAINT "audit_logs_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON UPDATE CASCADE;

ALTER TABLE "data_consents" ADD CONSTRAINT "data_consents_clientId_fkey" FOREIGN KEY ("clientId") REFERENCES "clients"("id") ON DELETE CASCADE ON UPDATE CASCADE;

