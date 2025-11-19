import { getCurrentUser } from "@/lib/auth"
import { redirect } from "next/navigation"
import { headers } from "next/headers"

export default async function AdminLogsPage() {
  const user = await getCurrentUser()
  if (!user || user.role !== "ADMIN") {
    redirect("/dashboard")
  }

  // Fetch auth logs from API endpoint
  let logs: any[] = []
  
  try {
    const headersList = await headers()
    const host = headersList.get("host") || "localhost:3000"
    const cookie = headersList.get("cookie") || ""
    const baseUrl = process.env.NEXTAUTH_URL || (host.includes("localhost") 
      ? "http://localhost:3000" 
      : `https://${host}`)
    
    const response = await fetch(`${baseUrl}/api/auth-logs`, {
      cache: "no-store",
      headers: {
        Cookie: cookie,
      },
    })
    
    if (response.ok) {
      const data = await response.json()
      logs = data.logs || []
    }
  } catch (error: any) {
    console.error("[AdminLogsPage] Error fetching auth logs:", error)
  }

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-bold">Logi systemowe</h1>
        <p className="text-muted-foreground mt-2">
          Przegląd logów autoryzacji i aktywności użytkowników
        </p>
      </div>

      <div className="bg-card rounded-lg border border-border p-6">
        {logs.length === 0 ? (
          <p className="text-muted-foreground">Brak logów do wyświetlenia</p>
        ) : (
          <div className="space-y-4">
            <div className="overflow-x-auto">
              <table className="min-w-full border-collapse">
                <thead>
                  <tr className="border-b">
                    <th className="text-left p-2 font-semibold">Data</th>
                    <th className="text-left p-2 font-semibold">Użytkownik</th>
                    <th className="text-left p-2 font-semibold">Akcja</th>
                    <th className="text-left p-2 font-semibold">IP</th>
                    <th className="text-left p-2 font-semibold">Status</th>
                  </tr>
                </thead>
                <tbody>
                  {logs.map((log: any, index: number) => (
                    <tr key={index} className="border-b">
                      <td className="p-2 text-sm">
                        {log.timestamp ? new Date(log.timestamp).toLocaleString("pl-PL") : "-"}
                      </td>
                      <td className="p-2 text-sm">{log.email || log.userId || "-"}</td>
                      <td className="p-2 text-sm">{log.action || "-"}</td>
                      <td className="p-2 text-sm">{log.ip || "-"}</td>
                      <td className="p-2 text-sm">
                        <span className={`px-2 py-1 rounded text-xs ${
                          log.success ? "bg-green-100 text-green-800" : "bg-red-100 text-red-800"
                        }`}>
                          {log.success ? "Sukces" : "Błąd"}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

