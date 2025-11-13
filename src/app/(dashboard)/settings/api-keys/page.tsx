import { getCurrentUser } from "@/lib/auth"
import { redirect } from "next/navigation"
import { checkFeature, FEATURE_KEYS } from "@/lib/feature-flags"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Key, AlertCircle, ArrowRight, Plus } from "lucide-react"
import Link from "next/link"
import { ApiKeysList } from "@/components/settings/api-keys-list"

export default async function ApiKeysPage() {
  const user = await getCurrentUser()
  if (!user) {
    redirect("/signin")
  }

  // Check if user has access to API keys
  const hasAccess = await checkFeature(user.id, FEATURE_KEYS.API_KEYS)

  if (!hasAccess) {
    return (
      <div className="space-y-8">
        <div>
          <h1 className="text-3xl font-bold">Klucze API</h1>
          <p className="text-muted-foreground mt-2">
            Zarządzanie kluczami API dla integracji zewnętrznych
          </p>
        </div>
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <AlertCircle className="h-5 w-5 text-amber-600" />
              Funkcja niedostępna
            </CardTitle>
            <CardDescription>
              Klucze API są dostępne tylko w planie PRO
            </CardDescription>
          </CardHeader>
          <CardContent>
            <p className="text-muted-foreground mb-4">
              Ulepsz plan swojej organizacji do PRO, aby uzyskać dostęp do zarządzania kluczami API.
            </p>
            <Link href="/dashboard/pro-features">
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

  return (
    <div className="space-y-8">
      <div className="flex items-center justify-between">
        <div>
          <div className="flex items-center gap-2 mb-2">
            <Key className="h-8 w-8 text-purple-600" />
            <h1 className="text-3xl font-bold">Klucze API</h1>
          </div>
          <p className="text-muted-foreground">
            Generuj i zarządzaj kluczami API do integracji zewnętrznych
          </p>
        </div>
        <Button>
          <Plus className="h-4 w-4 mr-2" />
          Nowy klucz
        </Button>
      </div>

      <ApiKeysList />
    </div>
  )
}

