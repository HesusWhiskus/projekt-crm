import { db } from "../src/lib/db"

async function clearDatabase() {
  try {
    console.log("🧹 Czyszczenie bazy danych...")
    
    // Usuwanie danych w odpowiedniej kolejności (ze względu na relacje)
    console.log("Usuwanie załączników...")
    await db.attachment.deleteMany()
    
    console.log("Usuwanie kontaktów...")
    await db.contact.deleteMany()
    
    console.log("Usuwanie historii statusów klientów...")
    await db.clientStatusHistory.deleteMany()
    
    console.log("Usuwanie zadań...")
    await db.task.deleteMany()
    
    console.log("Usuwanie grup użytkowników...")
    await db.userGroup.deleteMany()
    
    console.log("Usuwanie logów aktywności...")
    await db.activityLog.deleteMany()
    
    console.log("Usuwanie klientów...")
    await db.client.deleteMany()
    
    console.log("Usuwanie grup...")
    await db.group.deleteMany()
    
    console.log("Usuwanie użytkowników...")
    await db.user.deleteMany()
    
    console.log("✅ Baza danych została wyczyszczona!")
    console.log("Możesz teraz założyć nowe konto.")
  } catch (error) {
    console.error("❌ Błąd podczas czyszczenia bazy:", error)
    throw error
  } finally {
    await db.$disconnect()
  }
}

clearDatabase()

