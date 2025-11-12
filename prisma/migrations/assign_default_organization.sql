-- Migration: Assign all users to "Polskie Polisy" organization
-- This migration creates the default organization and assigns all existing users to it

-- First, create the "Polskie Polisy" organization if it doesn't exist
INSERT INTO organizations (id, name, plan, settings, "createdAt", "updatedAt")
SELECT 
  'default_org_polskie_polisy',
  'Polskie Polisy',
  'BASIC',
  '{}'::jsonb,
  NOW(),
  NOW()
WHERE NOT EXISTS (
  SELECT 1 FROM organizations WHERE name = 'Polskie Polisy'
);

-- Update all users without organization to be assigned to "Polskie Polisy"
UPDATE users
SET "organizationId" = (
  SELECT id FROM organizations WHERE name = 'Polskie Polisy' LIMIT 1
)
WHERE "organizationId" IS NULL;

