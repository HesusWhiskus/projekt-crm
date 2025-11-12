import { PrismaClient } from '@prisma/client'
import { readFileSync } from 'fs'
import { join } from 'path'

const prisma = new PrismaClient()

async function fixCompanyNameColumn() {
  try {
    console.log('Running fix script for missing companyName column...')
    
    const sqlFile = join(__dirname, 'fix-company-name-column.sql')
    const sql = readFileSync(sqlFile, 'utf-8')
    
    // Execute SQL statements one by one (Prisma doesn't support multi-statement SQL directly)
    // So we'll use raw queries for the specific operations
    
    // Check if companyName column exists
    const columnExists = await prisma.$queryRaw<Array<{ exists: boolean }>>`
      SELECT EXISTS (
        SELECT 1 
        FROM information_schema.columns 
        WHERE table_name = 'clients' 
        AND column_name = 'companyName'
      ) as exists
    `
    
    if (!columnExists[0]?.exists) {
      console.log('companyName column does not exist, adding it...')
      
      // Create enum type if it doesn't exist
      await prisma.$executeRawUnsafe(`
        DO $$
        BEGIN
          IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'ClientType') THEN
            CREATE TYPE "ClientType" AS ENUM ('PERSON', 'COMPANY');
          END IF;
        END $$;
      `)
      
      // Add columns
      await prisma.$executeRawUnsafe(`
        ALTER TABLE "clients" 
          ADD COLUMN IF NOT EXISTS "type" "ClientType" DEFAULT 'PERSON',
          ADD COLUMN IF NOT EXISTS "firstName" TEXT,
          ADD COLUMN IF NOT EXISTS "lastName" TEXT,
          ADD COLUMN IF NOT EXISTS "companyName" TEXT,
          ADD COLUMN IF NOT EXISTS "taxId" TEXT;
      `)
      
      // Set default value for existing rows
      await prisma.$executeRawUnsafe(`
        UPDATE "clients" SET "type" = 'PERSON' WHERE "type" IS NULL;
      `)
      
      // Make type NOT NULL
      await prisma.$executeRawUnsafe(`
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
      `)
      
      // Migrate agencyName to companyName if exists
      await prisma.$executeRawUnsafe(`
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
      `)
      
      console.log('✅ Successfully added companyName column and related fields')
    } else {
      console.log('✅ companyName column already exists, skipping fix')
    }
  } catch (error) {
    console.error('❌ Error running fix script:', error)
    throw error
  } finally {
    await prisma.$disconnect()
  }
}

fixCompanyNameColumn()
  .then(() => {
    console.log('Fix script completed')
    process.exit(0)
  })
  .catch((error) => {
    console.error('Fix script failed:', error)
    process.exit(1)
  })

