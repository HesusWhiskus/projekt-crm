import { NextResponse } from "next/server"
import { getCurrentUser } from "@/lib/auth"
import { readFileSync } from "fs"
import { join, dirname, resolve } from "path"
import { existsSync } from "fs"
import { fileURLToPath } from "url"

// Get __dirname equivalent for ES modules
const __filename = fileURLToPath(import.meta.url)
const __dirname = dirname(__filename)

export async function GET() {
  const user = await getCurrentUser()
  
  if (!user || user.role !== "ADMIN") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  // Read API documentation markdown file
  // Try multiple possible paths for different environments
  const cwd = process.cwd()
  const possiblePaths = [
    join(cwd, "API_DOCUMENTATION.md"),
    resolve(cwd, "API_DOCUMENTATION.md"),
    join(cwd, "..", "API_DOCUMENTATION.md"),
    join(cwd, "..", "..", "API_DOCUMENTATION.md"),
    resolve(__dirname, "..", "..", "..", "..", "..", "API_DOCUMENTATION.md"),
    resolve(__dirname, "..", "..", "..", "..", "API_DOCUMENTATION.md"),
  ]
  
  let filePath: string | null = null
  let content = ""
  
  // Find the file in one of the possible paths
  for (const path of possiblePaths) {
    try {
      if (existsSync(path)) {
        filePath = path
        console.log("[API Docs Endpoint] Found file at:", path)
        break
      }
    } catch (err) {
      // Continue to next path if this one fails
      continue
    }
  }
  
  if (!filePath) {
    console.error("[API Docs Endpoint] File not found in any of these paths:", possiblePaths)
    console.error("[API Docs Endpoint] process.cwd():", cwd)
    console.error("[API Docs Endpoint] __dirname:", __dirname)
    return NextResponse.json(
      { 
        error: "Nie udało się wczytać dokumentacji API",
        details: `Plik API_DOCUMENTATION.md nie został znaleziony. Sprawdzono ścieżki: ${possiblePaths.slice(0, 3).join(", ")}...`,
        debug: {
          cwd: cwd,
          dirname: __dirname,
        }
      },
      { status: 404 }
    )
  }
  
  try {
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
    console.error("[API Docs Endpoint] Error reading API_DOCUMENTATION.md:", error)
    return NextResponse.json(
      { 
        error: "Nie udało się wczytać dokumentacji API",
        details: error?.message || "Nieznany błąd"
      },
      { status: 500 }
    )
  }

  return NextResponse.json({ content })
}

