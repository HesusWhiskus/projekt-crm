import { getCurrentUser } from "@/lib/auth"
import { redirect } from "next/navigation"
import { readFileSync } from "fs"
import { join } from "path"
import { MarkdownViewer } from "@/components/admin/markdown-viewer"

export default async function ProjectDocsPage() {
  const user = await getCurrentUser()
  if (!user || user.role !== "ADMIN") {
    redirect("/dashboard")
  }

  // Read README markdown file
  const filePath = join(process.cwd(), "README.md")
  let content = ""
  
  try {
    content = readFileSync(filePath, "utf-8")
  } catch (error) {
    content = "# Dokumentacja projektu\n\nNie udało się wczytać dokumentacji projektu."
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

