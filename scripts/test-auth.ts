import { db } from "../src/lib/db"
import { hash, compare } from "bcryptjs"

async function testAuth() {
  try {
    console.log("🧪 Testowanie autoryzacji...\n")
    
    // 1. Sprawdź czy baza działa
    console.log("1. Sprawdzanie połączenia z bazą...")
    const userCount = await db.user.count()
    console.log(`   ✅ Połączenie OK. Liczba użytkowników: ${userCount}\n`)
    
    // 2. Utwórz testowego użytkownika
    console.log("2. Tworzenie testowego użytkownika...")
    const testEmail = "test@example.com"
    const testPassword = "testpassword123"
    
    // Usuń istniejącego użytkownika jeśli istnieje
    const existingUser = await db.user.findUnique({
      where: { email: testEmail },
    })
    
    if (existingUser) {
      await db.user.delete({ where: { email: testEmail } })
      console.log("   Usunięto istniejącego użytkownika")
    }
    
    // Utwórz nowego użytkownika
    const hashedPassword = await hash(testPassword, 10)
    const user = await db.user.create({
      data: {
        email: testEmail,
        name: "Test User",
        password: hashedPassword,
        role: "USER",
      },
    })
    console.log(`   ✅ Użytkownik utworzony: ${user.id}`)
    console.log(`   Email: ${user.email}`)
    console.log(`   Role: ${user.role}\n`)
    
    // 3. Sprawdź czy użytkownik istnieje w bazie
    console.log("3. Sprawdzanie użytkownika w bazie...")
    const dbUser = await db.user.findUnique({
      where: { email: testEmail },
    })
    
    if (!dbUser) {
      throw new Error("Użytkownik nie został znaleziony w bazie!")
    }
    
    if (!dbUser.password) {
      throw new Error("Użytkownik nie ma hasła!")
    }
    
    console.log(`   ✅ Użytkownik znaleziony: ${dbUser.id}`)
    console.log(`   Hasło: ${dbUser.password ? "TAK" : "NIE"}\n`)
    
    // 4. Sprawdź weryfikację hasła
    console.log("4. Testowanie weryfikacji hasła...")
    const isPasswordValid = await compare(testPassword, dbUser.password)
    
    if (!isPasswordValid) {
      throw new Error("Hasło nie jest poprawne!")
    }
    console.log("   ✅ Hasło zweryfikowane poprawnie\n")
    
    // 5. Sprawdź strukturę danych zwracanych przez authorize
    console.log("5. Sprawdzanie struktury danych dla NextAuth...")
    const authUser = {
      id: dbUser.id,
      email: dbUser.email,
      name: dbUser.name,
      image: dbUser.image,
      role: dbUser.role,
    }
    
    console.log("   Struktura użytkownika dla NextAuth:")
    console.log(`   - id: ${authUser.id}`)
    console.log(`   - email: ${authUser.email}`)
    console.log(`   - name: ${authUser.name}`)
    console.log(`   - role: ${authUser.role}\n`)
    
    // 6. Sprawdź czy ActivityLog działa
    console.log("6. Testowanie ActivityLog...")
    try {
      await db.activityLog.create({
        data: {
          userId: dbUser.id,
          action: "TEST_ACTION",
          entityType: "User",
          entityId: dbUser.id,
        },
      })
      console.log("   ✅ ActivityLog działa\n")
    } catch (error) {
      console.log(`   ⚠️ ActivityLog błąd: ${error}\n`)
    }
    
    console.log("✅ Wszystkie testy zakończone pomyślnie!")
    console.log("\n📝 Dane testowe:")
    console.log(`   Email: ${testEmail}`)
    console.log(`   Hasło: ${testPassword}`)
    console.log("\nMożesz teraz przetestować logowanie w aplikacji.")
    
  } catch (error) {
    console.error("❌ Błąd podczas testowania:", error)
    throw error
  } finally {
    await db.$disconnect()
  }
}

testAuth()

