import { getCurrentUser } from "@/lib/auth"
import { redirect } from "next/navigation"
import { ImportForm } from "@/components/admin/import-form"

export default async function ImportPage() {
  const user = await getCurrentUser()
  if (!user || user.role !== "ADMIN") {
    redirect("/dashboard")
  }

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-bold">Import danych z Excel</h1>
        <p className="text-muted-foreground mt-2">
          Zaimportuj klientów i kontakty z pliku Excel do systemu
        </p>
      </div>

      <ImportForm />
    </div>
  )
}

