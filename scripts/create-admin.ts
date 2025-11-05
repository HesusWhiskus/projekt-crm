import { db } from "../src/lib/db"
import { hash } from "bcryptjs"

async function createAdmin() {
  try {
    console.log("🔐 Tworzenie konta administratora...\n")

    // Domyślne dane administratora
    const email = process.env.ADMIN_EMAIL || "admin@example.com"
    const password = process.env.ADMIN_PASSWORD || "Admin123!"
    const name = process.env.ADMIN_NAME || "Administrator"

    console.log(`Email: ${email}`)
    console.log(`Hasło: ${password}`)
    console.log(`Imię: ${name}\n`)

    // Sprawdź czy użytkownik już istnieje
    const existingUser = await db.user.findUnique({
      where: { email },
    })

    if (existingUser) {
      // Aktualizuj istniejącego użytkownika na admina
      const hashedPassword = await hash(password, 10)
      const updatedUser = await db.user.update({
        where: { email },
        data: {
          name,
          password: hashedPassword,
          role: "ADMIN",
        },
      })

      console.log(`✅ Zaktualizowano istniejącego użytkownika na administratora`)
      console.log(`   ID: ${updatedUser.id}`)
      console.log(`   Email: ${updatedUser.email}`)
      console.log(`   Role: ${updatedUser.role}\n`)
    } else {
      // Utwórz nowego administratora
      const hashedPassword = await hash(password, 10)
      const admin = await db.user.create({
        data: {
          email,
          name,
          password: hashedPassword,
          role: "ADMIN",
          emailVerified: new Date(),
        },
      })

      console.log(`✅ Konto administratora zostało utworzone`)
      console.log(`   ID: ${admin.id}`)
      console.log(`   Email: ${admin.email}`)
      console.log(`   Role: ${admin.role}\n`)
    }

    console.log("📝 Możesz teraz zalogować się używając:")
    console.log(`   Email: ${email}`)
    console.log(`   Hasło: ${password}\n`)

    console.log("⚠️  WAŻNE: Zmień hasło po pierwszym zalogowaniu!")
    console.log("   Możesz ustawić zmienne środowiskowe ADMIN_EMAIL i ADMIN_PASSWORD\n")

    process.exit(0)
  } catch (error) {
    console.error("❌ Błąd podczas tworzenia administratora:", error)
    process.exit(1)
  }
}

createAdmin()

