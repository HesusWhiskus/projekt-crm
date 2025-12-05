"use client"

import { Card, CardContent } from "@/components/ui/card"
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs"
import { SalesFunnel } from "@/components/sales/sales-funnel"
import { ChartWidget } from "@/components/dashboard/widgets/chart-widget"
import { StatsWidget } from "@/components/dashboard/widgets/stats-widget"
import { BarChart3, TrendingUp, Users, DollarSign } from "lucide-react"

import { ClientStatus } from "@prisma/client"

interface ReportsDashboardProps {
  salesFunnelData?: Array<{
    status: ClientStatus | string
    count: number
    percentage: number
  }>
  totalClients?: number
  conversionRate?: number
  averageDealValue?: number
  className?: string
}

export function ReportsDashboard({
  salesFunnelData = [],
  totalClients = 0,
  conversionRate = 0,
  averageDealValue = 0,
  className,
}: ReportsDashboardProps) {
  return (
    <div className={className}>
      <div className="mb-6">
        <h1 className="text-3xl font-bold">Raporty</h1>
        <p className="text-muted-foreground mt-2">
          Analiza wydajności i metryki sprzedażowe
        </p>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4 mb-6">
        <StatsWidget
          title="Łączna liczba klientów"
          value={totalClients}
          icon={Users}
        />
        <StatsWidget
          title="Współczynnik konwersji"
          value={`${conversionRate.toFixed(1)}%`}
          icon={TrendingUp}
        />
        <StatsWidget
          title="Średnia wartość transakcji"
          value={`${averageDealValue.toFixed(2)} zł`}
          icon={DollarSign}
        />
        <StatsWidget
          title="Aktywni klienci"
          value={salesFunnelData.find((d) => d.status === "ACTIVE_CLIENT")?.count || 0}
          icon={BarChart3}
        />
      </div>

      <Tabs defaultValue="funnel" className="w-full">
        <TabsList>
          <TabsTrigger value="funnel">Lejek sprzedażowy</TabsTrigger>
          <TabsTrigger value="performance">Wydajność</TabsTrigger>
          <TabsTrigger value="trends">Trendy</TabsTrigger>
        </TabsList>

        <TabsContent value="funnel" className="mt-6">
          {salesFunnelData && salesFunnelData.length > 0 ? (
            <SalesFunnel
              data={salesFunnelData as Array<{ status: ClientStatus; count: number; percentage: number }>}
              total={totalClients || 0}
            />
          ) : (
            <Card>
              <CardContent className="py-8">
                <p className="text-center text-muted-foreground">
                  Brak danych do wyświetlenia
                </p>
              </CardContent>
            </Card>
          )}
        </TabsContent>

        <TabsContent value="performance" className="mt-6">
          <ChartWidget
            title="Wydajność sprzedażowa"
            description="Analiza wydajności w czasie"
          >
            <div className="h-64 flex items-center justify-center text-muted-foreground">
              Wykres wydajności (do implementacji)
            </div>
          </ChartWidget>
        </TabsContent>

        <TabsContent value="trends" className="mt-6">
          <ChartWidget
            title="Trendy sprzedażowe"
            description="Analiza trendów w czasie"
          >
            <div className="h-64 flex items-center justify-center text-muted-foreground">
              Wykres trendów (do implementacji)
            </div>
          </ChartWidget>
        </TabsContent>
      </Tabs>
    </div>
  )
}

