import { getCurrentUser } from "@/lib/auth"
import { redirect } from "next/navigation"
import { checkFeature, FEATURE_KEYS } from "@/lib/feature-flags"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Settings, AlertCircle, ArrowRight, CheckCircle, XCircle } from "lucide-react"
import Link from "next/link"

export default async function IntegrationsPage() {
  const user = await getCurrentUser()
  if (!user) {
    redirect("/signin")
  }

  // Check if user has access to external integrations
  const hasAccess = await checkFeature(user.id, FEATURE_KEYS.EXTERNAL_INTEGRATIONS)

  if (!hasAccess) {
    return (
      <div className="space-y-8">
        <div>
          <h1 className="text-3xl font-bold">Integracje zewnętrzne</h1>
          <p className="text-muted-foreground mt-2">
            Integracje z zewnętrznymi systemami CRM i narzędziami
          </p>
        </div>
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <AlertCircle className="h-5 w-5 text-amber-600" />
              Funkcja niedostępna
            </CardTitle>
            <CardDescription>
              Integracje zewnętrzne są dostępne tylko w planie PRO
            </CardDescription>
          </CardHeader>
          <CardContent>
            <p className="text-muted-foreground mb-4">
              Ulepsz plan swojej organizacji do PRO, aby uzyskać dostęp do integracji zewnętrznych.
            </p>
            <Link href="/pro-features">
              <Button>
                Zobacz funkcje PRO
                <ArrowRight className="h-4 w-4 ml-2" />
              </Button>
            </Link>
          </CardContent>
        </Card>
      </div>
    )
  }

  // Available integrations - systemy sprzedażowe, porównywarki ubezpieczeń itp.
  const integrations: Array<{
    id: string
    name: string
    description: string
    status: "not_configured" | "configured"
  }> = [
    {
      id: "comparison-platform",
      name: "Platforma porównawcza",
      description: "Integracja z porównywarkami ubezpieczeń - automatyczny import leadów",
      status: "not_configured",
    },
    {
      id: "sales-system",
      name: "System sprzedażowy",
      description: "Połączenie z systemem sprzedażowym - synchronizacja danych klientów",
      status: "not_configured",
    },
    {
      id: "insurance-api",
      name: "API ubezpieczeń",
      description: "Integracja z API dostawców ubezpieczeń - automatyczne pobieranie ofert",
      status: "not_configured",
    },
    {
      id: "crm-export",
      name: "Eksport do systemów zewnętrznych",
      description: "Eksport danych klientów do zewnętrznych systemów zarządzania",
      status: "not_configured",
    },
  ]

  return (
    <div className="space-y-8">
      <div>
        <div className="flex items-center gap-2 mb-2">
          <Settings className="h-8 w-8 text-purple-600" />
          <h1 className="text-3xl font-bold">Integracje zewnętrzne</h1>
        </div>
        <p className="text-muted-foreground">
          Połącz system z platformami porównawczymi, systemami sprzedażowymi i API ubezpieczeń
        </p>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {integrations.map((integration) => (
          <Card key={integration.id} className="hover:bg-muted/50 transition-colors">
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle className="text-lg">{integration.name}</CardTitle>
                {integration.status === "configured" ? (
                  <CheckCircle className="h-5 w-5 text-green-600" />
                ) : (
                  <XCircle className="h-5 w-5 text-gray-400" />
                )}
              </div>
              <CardDescription>{integration.description}</CardDescription>
            </CardHeader>
            <CardContent>
              <Button variant="outline" className="w-full" disabled>
                {integration.status === "configured" ? "Skonfiguruj" : "Wkrótce"}
              </Button>
            </CardContent>
          </Card>
        ))}
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Informacje</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground">
            Integracje zewnętrzne są w trakcie rozwoju. Wkrótce będzie możliwość połączenia z
            platformami porównawczymi, systemami sprzedażowymi i API dostawców ubezpieczeń.
          </p>
        </CardContent>
      </Card>
    </div>
  )
}

