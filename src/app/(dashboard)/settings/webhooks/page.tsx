import { getCurrentUser } from "@/lib/auth"
import { redirect } from "next/navigation"
import { checkFeature, FEATURE_KEYS } from "@/lib/feature-flags"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Webhook, AlertCircle, ArrowRight, Plus } from "lucide-react"
import Link from "next/link"
import { WebhooksList } from "@/components/settings/webhooks-list"

export default async function WebhooksPage() {
  const user = await getCurrentUser()
  if (!user) {
    redirect("/signin")
  }

  // Check if user has access to webhooks
  const hasAccess = await checkFeature(user.id, FEATURE_KEYS.WEBHOOKS)

  if (!hasAccess) {
    return (
      <div className="space-y-8">
        <div>
          <h1 className="text-3xl font-bold">Webhooks</h1>
          <p className="text-muted-foreground mt-2">
            Zarządzanie webhookami dla zewnętrznych integracji
          </p>
        </div>
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <AlertCircle className="h-5 w-5 text-amber-600" />
              Funkcja niedostępna
            </CardTitle>
            <CardDescription>
              Webhooks są dostępne tylko w planie PRO
            </CardDescription>
          </CardHeader>
          <CardContent>
            <p className="text-muted-foreground mb-4">
              Ulepsz plan swojej organizacji do PRO, aby uzyskać dostęp do zarządzania webhookami.
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
            <Webhook className="h-8 w-8 text-purple-600" />
            <h1 className="text-3xl font-bold">Webhooks</h1>
          </div>
          <p className="text-muted-foreground">
            Konfiguruj webhooks do automatycznego powiadamiania zewnętrznych systemów
          </p>
        </div>
        <Button>
          <Plus className="h-4 w-4 mr-2" />
          Nowy webhook
        </Button>
      </div>

      <WebhooksList />
    </div>
  )
}

