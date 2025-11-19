import { getCurrentUser } from "@/lib/auth"
import { redirect } from "next/navigation"
import { readFileSync } from "fs"
import { join } from "path"
import { MarkdownViewer } from "@/components/admin/markdown-viewer"

export default async function ApiDocsPage() {
  const user = await getCurrentUser()
  if (!user || user.role !== "ADMIN") {
    redirect("/dashboard")
  }

  // Read API documentation markdown file
  const filePath = join(process.cwd(), "API_DOCUMENTATION.md")
  let content = ""
  
  try {
    content = readFileSync(filePath, "utf-8")
  } catch (error) {
    content = "# Dokumentacja API\n\nNie udało się wczytać dokumentacji API."
  }

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-bold">Dokumentacja API</h1>
        <p className="text-muted-foreground mt-2">
          Pełna dokumentacja wszystkich endpointów API Internal CRM
        </p>
      </div>

      <div className="bg-card rounded-lg border border-border p-6">
        <MarkdownViewer content={content} />
      </div>
    </div>
  )
}

