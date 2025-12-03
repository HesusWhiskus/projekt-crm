import { getCurrentUser } from "@/lib/auth"
import { redirect } from "next/navigation"
import { headers } from "next/headers"
import { MarkdownViewer } from "@/components/admin/markdown-viewer"

export default async function ProjectDocsPage() {
  const user = await getCurrentUser()
  if (!user || user.role !== "ADMIN") {
    redirect("/dashboard")
  }

  // Fetch project documentation from API endpoint
  let content = ""
  
  try {
    const headersList = await headers()
    const host = headersList.get("host") || "localhost:3000"
    const cookie = headersList.get("cookie") || ""
    const baseUrl = process.env.NEXTAUTH_URL || (host.includes("localhost") 
      ? "http://localhost:3000" 
      : `https://${host}`)
    
    const response = await fetch(`${baseUrl}/api/admin/docs/project`, {
      cache: "no-store",
      headers: {
        // Pass cookies manually for Server Component fetch
        Cookie: cookie,
      },
    })
    
    if (response.ok) {
      const data = await response.json()
      content = data.content || ""
      if (!content || content.trim().length === 0) {
        content = "# Dokumentacja projektu\n\nPlik dokumentacji jest pusty."
      }
    } else {
      const errorData = await response.json().catch(() => ({}))
      content = `# Dokumentacja projektu\n\nNie udało się wczytać dokumentacji projektu.\n\n**Status:** ${response.status}\n\n**Błąd:** ${errorData.error || "Nieznany błąd"}\n\n${errorData.details ? `**Szczegóły:** ${errorData.details}` : ""}`
    }
  } catch (error: unknown) {
    console.error("[ProjectDocsPage] Error fetching project documentation:", error)
    const errorMessage = error instanceof Error ? error.message : "Nieznany błąd"
    content = `# Dokumentacja projektu\n\nNie udało się wczytać dokumentacji projektu.\n\n**Błąd:** ${errorMessage}`
  }

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-bold">Dokumentacja projektu</h1>
        <p className="text-muted-foreground mt-2">
          Ogólna dokumentacja projektu, instalacja i konfiguracja
        </p>
      </div>

      <div className="bg-card rounded-lg border border-border p-6">
        <MarkdownViewer content={content} />
      </div>
    </div>
  )
}

