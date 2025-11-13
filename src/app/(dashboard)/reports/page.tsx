import { getCurrentUser } from "@/lib/auth"
import { redirect } from "next/navigation"
import { checkFeature, FEATURE_KEYS } from "@/lib/feature-flags"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { BarChart3, TrendingUp, Users, Calendar, AlertCircle, ArrowRight } from "lucide-react"
import Link from "next/link"

export default async function ReportsPage() {
  const user = await getCurrentUser()
  if (!user) {
    redirect("/signin")
  }

  // Check if user has access to advanced reports
  const hasAccess = await checkFeature(user.id, FEATURE_KEYS.ADVANCED_REPORTS)

  if (!hasAccess) {
    return (
      <div className="space-y-8">
        <div>
          <h1 className="text-3xl font-bold">Zaawansowane raporty</h1>
          <p className="text-muted-foreground mt-2">
            Dostęp do zaawansowanych raportów i analityki
          </p>
        </div>
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <AlertCircle className="h-5 w-5 text-amber-600" />
              Funkcja niedostępna
            </CardTitle>
            <CardDescription>
              Zaawansowane raporty są dostępne tylko w planie PRO
            </CardDescription>
          </CardHeader>
          <CardContent>
            <p className="text-muted-foreground mb-4">
              Ulepsz plan swojej organizacji do PRO, aby uzyskać dostęp do zaawansowanych raportów
              i analityki.
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

  const reports = [
    {
      id: "sales",
      title: "Raport sprzedażowy",
      description: "Analiza pipeline, konwersji i przychodów",
      icon: TrendingUp,
      href: "/reports/sales",
      color: "text-blue-600",
    },
    {
      id: "activity",
      title: "Raport aktywności",
      description: "Kontakty, zadania i follow-up",
      icon: Calendar,
      href: "/reports/activity",
      color: "text-green-600",
    },
    {
      id: "clients",
      title: "Raport klientów",
      description: "Status, priorytet, źródło leadów",
      icon: Users,
      href: "/reports/clients",
      color: "text-purple-600",
    },
  ]

  return (
    <div className="space-y-8">
      <div>
        <div className="flex items-center gap-2 mb-2">
          <BarChart3 className="h-8 w-8 text-purple-600" />
          <h1 className="text-3xl font-bold">Zaawansowane raporty</h1>
        </div>
        <p className="text-muted-foreground">
          Przegląd i analiza danych z systemu CRM
        </p>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {reports.map((report) => {
          const Icon = report.icon
          return (
            <Link key={report.id} href={report.href}>
              <Card className="hover:bg-muted/50 transition-colors cursor-pointer h-full">
                <CardHeader>
                  <div className="flex items-center gap-2">
                    <Icon className={`h-6 w-6 ${report.color}`} />
                    <CardTitle className="text-lg">{report.title}</CardTitle>
                  </div>
                  <CardDescription>{report.description}</CardDescription>
                </CardHeader>
                <CardContent>
                  <Button variant="outline" className="w-full">
                    Zobacz raport
                    <ArrowRight className="h-4 w-4 ml-2" />
                  </Button>
                </CardContent>
              </Card>
            </Link>
          )
        })}
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Informacje</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground">
            Raporty są generowane na podstawie danych z systemu. Możesz eksportować raporty do
            formatu Excel lub PDF.
          </p>
        </CardContent>
      </Card>
    </div>
  )
}

