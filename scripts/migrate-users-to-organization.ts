/**
 * Migration script: Assign all existing users to "Polskie Polisy" organization
 * Run this script once to migrate existing users
 * 
 * Usage: npx tsx scripts/migrate-users-to-organization.ts
 */

import { db } from "../src/lib/db"

async function main() {
  console.log("🔄 Starting migration: Assign users to 'Polskie Polisy' organization...")

  try {
    // Get or create default organization
    let defaultOrg = await db.organization.findFirst({
      where: { name: "Polskie Polisy" },
    })

    if (!defaultOrg) {
      console.log("📝 Creating 'Polskie Polisy' organization...")
      defaultOrg = await db.organization.create({
        data: {
          name: "Polskie Polisy",
          plan: "BASIC",
        },
      })
      console.log("✅ Organization created:", defaultOrg.id)
    } else {
      console.log("✅ Organization already exists:", defaultOrg.id)
    }

    // Count users without organization
    const usersWithoutOrg = await db.user.count({
      where: { organizationId: null },
    })

    console.log(`📊 Found ${usersWithoutOrg} users without organization`)

    if (usersWithoutOrg > 0) {
      // Update all users without organization
      const result = await db.user.updateMany({
        where: { organizationId: null },
        data: { organizationId: defaultOrg.id },
      })

      console.log(`✅ Updated ${result.count} users to organization 'Polskie Polisy'`)
    } else {
      console.log("ℹ️  All users already have an organization assigned")
    }

    // Verify migration
    const remainingUsers = await db.user.count({
      where: { organizationId: null },
    })

    if (remainingUsers === 0) {
      console.log("✅ Migration completed successfully!")
    } else {
      console.warn(`⚠️  Warning: ${remainingUsers} users still without organization`)
    }
  } catch (error) {
    console.error("❌ Migration failed:", error)
    throw error
  } finally {
    await db.$disconnect()
  }
}

main()
  .then(() => {
    console.log("✨ Script completed")
    process.exit(0)
  })
  .catch((error) => {
    console.error("💥 Script failed:", error)
    process.exit(1)
  })

