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

  // Available integrations (skeleton - to be implemented)
  const integrations: Array<{
    id: string
    name: string
    description: string
    status: "not_configured" | "configured"
  }> = [
    {
      id: "salesforce",
      name: "Salesforce",
      description: "Synchronizacja klientów i kontaktów z Salesforce",
      status: "not_configured",
    },
    {
      id: "hubspot",
      name: "HubSpot",
      description: "Dwukierunkowa synchronizacja z HubSpot CRM",
      status: "not_configured",
    },
    {
      id: "pipedrive",
      name: "Pipedrive",
      description: "Import i eksport danych z Pipedrive",
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
          Połącz system z zewnętrznymi narzędziami CRM i zwiększ produktywność
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
            popularnymi systemami CRM.
          </p>
        </CardContent>
      </Card>
    </div>
  )
}

