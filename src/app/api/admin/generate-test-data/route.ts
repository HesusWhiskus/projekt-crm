import { NextResponse } from 'next/server'
import { getCurrentUser } from '@/lib/auth'
import { db } from '@/lib/db'
import { hash } from 'bcryptjs'

// Polskie imiona i nazwiska
const firstNames = [
  "Jan", "Anna", "Piotr", "Maria", "Krzysztof", "Katarzyna", "Andrzej", "Małgorzata",
  "Tomasz", "Agnieszka", "Paweł", "Barbara", "Marcin", "Ewa", "Michał", "Magdalena",
  "Kamil", "Joanna", "Jakub", "Aleksandra", "Marek", "Natalia", "Łukasz", "Karolina",
  "Wojciech", "Monika", "Rafał", "Patrycja", "Dawid", "Weronika", "Mariusz", "Justyna",
  "Bartosz", "Sylwia", "Grzegorz", "Paulina", "Szymon", "Dominika", "Mateusz", "Martyna",
  "Damian", "Julia", "Maciej", "Wiktoria", "Adrian", "Zuzanna", "Sebastian", "Oliwia",
  "Daniel", "Amelia", "Kacper", "Maja", "Filip", "Hanna", "Bartłomiej", "Emilia"
]

const lastNames = [
  "Nowak", "Kowalski", "Wiśniewski", "Wójcik", "Kowalczyk", "Kamiński", "Lewandowski", "Zieliński",
  "Szymański", "Woźniak", "Dąbrowski", "Kozłowski", "Jankowski", "Mazur", "Kwiatkowski", "Krawczyk",
  "Piotrowski", "Grabowski", "Nowakowski", "Pawłowski", "Michalski", "Nowicki", "Adamczyk", "Dudek",
  "Zając", "Wieczorek", "Jabłoński", "Król", "Majewski", "Olszewski", "Jaworski", "Wróbel",
  "Malinowski", "Pawlak", "Witkowski", "Walczak", "Stepień", "Górski", "Rutkowski", "Michalak",
  "Sikora", "Ostrowski", "Baran", "Duda", "Szewczyk", "Tomaszewski", "Pietrzak", "Marciniak",
  "Wróblewski", "Zalewski", "Jakubowski", "Jasiński", "Zawadzki", "Sadowski", "Bąk", "Wilk"
]

const companyTypes = [
  "Sp. z o.o.", "S.A.", "Spółka Jawna", "Spółka Partnerska", "P.P.H.U.", "F.H.U.", "S.C."
]

const companyNames = [
  "Tech", "Solutions", "Systems", "Group", "Partners", "Services", "Consulting", "Innovations",
  "Digital", "Smart", "Global", "Premium", "Elite", "Pro", "Expert", "Advanced", "Modern",
  "Future", "Next", "Prime", "Core", "Base", "Hub", "Center", "Point", "Link", "Bridge"
]

const companySectors = [
  "IT", "Marketing", "Handel", "Produkcja", "Usługi", "Budownictwo", "Transport", "Finanse",
  "Ubezpieczenia", "Nieruchomości", "Edukacja", "Zdrowie", "Gastronomia", "Turystyka", "Media"
]

const sources = [
  "Lead", "Polecenie", "Wydarzenie", "Strona WWW", "LinkedIn", "Facebook", "Google Ads",
  "Email marketing", "Telefon", "Spotkanie", "Targi", "Konferencja", "Cold call", "Inne"
]

const cities = [
  "Warszawa", "Kraków", "Łódź", "Wrocław", "Poznań", "Gdańsk", "Szczecin", "Bydgoszcz",
  "Lublin", "Katowice", "Białystok", "Gdynia", "Częstochowa", "Radom", "Sosnowiec",
  "Toruń", "Kielce", "Gliwice", "Zabrze", "Bytom", "Olsztyn", "Rzeszów", "Ruda Śląska"
]

const streets = [
  "ul. Główna", "ul. Słoneczna", "ul. Polna", "ul. Leśna", "ul. Kwiatowa", "ul. Parkowa",
  "ul. Ogrodowa", "ul. Spacerowa", "ul. Zielona", "ul. Nowa", "ul. Centralna", "ul. Długa",
  "ul. Krótka", "ul. Szeroka", "ul. Wąska", "ul. Cicha", "ul. Głośna", "ul. Wesoła"
]

const occupations = [
  "Kierowca", "Inżynier", "Lekarz", "Nauczyciel", "Prawnik", "Księgowy", "Sprzedawca",
  "Menadżer", "Programista", "Architekt", "Designer", "Marketingowiec", "Handlowiec"
]

const maritalStatuses = [
  "Kawaler/Panna", "Żonaty/Zamężna", "Rozwiedziony/Rozwiedziona", "Wdowiec/Wdowa"
]

// Funkcje pomocnicze
function generatePESEL(): string {
  const year = Math.floor(Math.random() * 30) + 70
  const month = String(Math.floor(Math.random() * 12) + 1).padStart(2, "0")
  const day = String(Math.floor(Math.random() * 28) + 1).padStart(2, "0")
  const random = String(Math.floor(Math.random() * 10000)).padStart(4, "0")
  return `${year}${month}${day}${random}`
}

function generateNIP(): string {
  return `${Math.floor(Math.random() * 900) + 100}-${Math.floor(Math.random() * 900) + 100}-${Math.floor(Math.random() * 90) + 10}-${Math.floor(Math.random() * 90) + 10}`
}

function generateREGON(): string {
  return String(Math.floor(Math.random() * 900000000) + 100000000)
}

function generatePhone(): string {
  const prefixes = ["500", "501", "502", "503", "504", "505", "506", "507", "508", "509",
    "510", "511", "512", "513", "514", "515", "516", "517", "518", "519",
    "600", "601", "602", "603", "604", "605", "606", "607", "608", "609",
    "660", "661", "662", "663", "664", "665", "666", "667", "668", "669",
    "690", "691", "692", "693", "694", "695", "696", "697", "698", "699",
    "720", "721", "722", "723", "724", "725", "726", "727", "728", "729",
    "730", "731", "732", "733", "734", "735", "736", "737", "738", "739",
    "780", "781", "782", "783", "784", "785", "786", "787", "788", "789"]
  const prefix = prefixes[Math.floor(Math.random() * prefixes.length)]
  const number = String(Math.floor(Math.random() * 1000000)).padStart(6, "0")
  return `${prefix}${number}`
}

function generateEmail(firstName: string, lastName: string, companyName?: string): string {
  const domains = ["gmail.com", "wp.pl", "o2.pl", "interia.pl", "onet.pl", "poczta.fm", "tlen.pl"]
  const domain = domains[Math.floor(Math.random() * domains.length)]
  
  if (companyName) {
    const companySlug = companyName.toLowerCase()
      .replace(/[^a-z0-9]/g, "")
      .substring(0, 15)
    return `${companySlug}@${domain}`
  }
  
  const nameSlug = `${firstName.toLowerCase()}.${lastName.toLowerCase()}`.replace(/[^a-z0-9.]/g, "")
  const random = Math.floor(Math.random() * 1000)
  return `${nameSlug}${random}@${domain}`
}

function generateAddress(): { street: string; houseNumber: string; postalCode: string; city: string } {
  const city = cities[Math.floor(Math.random() * cities.length)]
  const street = streets[Math.floor(Math.random() * streets.length)]
  const number = Math.floor(Math.random() * 200) + 1
  const postalCode = `${Math.floor(Math.random() * 90) + 10}-${Math.floor(Math.random() * 900) + 100}`
  return {
    street: street.replace('ul. ', ''),
    houseNumber: String(number),
    postalCode,
    city
  }
}

function generateCompanyName(): string {
  const sector = companySectors[Math.floor(Math.random() * companySectors.length)]
  const name = companyNames[Math.floor(Math.random() * companyNames.length)]
  const type = companyTypes[Math.floor(Math.random() * companyTypes.length)]
  return `${sector} ${name} ${type}`
}

function generateVIN(): string {
  const chars = 'ABCDEFGHJKLMNPRSTUVWXYZ0123456789'
  let vin = ''
  for (let i = 0; i < 17; i++) {
    vin += chars[Math.floor(Math.random() * chars.length)]
  }
  return vin
}

function generateRegistrationNumber(): string {
  const letters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ'
  const prefix = Array.from({ length: 3 }, () => letters[Math.floor(Math.random() * letters.length)]).join('')
  
  if (Math.random() > 0.5) {
    const digits = String(Math.floor(Math.random() * 10000)).padStart(4, '0')
    return `${prefix}${digits}`
  } else {
    const digits = String(Math.floor(Math.random() * 100)).padStart(2, '0')
    const suffix = Array.from({ length: 2 }, () => letters[Math.floor(Math.random() * letters.length)]).join('')
    return `${prefix}${digits}${suffix}`
  }
}

function generatePolicyNumber(): string {
  const prefix = ['POL', 'POL-', 'PZU-', 'WAR-', 'ALL-', 'GEN-']
  const selectedPrefix = prefix[Math.floor(Math.random() * prefix.length)]
  const number = String(Math.floor(Math.random() * 10000000)).padStart(8, '0')
  return `${selectedPrefix}${number}`
}

function randomPastDate(daysAgo: number = 365): Date {
  const now = new Date()
  const past = new Date(now.getTime() - Math.random() * daysAgo * 24 * 60 * 60 * 1000)
  return past
}

function randomFutureDate(daysAhead: number = 365): Date {
  const now = new Date()
  const future = new Date(now.getTime() + Math.random() * daysAhead * 24 * 60 * 60 * 1000)
  return future
}

async function setupEnvironment() {
  const existingOrgs = await db.organization.findMany()
  let organizationId: string
  
  if (existingOrgs.length === 0) {
    const org = await db.organization.create({
      data: {
        name: 'Testowa Organizacja Ubezpieczeniowa',
        plan: 'PRO',
      }
    })
    organizationId = org.id
  } else {
    organizationId = existingOrgs[0].id
  }
  
  const existingAgents = await db.insuranceAgent.findMany({
    where: { organizationId, isActive: true },
    include: { user: true }
  })
  
  let agentUserIds: string[] = []
  
  if (existingAgents.length === 0) {
    for (let i = 1; i <= 3; i++) {
      const firstName = firstNames[Math.floor(Math.random() * firstNames.length)]
      const lastName = lastNames[Math.floor(Math.random() * lastNames.length)]
      const email = `agent${i}.test@example.com`
      
      let user = await db.user.findUnique({ where: { email } })
      
      if (!user) {
        const hashedPassword = await hash('test123', 10)
        user = await db.user.create({
          data: {
            email,
            name: `${firstName} ${lastName}`,
            password: hashedPassword,
            role: 'USER',
            organizationId,
          }
        })
      }
      
      await db.insuranceAgent.upsert({
        where: { userId: user.id },
        update: { isActive: true },
        create: {
          userId: user.id,
          licenseNumber: `LIC-${String(Math.floor(Math.random() * 100000)).padStart(6, '0')}`,
          isActive: true,
          organizationId,
        }
      })
      
      agentUserIds.push(user.id)
    }
  } else {
    // Używamy userId, nie insuranceAgent.id - zgodnie ze schematem Prisma
    agentUserIds = existingAgents.map(a => a.userId)
  }
  
  // Sprawdź i utwórz towarzystwa ubezpieczeniowe jeśli brakuje
  const insuranceCompanies = await db.insuranceCompany.findMany()
  if (insuranceCompanies.length === 0) {
    const companiesToSeed = [
      { code: 'PZU', name: 'PZU SA', website: 'https://www.pzu.pl', logoUrl: 'https://www.pzu.pl/logo.png' },
      { code: 'WARTA', name: 'TUW Warta SA', website: 'https://www.warta.pl', logoUrl: 'https://www.warta.pl/logo.png' },
      { code: 'ALLIANZ', name: 'Allianz Polska SA', website: 'https://www.allianz.pl', logoUrl: 'https://www.allianz.pl/logo.png' },
      { code: 'GENERALI', name: 'Generali TU SA', website: 'https://www.generali.pl', logoUrl: 'https://www.generali.pl/logo.png' },
      { code: 'COMPENSA', name: 'Compensa TU SA Vienna Insurance Group', website: 'https://www.compensa.pl', logoUrl: 'https://www.compensa.pl/logo.png' },
      { code: 'HESTIA', name: 'TU Hestia SA', website: 'https://www.hestia.pl', logoUrl: 'https://www.hestia.pl/logo.png' },
      { code: 'UNIQA', name: 'UNIQA TU SA', website: 'https://www.uniqa.pl', logoUrl: 'https://www.uniqa.pl/logo.png' },
      { code: 'PROLIFE', name: 'Prolife TU SA', website: 'https://www.prolife.pl', logoUrl: 'https://www.prolife.pl/logo.png' },
      { code: 'INTER', name: 'Inter TU SA', website: 'https://www.inter.pl', logoUrl: 'https://www.inter.pl/logo.png' },
      { code: 'ERGO', name: 'ERGO Hestia SA', website: 'https://www.ergohestia.pl', logoUrl: 'https://www.ergohestia.pl/logo.png' },
      { code: 'GOTHAER', name: 'Gothaer TU SA', website: 'https://www.gothaer.pl', logoUrl: 'https://www.gothaer.pl/logo.png' },
      { code: 'AXA', name: 'AXA TU SA', website: 'https://www.axa.pl', logoUrl: 'https://www.axa.pl/logo.png' },
      { code: 'LINK4', name: 'Link4 TU SA', website: 'https://www.link4.pl', logoUrl: 'https://www.link4.pl/logo.png' },
      { code: 'AVIVA', name: 'Aviva TU SA', website: 'https://www.aviva.pl', logoUrl: 'https://www.aviva.pl/logo.png' },
      { code: 'EUROPA', name: 'Europa TU SA', website: 'https://www.europa.pl', logoUrl: 'https://www.europa.pl/logo.png' },
      { code: 'MERCURY', name: 'Mercury TU SA', website: 'https://www.mercury.pl', logoUrl: 'https://www.mercury.pl/logo.png' },
      { code: 'SIGNAL', name: 'Signal Iduna TU SA', website: 'https://www.signal-iduna.pl', logoUrl: 'https://www.signal-iduna.pl/logo.png' },
      { code: 'TUW', name: 'TUW TU SA', website: 'https://www.tuw.pl', logoUrl: 'https://www.tuw.pl/logo.png' },
      { code: 'VICTORIA', name: 'Victoria TU SA', website: 'https://www.victoria.pl', logoUrl: 'https://www.victoria.pl/logo.png' },
    ]
    
    for (const company of companiesToSeed) {
      await db.insuranceCompany.upsert({
        where: { code: company.code },
        update: company,
        create: company,
      })
    }
  }
  
  return { organizationId, agentUserIds }
}

async function generateClients(organizationId: string, count: number = 200) {
  const clients: string[] = []
  const personCount = Math.floor(count * 0.6)
  const companyCount = count - personCount
  
  for (let i = 0; i < personCount; i++) {
    const firstName = firstNames[Math.floor(Math.random() * firstNames.length)]
    const lastName = lastNames[Math.floor(Math.random() * lastNames.length)]
    const hasPESEL = Math.random() > 0.3
    const hasEmail = Math.random() > 0.1
    const hasPhone = Math.random() > 0.05
    const address = generateAddress()
    
    const client = await db.client.create({
      data: {
        type: 'PERSON',
        firstName,
        lastName,
        pesel: hasPESEL ? generatePESEL() : null,
        email: hasEmail ? generateEmail(firstName, lastName) : null,
        phone: hasPhone ? generatePhone() : null,
        address: `${address.street} ${address.houseNumber}, ${address.postalCode} ${address.city}`,
        source: sources[Math.floor(Math.random() * sources.length)],
        status: ['NEW_LEAD', 'IN_CONTACT', 'ACTIVE_CLIENT', 'LOST'][Math.floor(Math.random() * 4)] as any,
        priority: ['LOW', 'MEDIUM', 'HIGH'][Math.floor(Math.random() * 3)] as any,
        organizationId,
        occupation: occupations[Math.floor(Math.random() * occupations.length)],
        maritalStatus: maritalStatuses[Math.floor(Math.random() * maritalStatuses.length)],
        hasChildUnder26: Math.random() > 0.7,
        drivingLicenseDate: Math.random() > 0.5 ? randomPastDate(3650) : null,
      }
    })
    
    clients.push(client.id)
  }
  
  for (let i = 0; i < companyCount; i++) {
    const companyName = generateCompanyName()
    const hasNIP = Math.random() > 0.3
    const hasREGON = Math.random() > 0.3
    const hasEmail = Math.random() > 0.05
    const hasPhone = Math.random() > 0.05
    const address = generateAddress()
    
    const client = await db.client.create({
      data: {
        type: 'COMPANY',
        companyName,
        taxId: hasNIP ? generateNIP() : null,
        regon: hasREGON ? generateREGON() : null,
        email: hasEmail ? generateEmail('', '', companyName) : null,
        phone: hasPhone ? generatePhone() : null,
        address: `${address.street} ${address.houseNumber}, ${address.postalCode} ${address.city}`,
        source: sources[Math.floor(Math.random() * sources.length)],
        status: ['NEW_LEAD', 'IN_CONTACT', 'ACTIVE_CLIENT', 'LOST'][Math.floor(Math.random() * 4)] as any,
        priority: ['LOW', 'MEDIUM', 'HIGH'][Math.floor(Math.random() * 3)] as any,
        organizationId,
      }
    })
    
    clients.push(client.id)
  }
  
  return clients
}

async function generateVehicles(organizationId: string, clientIds: string[], count: number = 300) {
  const vehicles: Array<{ id: string; clientIds: string[] }> = []
  
  for (let i = 0; i < count; i++) {
    const hasVIN = Math.random() > 0.1
    const hasRegNumber = Math.random() > 0.1
    
    let vin: string | null = null
    let regNumber: string | null = null
    
    if (!hasVIN && !hasRegNumber) {
      if (Math.random() > 0.5) {
        vin = generateVIN()
      } else {
        regNumber = generateRegistrationNumber()
      }
    } else {
      vin = hasVIN ? generateVIN() : null
      regNumber = hasRegNumber ? generateRegistrationNumber() : null
    }
    
    if (vin) {
      const existingVIN = await db.vehicle.findUnique({ where: { vin } })
      if (existingVIN) {
        vin = generateVIN()
      }
    }
    
    if (regNumber) {
      const existingReg = await db.vehicle.findFirst({ where: { registrationNumber: regNumber } })
      if (existingReg) {
        regNumber = generateRegistrationNumber()
      }
    }
    
    const firstRegDate = randomPastDate(3650)
    const purchaseYear = firstRegDate.getFullYear()
    
    const vehicle = await db.vehicle.create({
      data: {
        vin: vin || null,
        registrationNumber: regNumber || null,
        firstRegistrationDate: firstRegDate,
        importedFromAbroad: Math.random() > 0.85,
        hasValidInspection: Math.random() > 0.3,
        hasLpgInstallation: Math.random() > 0.7,
        purchaseYear,
        currentMileage: Math.floor(Math.random() * 200000) + 10000,
        organizationId,
      }
    })
    
    const ownerCount = Math.random() > 0.7 ? 2 : 1
    const selectedClients = []
    const shuffled = [...clientIds].sort(() => Math.random() - 0.5)
    
    for (let j = 0; j < ownerCount && j < shuffled.length; j++) {
      await db.vehicleOwner.create({
        data: {
          vehicleId: vehicle.id,
          clientId: shuffled[j],
          isPrimary: j === 0,
        }
      })
      selectedClients.push(shuffled[j])
    }
    
    vehicles.push({ id: vehicle.id, clientIds: selectedClients })
  }
  
  return vehicles
}

async function generateCalculations(
  organizationId: string,
  agentUserIds: string[],
  vehicles: Array<{ id: string; clientIds: string[] }>,
  count: number = 400
) {
  const calculations: string[] = []
  const statuses = ['DRAFT', 'SENT', 'ACCEPTED', 'REJECTED'] as const
  const variants = ['MINIMAL', 'OPTIMAL', 'MAXIMAL'] as const
  const scopes = ['OC', 'AC', 'NNW', 'ASS', 'SZYBY', 'OC_DISCOUNT_PROTECTION', 'ASSISTANCE_ACCIDENT', 'ASSISTANCE_BREAKDOWN', 'AC_MINI', 'AC_ACCIDENT'] as const
  
  for (let i = 0; i < count; i++) {
    const vehicle = vehicles[Math.floor(Math.random() * vehicles.length)]
    const clientId = vehicle.clientIds[Math.floor(Math.random() * vehicle.clientIds.length)]
    const agentId = agentUserIds[Math.floor(Math.random() * agentUserIds.length)]
    
    const client = await db.client.findUnique({ where: { id: clientId } })
    if (!client) continue
    
    // Wygeneruj zakresy ubezpieczenia (1-6, zawsze OC jako podstawowy)
    const selectedScopes: string[] = ['OC'] // OC zawsze jest wymagane
    const scopeCount = Math.floor(Math.random() * 5) + 1 // 1-5 dodatkowych zakresów
    const additionalScopes = scopes.filter(s => s !== 'OC')
    const shuffledScopes = [...additionalScopes].sort(() => Math.random() - 0.5)
    for (let j = 0; j < scopeCount && j < shuffledScopes.length; j++) {
      if (!selectedScopes.includes(shuffledScopes[j])) {
        selectedScopes.push(shuffledScopes[j])
      }
    }
    
    const address = generateAddress()
    const status = statuses[Math.floor(Math.random() * statuses.length)]
    const variant = variants[Math.floor(Math.random() * variants.length)]
    
    const calculation = await db.calculation.create({
      data: {
        pesel: client.pesel || null,
        firstName: client.firstName || null,
        lastName: client.lastName || null,
        phone: client.phone || null,
        email: client.email || null,
        postalCode: address.postalCode,
        city: address.city,
        street: address.street,
        houseNumber: address.houseNumber,
        hasDrivingLicense: Math.random() > 0.1,
        drivingLicenseDate: Math.random() > 0.5 ? randomPastDate(3650) : null,
        occupation: client.occupation || occupations[Math.floor(Math.random() * occupations.length)],
        maritalStatus: client.maritalStatus || maritalStatuses[Math.floor(Math.random() * maritalStatuses.length)],
        hasChildUnder26: client.hasChildUnder26 || false,
        clientId,
        vehicleId: vehicle.id,
        agentId,
        organizationId,
        status,
        value: Math.floor(Math.random() * 5000) + 500,
        validUntil: randomFutureDate(90),
        variant,
        scopes: selectedScopes as any,
      }
    })
    
    calculations.push(calculation.id)
  }
  
  return calculations
}

async function generatePolicies(
  organizationId: string,
  agentUserIds: string[],
  calculationIds: string[],
  vehicles: Array<{ id: string; clientIds: string[] }>,
  count: number = 200
) {
  const insuranceCompanies = await db.insuranceCompany.findMany()
  if (insuranceCompanies.length === 0) {
    return []
  }
  
  const policies: string[] = []
  const statuses = ['ACTIVE', 'EXPIRED', 'CANCELLED', 'RENEWED'] as const
  
  const acceptedCalculations = await db.calculation.findMany({
    where: { id: { in: calculationIds }, status: 'ACCEPTED' },
    select: { id: true, clientId: true, vehicleId: true }
  })
  
  const availableCalculations = acceptedCalculations.length > 0 
    ? acceptedCalculations 
    : await db.calculation.findMany({
        where: { id: { in: calculationIds } },
        select: { id: true, clientId: true, vehicleId: true },
        take: count
      })
  
  for (let i = 0; i < count && i < availableCalculations.length; i++) {
    const calculation = availableCalculations[Math.floor(Math.random() * availableCalculations.length)]
    const insuranceCompany = insuranceCompanies[Math.floor(Math.random() * insuranceCompanies.length)]
    const agentId = agentUserIds[Math.floor(Math.random() * agentUserIds.length)]
    const status = statuses[Math.floor(Math.random() * statuses.length)]
    
    let policyNumber = generatePolicyNumber()
    let attempts = 0
    while (await db.policy.findUnique({ where: { policyNumber } }) && attempts < 10) {
      policyNumber = generatePolicyNumber()
      attempts++
    }
    
    const issueDate = randomPastDate(365)
    const validFrom = issueDate
    const validTo = new Date(validFrom.getTime() + 365 * 24 * 60 * 60 * 1000)
    
    const policy = await db.policy.create({
      data: {
        policyNumber,
        issueDate,
        validFrom,
        validTo: status === 'EXPIRED' ? randomPastDate(30) : validTo,
        status,
        calculationId: calculation.id,
        clientId: calculation.clientId,
        vehicleId: calculation.vehicleId,
        insuranceCompanyId: insuranceCompany.id,
        agentId,
        organizationId,
      }
    })
    
    policies.push(policy.id)
  }
  
  return policies
}

// Generowanie ofert dla kalkulacji
async function generateOffers(
  calculationIds: string[]
) {
  const insuranceCompanies = await db.insuranceCompany.findMany()
  if (insuranceCompanies.length === 0) {
    return []
  }
  
  const offers: string[] = []
  const packageTypes = ['OC', 'OC+AC', 'OC+AC+NNW', 'OC+AC+NNW+ASS', 'Pakiet Premium'] as const
  const allScopes = ['OC', 'AC', 'NNW', 'ASS', 'SZYBY', 'OC_DISCOUNT_PROTECTION', 'ASSISTANCE_ACCIDENT', 'ASSISTANCE_BREAKDOWN', 'AC_MINI', 'AC_ACCIDENT'] as const
  
  // Pobierz wszystkie kalkulacje z ich zakresami
  const calculations = await db.calculation.findMany({
    where: { id: { in: calculationIds } },
    select: { id: true, scopes: true, value: true }
  })
  
  for (const calculation of calculations) {
    // Generuj 2-5 ofert dla każdej kalkulacji
    const offerCount = Math.floor(Math.random() * 4) + 2 // 2-5 ofert
    
    // Wybierz losowe towarzystwa (mogą się powtarzać, ale różne ceny)
    const selectedCompanies: typeof insuranceCompanies = []
    for (let i = 0; i < offerCount; i++) {
      const company = insuranceCompanies[Math.floor(Math.random() * insuranceCompanies.length)]
      selectedCompanies.push(company)
    }
    
    for (let i = 0; i < offerCount; i++) {
      const company = selectedCompanies[i]
      const packageType = packageTypes[Math.floor(Math.random() * packageTypes.length)]
      
      // Cena bazowa z kalkulacji, z wariacją ±20%
      const baseValue = typeof calculation.value === 'number' ? calculation.value : Number(calculation.value)
      const variation = (Math.random() * 0.4 - 0.2) // -20% do +20%
      const offerPrice = Math.max(300, Math.floor(baseValue * (1 + variation)))
      
      // Użyj zakresów z kalkulacji lub dodaj/lub usuń niektóre
      const calculationScopes = Array.isArray(calculation.scopes) ? calculation.scopes : []
      const selectedScopes: string[] = [...calculationScopes]
      
      // Losowo dodaj lub usuń zakresy (30% szansy na zmianę)
      if (Math.random() < 0.3) {
        if (Math.random() > 0.5 && selectedScopes.length < allScopes.length) {
          // Dodaj losowy zakres
          const availableScopes = allScopes.filter(s => !selectedScopes.includes(s))
          if (availableScopes.length > 0) {
            selectedScopes.push(availableScopes[Math.floor(Math.random() * availableScopes.length)])
          }
        } else if (selectedScopes.length > 1) {
          // Usuń losowy zakres (ale nie OC)
          const removableScopes = selectedScopes.filter(s => s !== 'OC')
          if (removableScopes.length > 0) {
            const index = selectedScopes.indexOf(removableScopes[Math.floor(Math.random() * removableScopes.length)])
            if (index > -1) {
              selectedScopes.splice(index, 1)
            }
          }
        }
      }
      
      // Opcje rat (30% szansy na raty)
      const hasInstallments = Math.random() < 0.3
      const installments = hasInstallments ? Math.floor(Math.random() * 10) + 2 : null // 2-12 rat
      const installmentAmount = hasInstallments && installments 
        ? offerPrice / installments 
        : null
      
      // Dodatkowe opcje (JSON)
      const additionalOptions = {
        coverage: {
          basic: selectedScopes.includes('OC'),
          comprehensive: selectedScopes.includes('AC'),
          personal: selectedScopes.includes('NNW'),
          assistance: selectedScopes.includes('ASS'),
          glass: selectedScopes.includes('SZYBY'),
          discountProtection: selectedScopes.includes('OC_DISCOUNT_PROTECTION'),
        },
        discounts: Math.random() > 0.7 ? ['LOYALTY', 'MULTI_CAR'] : [],
        notes: `Oferta ${packageType} z ${company.name}`,
      }
      
      // Ważność oferty (30-90 dni od teraz)
      const validUntil = new Date()
      validUntil.setDate(validUntil.getDate() + Math.floor(Math.random() * 60) + 30)
      
      const offer = await db.offer.create({
        data: {
          calculationId: calculation.id,
          insuranceCompanyId: company.id,
          price: offerPrice,
          packageType,
          scopes: selectedScopes as any,
          additionalOptions: additionalOptions as any,
          installments,
          installmentAmount: installmentAmount ? installmentAmount : null,
          validUntil,
          status: 'PENDING',
          isSelected: i === 0 && Math.random() > 0.7, // Pierwsza oferta ma 30% szansy na wybór
        }
      })
      
      offers.push(offer.id)
    }
  }
  
  return offers
}

export async function POST() {
  try {
    const user = await getCurrentUser()
    
    if (!user || user.role !== "ADMIN") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    // Uruchom generowanie danych
    const { organizationId, agentUserIds } = await setupEnvironment()
    const clients = await generateClients(organizationId, 200)
    const vehicles = await generateVehicles(organizationId, clients, 300)
    const calculations = await generateCalculations(organizationId, agentUserIds, vehicles, 400)
    const offers = await generateOffers(calculations)
    const policies = await generatePolicies(organizationId, agentUserIds, calculations, vehicles, 200)
    
    return NextResponse.json({ 
      message: "Generowanie danych testowych zakończone pomyślnie",
      summary: {
        clients: clients.length,
        vehicles: vehicles.length,
        calculations: calculations.length,
        offers: offers.length,
        policies: policies.length
      }
    }, { status: 200 })
    
  } catch (error: any) {
    console.error('Error in generate-test-data endpoint:', error)
    return NextResponse.json(
      { error: "Wystąpił błąd podczas uruchamiania generowania danych", details: error?.message },
      { status: 500 }
    )
  }
}

