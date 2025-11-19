import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

/**
 * Seed data for Insurance Companies (Towarzystwa Ubezpieczeniowe)
 * 19 major insurance companies in Poland with logos
 */
const insuranceCompanies = [
  {
    code: 'PZU',
    name: 'PZU SA',
    website: 'https://www.pzu.pl',
    logoUrl: 'https://www.pzu.pl/logo.png',
  },
  {
    code: 'WARTA',
    name: 'TUW Warta SA',
    website: 'https://www.warta.pl',
    logoUrl: 'https://www.warta.pl/logo.png',
  },
  {
    code: 'ALLIANZ',
    name: 'Allianz Polska SA',
    website: 'https://www.allianz.pl',
    logoUrl: 'https://www.allianz.pl/logo.png',
  },
  {
    code: 'GENERALI',
    name: 'Generali TU SA',
    website: 'https://www.generali.pl',
    logoUrl: 'https://www.generali.pl/logo.png',
  },
  {
    code: 'COMPENSA',
    name: 'Compensa TU SA Vienna Insurance Group',
    website: 'https://www.compensa.pl',
    logoUrl: 'https://www.compensa.pl/logo.png',
  },
  {
    code: 'HESTIA',
    name: 'TU Hestia SA',
    website: 'https://www.hestia.pl',
    logoUrl: 'https://www.hestia.pl/logo.png',
  },
  {
    code: 'UNIQA',
    name: 'UNIQA TU SA',
    website: 'https://www.uniqa.pl',
    logoUrl: 'https://www.uniqa.pl/logo.png',
  },
  {
    code: 'PROLIFE',
    name: 'Prolife TU SA',
    website: 'https://www.prolife.pl',
    logoUrl: 'https://www.prolife.pl/logo.png',
  },
  {
    code: 'INTER',
    name: 'Inter TU SA',
    website: 'https://www.inter.pl',
    logoUrl: 'https://www.inter.pl/logo.png',
  },
  {
    code: 'ERGO',
    name: 'ERGO Hestia SA',
    website: 'https://www.ergohestia.pl',
    logoUrl: 'https://www.ergohestia.pl/logo.png',
  },
  {
    code: 'GOTHAER',
    name: 'Gothaer TU SA',
    website: 'https://www.gothaer.pl',
    logoUrl: 'https://www.gothaer.pl/logo.png',
  },
  {
    code: 'AXA',
    name: 'AXA TU SA',
    website: 'https://www.axa.pl',
    logoUrl: 'https://www.axa.pl/logo.png',
  },
  {
    code: 'LINK4',
    name: 'Link4 TU SA',
    website: 'https://www.link4.pl',
    logoUrl: 'https://www.link4.pl/logo.png',
  },
  {
    code: 'AVIVA',
    name: 'Aviva TU SA',
    website: 'https://www.aviva.pl',
    logoUrl: 'https://www.aviva.pl/logo.png',
  },
  {
    code: 'EUROPA',
    name: 'Europa TU SA',
    website: 'https://www.europa.pl',
    logoUrl: 'https://www.europa.pl/logo.png',
  },
  {
    code: 'MERCURY',
    name: 'Mercury TU SA',
    website: 'https://www.mercury.pl',
    logoUrl: 'https://www.mercury.pl/logo.png',
  },
  {
    code: 'SIGNAL',
    name: 'Signal Iduna TU SA',
    website: 'https://www.signal-iduna.pl',
    logoUrl: 'https://www.signal-iduna.pl/logo.png',
  },
  {
    code: 'TUW',
    name: 'TUW TU SA',
    website: 'https://www.tuw.pl',
    logoUrl: 'https://www.tuw.pl/logo.png',
  },
  {
    code: 'VICTORIA',
    name: 'Victoria TU SA',
    website: 'https://www.victoria.pl',
    logoUrl: 'https://www.victoria.pl/logo.png',
  },
]

async function main() {
  console.log('Seeding insurance companies...')

  for (const company of insuranceCompanies) {
    await prisma.insuranceCompany.upsert({
      where: { code: company.code },
      update: company,
      create: company,
    })
    console.log(`✓ Seeded ${company.name}`)
  }

  console.log(`\n✓ Seeded ${insuranceCompanies.length} insurance companies`)
}

main()
  .catch((e) => {
    console.error(e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })

