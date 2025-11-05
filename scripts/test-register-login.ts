import { db } from "../src/lib/db"
import { hash, compare } from "bcryptjs"

async function testRegisterAndLogin() {
  try {
    console.log("🧪 Testowanie rejestracji i logowania...\n")
    
    // 1. Wyczyść bazę
    console.log("1. Czyszczenie bazy...")
    await db.user.deleteMany()
    console.log("   ✅ Baza wyczyszczona\n")
    
    // 2. Zarejestruj użytkownika (jak w API)
    console.log("2. Rejestracja użytkownika...")
    const testEmail = "test@example.com"
    const testPassword = "testpassword123"
    const testName = "Test User"
    
    const hashedPassword = await hash(testPassword, 10)
    const user = await db.user.create({
      data: {
        email: testEmail,
        name: testName,
        password: hashedPassword,
        role: "USER",
      },
    })
    console.log(`   ✅ Użytkownik utworzony: ${user.id}`)
    console.log(`   Email: ${user.email}`)
    console.log(`   Role: ${user.role}\n`)
    
    // 3. Sprawdź czy użytkownik istnieje
    console.log("3. Sprawdzanie użytkownika w bazie...")
    const dbUser = await db.user.findUnique({
      where: { email: testEmail },
    })
    
    if (!dbUser) {
      throw new Error("Użytkownik nie został znaleziony!")
    }
    
    console.log(`   ✅ Użytkownik znaleziony: ${dbUser.id}\n`)
    
    // 4. Test logowania (jak w authorize)
    console.log("4. Testowanie logowania (authorize)...")
    if (!dbUser.password) {
      throw new Error("Użytkownik nie ma hasła!")
    }
    
    const isPasswordValid = await compare(testPassword, dbUser.password)
    
    if (!isPasswordValid) {
      throw new Error("Hasło nie jest poprawne!")
    }
    
    console.log("   ✅ Hasło zweryfikowane\n")
    
    // 5. Struktura danych dla NextAuth
    console.log("5. Struktura danych dla NextAuth:")
    const authUser = {
      id: dbUser.id,
      email: dbUser.email,
      name: dbUser.name,
      image: dbUser.image,
      role: dbUser.role,
    }
    
    console.log(JSON.stringify(authUser, null, 2))
    console.log("\n✅ Wszystkie testy zakończone pomyślnie!")
    console.log("\n📝 Dane testowe:")
    console.log(`   Email: ${testEmail}`)
    console.log(`   Hasło: ${testPassword}`)
    console.log("\nMożesz teraz przetestować logowanie w aplikacji.")
    
  } catch (error) {
    console.error("❌ Błąd:", error)
    throw error
  } finally {
    await db.$disconnect()
  }
}

testRegisterAndLogin()

