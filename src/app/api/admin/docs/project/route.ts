import { NextResponse } from "next/server"
import { getCurrentUser } from "@/lib/auth"
import { readFileSync } from "fs"
import { join } from "path"
import { existsSync } from "fs"

export async function GET() {
  const user = await getCurrentUser()
  
  if (!user || user.role !== "ADMIN") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  // Read README markdown file
  const filePath = join(process.cwd(), "README.md")
  let content = ""
  
  try {
    // Check if file exists first
    if (!existsSync(filePath)) {
      console.error("[Project Docs Endpoint] File does not exist:", filePath)
      return NextResponse.json(
        { 
          error: "Nie udało się wczytać dokumentacji projektu",
          details: "Plik README.md nie został znaleziony"
        },
        { status: 404 }
      )
    }
    
    content = readFileSync(filePath, "utf-8")
    
    if (!content || content.trim().length === 0) {
      return NextResponse.json(
        { 
          error: "Plik dokumentacji jest pusty",
          content: ""
        },
        { status: 200 }
      )
    }
  } catch (error: any) {
    console.error("[Project Docs Endpoint] Error reading README.md:", error)
    return NextResponse.json(
      { 
        error: "Nie udało się wczytać dokumentacji projektu",
        details: error?.message || "Nieznany błąd"
      },
      { status: 500 }
    )
  }

  return NextResponse.json({ content })
}

