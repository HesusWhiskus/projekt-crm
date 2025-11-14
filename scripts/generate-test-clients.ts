import * as XLSX from "xlsx"
import * as fs from "fs"
import * as path from "path"

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

// Typy firm
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

const statuses = [
  "NEW_LEAD",
  "IN_CONTACT",
  "DEMO_SENT",
  "NEGOTIATION",
  "ACTIVE_CLIENT",
  "LOST"
]

const priorities = ["LOW", "MEDIUM", "HIGH"]

// Miasta w Polsce
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

// Generowanie losowego PESEL (nieprawdziwy, tylko do testów)
function generatePESEL(): string {
  const year = Math.floor(Math.random() * 30) + 70 // 1970-1999
  const month = String(Math.floor(Math.random() * 12) + 1).padStart(2, "0")
  const day = String(Math.floor(Math.random() * 28) + 1).padStart(2, "0")
  const random = String(Math.floor(Math.random() * 10000)).padStart(4, "0")
  return `${year}${month}${day}${random}`
}

// Generowanie losowego NIP (nieprawdziwy, tylko do testów)
function generateNIP(): string {
  return `${Math.floor(Math.random() * 900) + 100}-${Math.floor(Math.random() * 900) + 100}-${Math.floor(Math.random() * 90) + 10}-${Math.floor(Math.random() * 90) + 10}`
}

// Generowanie losowego REGON (nieprawdziwy, tylko do testów)
function generateREGON(): string {
  return String(Math.floor(Math.random() * 900000000) + 100000000)
}

// Generowanie losowego numeru telefonu
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

// Generowanie losowego emaila
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

// Generowanie losowego adresu
function generateAddress(): string {
  const city = cities[Math.floor(Math.random() * cities.length)]
  const street = streets[Math.floor(Math.random() * streets.length)]
  const number = Math.floor(Math.random() * 200) + 1
  const postalCode = `${Math.floor(Math.random() * 90) + 10}-${Math.floor(Math.random() * 900) + 100}`
  return `${street} ${number}, ${postalCode} ${city}`
}

// Generowanie losowej strony WWW
function generateWebsite(companyName?: string): string {
  if (companyName) {
    const slug = companyName.toLowerCase()
      .replace(/[^a-z0-9]/g, "")
      .substring(0, 20)
    return `https://www.${slug}.pl`
  }
  return ""
}

// Generowanie losowej nazwy firmy
function generateCompanyName(): string {
  const sector = companySectors[Math.floor(Math.random() * companySectors.length)]
  const name = companyNames[Math.floor(Math.random() * companyNames.length)]
  const type = companyTypes[Math.floor(Math.random() * companyTypes.length)]
  return `${sector} ${name} ${type}`
}

// Generowanie losowej daty follow-up (w ciągu najbliższych 90 dni)
function generateNextFollowUp(): string {
  const days = Math.floor(Math.random() * 90)
  const date = new Date()
  date.setDate(date.getDate() + days)
  return date.toISOString().split("T")[0]
}

// Generowanie klienta (osoba fizyczna)
function generatePersonClient(index: number): any {
  const firstName = firstNames[Math.floor(Math.random() * firstNames.length)]
  const lastName = lastNames[Math.floor(Math.random() * lastNames.length)]
  const hasPESEL = Math.random() > 0.5
  const hasEmail = Math.random() > 0.1
  const hasPhone = Math.random() > 0.05
  const hasWebsite = Math.random() > 0.8
  const hasAddress = Math.random() > 0.3
  const hasSource = Math.random() > 0.2
  const hasFollowUp = Math.random() > 0.6
  
  return {
    "Typ": "PERSON",
    "Imię": firstName,
    "Nazwisko": lastName,
    "PESEL": hasPESEL ? generatePESEL() : "",
    "Nazwa firmy": "",
    "NIP": "",
    "REGON": "",
    "Email": hasEmail ? generateEmail(firstName, lastName) : "",
    "Telefon": hasPhone ? generatePhone() : "",
    "Strona WWW": hasWebsite ? generateWebsite() : "",
    "Adres": hasAddress ? generateAddress() : "",
    "Źródło pozyskania": hasSource ? sources[Math.floor(Math.random() * sources.length)] : "",
    "Status": statuses[Math.floor(Math.random() * statuses.length)],
    "Priorytet": priorities[Math.floor(Math.random() * priorities.length)],
    "Następny follow-up": hasFollowUp ? generateNextFollowUp() : ""
  }
}

// Generowanie klienta (firma)
function generateCompanyClient(index: number): any {
  const companyName = generateCompanyName()
  const hasNIP = Math.random() > 0.3
  const hasREGON = Math.random() > 0.3
  const hasEmail = Math.random() > 0.05
  const hasPhone = Math.random() > 0.05
  const hasWebsite = Math.random() > 0.1
  const hasAddress = Math.random() > 0.2
  const hasSource = Math.random() > 0.15
  const hasFollowUp = Math.random() > 0.5
  
  return {
    "Typ": "COMPANY",
    "Imię": "",
    "Nazwisko": "",
    "PESEL": "",
    "Nazwa firmy": companyName,
    "NIP": hasNIP ? generateNIP() : "",
    "REGON": hasREGON ? generateREGON() : "",
    "Email": hasEmail ? generateEmail("", "", companyName) : "",
    "Telefon": hasPhone ? generatePhone() : "",
    "Strona WWW": hasWebsite ? generateWebsite(companyName) : "",
    "Adres": hasAddress ? generateAddress() : "",
    "Źródło pozyskania": hasSource ? sources[Math.floor(Math.random() * sources.length)] : "",
    "Status": statuses[Math.floor(Math.random() * statuses.length)],
    "Priorytet": priorities[Math.floor(Math.random() * priorities.length)],
    "Następny follow-up": hasFollowUp ? generateNextFollowUp() : ""
  }
}

// Główna funkcja generująca plik Excel
function generateExcelFile() {
  console.log("Generowanie pliku Excel z 5000 losowych klientów...")
  
  const clients: any[] = []
  const totalClients = 5000
  
  // 60% osób fizycznych, 40% firm
  const personCount = Math.floor(totalClients * 0.6)
  const companyCount = totalClients - personCount
  
  // Generowanie osób fizycznych
  for (let i = 0; i < personCount; i++) {
    clients.push(generatePersonClient(i))
  }
  
  // Generowanie firm
  for (let i = 0; i < companyCount; i++) {
    clients.push(generateCompanyClient(i))
  }
  
  // Mieszanie kolejności
  for (let i = clients.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [clients[i], clients[j]] = [clients[j], clients[i]]
  }
  
  // Tworzenie arkusza
  const worksheet = XLSX.utils.json_to_sheet(clients)
  
  // Ustawienie szerokości kolumn
  const columnWidths = [
    { wch: 10 }, // Typ
    { wch: 15 }, // Imię
    { wch: 20 }, // Nazwisko
    { wch: 12 }, // PESEL
    { wch: 30 }, // Nazwa firmy
    { wch: 15 }, // NIP
    { wch: 12 }, // REGON
    { wch: 30 }, // Email
    { wch: 15 }, // Telefon
    { wch: 30 }, // Strona WWW
    { wch: 40 }, // Adres
    { wch: 20 }, // Źródło pozyskania
    { wch: 15 }, // Status
    { wch: 12 }, // Priorytet
    { wch: 20 }  // Następny follow-up
  ]
  worksheet["!cols"] = columnWidths
  
  // Tworzenie skoroszytu
  const workbook = XLSX.utils.book_new()
  XLSX.utils.book_append_sheet(workbook, worksheet, "Klienci")
  
  // Zapisanie pliku
  const outputPath = path.join(process.cwd(), "test-clients-5000.xlsx")
  XLSX.writeFile(workbook, outputPath)
  
  console.log(`✓ Plik został wygenerowany: ${outputPath}`)
  console.log(`✓ Liczba klientów: ${totalClients}`)
  console.log(`  - Osoby fizyczne: ${personCount}`)
  console.log(`  - Firmy: ${companyCount}`)
  console.log("\nPlik jest gotowy do importu w aplikacji CRM!")
}

// Uruchomienie
generateExcelFile()

