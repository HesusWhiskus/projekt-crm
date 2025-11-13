import { getCurrentUser } from "@/lib/auth"
import { redirect } from "next/navigation"
import { checkFeature, FEATURE_KEYS } from "@/lib/feature-flags"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Users, AlertCircle, ArrowRight } from "lucide-react"
import Link from "next/link"
import { Button } from "@/components/ui/button"

export default async function ClientsReportPage() {
  const user = await getCurrentUser()
  if (!user) {
    redirect("/signin")
  }

  const hasAccess = await checkFeature(user.id, FEATURE_KEYS.ADVANCED_REPORTS)
  if (!hasAccess) {
    return (
      <div className="space-y-8">
        <div>
          <h1 className="text-3xl font-bold">Raport klientów</h1>
        </div>
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <AlertCircle className="h-5 w-5 text-amber-600" />
              Funkcja niedostępna
            </CardTitle>
            <CardDescription>Zaawansowane raporty są dostępne tylko w planie PRO</CardDescription>
          </CardHeader>
          <CardContent>
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

  return (
    <div className="space-y-8">
      <div>
        <div className="flex items-center gap-2 mb-2">
          <Users className="h-8 w-8 text-purple-600" />
          <h1 className="text-3xl font-bold">Raport klientów</h1>
        </div>
        <p className="text-muted-foreground">
          Status, priorytet, źródło leadów
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Raport klientów</CardTitle>
          <CardDescription>
            Analiza statusu, priorytetu i źródła leadów
          </CardDescription>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground">
            Raport klientów jest w trakcie implementacji. Wkrótce będzie dostępna szczegółowa analiza statusu, priorytetu i źródła leadów.
          </p>
        </CardContent>
      </Card>
    </div>
  )
}

