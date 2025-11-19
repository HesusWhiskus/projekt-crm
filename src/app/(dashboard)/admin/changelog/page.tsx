import { getCurrentUser } from "@/lib/auth"
import { redirect } from "next/navigation"
import { headers } from "next/headers"
import { MarkdownViewer } from "@/components/admin/markdown-viewer"

export default async function AdminChangelogPage() {
  const user = await getCurrentUser()
  if (!user || user.role !== "ADMIN") {
    redirect("/dashboard")
  }

  // Fetch changelog from API endpoint
  let content = ""
  
  try {
    const headersList = await headers()
    const host = headersList.get("host") || "localhost:3000"
    const cookie = headersList.get("cookie") || ""
    const baseUrl = process.env.NEXTAUTH_URL || (host.includes("localhost") 
      ? "http://localhost:3000" 
      : `https://${host}`)
    
    const response = await fetch(`${baseUrl}/api/admin/docs/changelog`, {
      cache: "no-store",
      headers: {
        Cookie: cookie,
      },
    })
    
    if (response.ok) {
      const data = await response.json()
      content = data.content || ""
      if (!content || content.trim().length === 0) {
        content = "# Changelog\n\nPlik changelog jest pusty."
      }
    } else {
      const errorData = await response.json().catch(() => ({}))
      content = `# Changelog\n\nNie udało się wczytać changelog.\n\n**Status:** ${response.status}\n\n**Błąd:** ${errorData.error || "Nieznany błąd"}\n\n${errorData.details ? `**Szczegóły:** ${errorData.details}` : ""}`
    }
  } catch (error: any) {
    console.error("[AdminChangelogPage] Error fetching changelog:", error)
    content = `# Changelog\n\nNie udało się wczytać changelog.\n\n**Błąd:** ${error?.message || "Nieznany błąd"}`
  }

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-bold">Changelog</h1>
        <p className="text-muted-foreground mt-2">
          Historia zmian i aktualizacji systemu
        </p>
      </div>

      <div className="bg-card rounded-lg border border-border p-6">
        <MarkdownViewer content={content} />
      </div>
    </div>
  )
}

