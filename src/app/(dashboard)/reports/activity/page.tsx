import { getCurrentUser } from "@/lib/auth"
import { redirect } from "next/navigation"
import { checkFeature, FEATURE_KEYS } from "@/lib/feature-flags"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Calendar, AlertCircle, ArrowRight } from "lucide-react"
import Link from "next/link"
import { Button } from "@/components/ui/button"

export default async function ActivityReportPage() {
  const user = await getCurrentUser()
  if (!user) {
    redirect("/signin")
  }

  const hasAccess = await checkFeature(user.id, FEATURE_KEYS.ADVANCED_REPORTS)
  if (!hasAccess) {
    return (
      <div className="space-y-8">
        <div>
          <h1 className="text-3xl font-bold">Raport aktywności</h1>
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
          <Calendar className="h-8 w-8 text-green-600" />
          <h1 className="text-3xl font-bold">Raport aktywności</h1>
        </div>
        <p className="text-muted-foreground">
          Kontakty, zadania i follow-up
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Raport aktywności</CardTitle>
          <CardDescription>
            Analiza kontaktów, zadań i follow-up
          </CardDescription>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground">
            Raport aktywności jest w trakcie implementacji. Wkrótce będzie dostępna szczegółowa analiza kontaktów, zadań i follow-up.
          </p>
        </CardContent>
      </Card>
    </div>
  )
}

