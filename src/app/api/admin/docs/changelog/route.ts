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

  // Read CHANGELOG markdown file
  // File should be in the root directory (copied by Dockerfile in production)
  const filePath = join(process.cwd(), "CHANGELOG.md")
  let content = ""
  
  try {
    // Check if file exists
    if (!existsSync(filePath)) {
      console.error("[Changelog Endpoint] File does not exist:", filePath)
      console.error("[Changelog Endpoint] process.cwd():", process.cwd())
      return NextResponse.json(
        { 
          error: "Nie udało się wczytać changelog",
          details: `Plik CHANGELOG.md nie został znaleziony w: ${filePath}`
        },
        { status: 404 }
      )
    }
    
    content = readFileSync(filePath, "utf-8")
    
    if (!content || content.trim().length === 0) {
      return NextResponse.json(
        { 
          error: "Plik changelog jest pusty",
          content: ""
        },
        { status: 200 }
      )
    }
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  } catch (error: any) {
    console.error("[Changelog Endpoint] Error reading CHANGELOG.md:", error)
    return NextResponse.json(
      { 
        error: "Nie udało się wczytać changelog",
        details: error?.message || "Nieznany błąd"
      },
      { status: 500 }
    )
  }

  return NextResponse.json({ content })
}




