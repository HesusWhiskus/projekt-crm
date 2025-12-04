"use client"

import { useMemo, useCallback, memo, useState } from "react"
import { WidgetRegistry, WidgetConfig } from "./widgets/widget-registry"
import { WidgetSettingsDialog } from "./widgets/widget-settings-dialog"
import { Users, FileText, CheckSquare, Clock, AlertCircle, Calendar, Shield, Car, TrendingUp, FileCheck, Settings2 } from "lucide-react"
import { Button } from "@/components/ui/button"
import Link from "next/link"

interface DashboardWidgetsProps {
  stats: {
    clientsCount: number
    contactsCount: number
    tasksCount: number
    noContact7Days: number
    noContact30Days: number
    followUpToday: number
  }
  upcomingTasks: Array<{
    id: string
    title: string
    description: string | null
    dueDate: Date | null
    client: {
      id: string
      firstName: string | null
      lastName: string | null
      companyName?: string | null
      type: string
    } | null
  }>
  insuranceStats?: {
    calculationsCount: number
    calculationsDraft: number
    calculationsSent: number
    calculationsAccepted: number
    calculationsRejected: number
    policiesCount: number
    policiesActive: number
    policiesExpiringSoon: number
    vehiclesCount: number
    recentCalculations: Array<any>
    upcomingRenewals: Array<any>
  } | null
}

export const DashboardWidgets = memo(function DashboardWidgets({
  stats,
  upcomingTasks,
  insuranceStats,
}: DashboardWidgetsProps) {
  const [settingsOpen, setSettingsOpen] = useState(false)

  const getClientDisplayName = useCallback((client: DashboardWidgetsProps["upcomingTasks"][0]["client"]) => {
    if (!client) return "-"
    if (client.type === "COMPANY") {
      return client.companyName || "Brak nazwy firmy"
    }
    const name = [client.firstName, client.lastName].filter(Boolean).join(" ")
    return name || "Brak nazwy"
  }, [])

  // Memoized widgets configuration
  const widgets: WidgetConfig[] = useMemo(() => {
    const baseWidgets: WidgetConfig[] = [
    // Stats widgets
    {
      id: "clients",
      type: "stats",
      title: "Klienci",
      order: 1,
      size: "small",
      props: {
        title: "Klienci",
        value: stats.clientsCount,
        icon: Users,
        description: "Łączna liczba klientów",
        href: "/clients",
      },
    },
    {
      id: "contacts",
      type: "stats",
      title: "Kontakty",
      order: 2,
      size: "small",
      props: {
        title: "Kontakty",
        value: stats.contactsCount,
        icon: FileText,
        description: "Twoje interakcje",
        href: "/contacts",
      },
    },
    {
      id: "tasks",
      type: "stats",
      title: "Zadania",
      order: 3,
      size: "small",
      props: {
        title: "Zadania",
        value: stats.tasksCount,
        icon: CheckSquare,
        description: "Wszystkie zadania",
        href: "/tasks",
      },
    },
    // Lead management stats
    {
      id: "noContact7Days",
      type: "stats",
      title: "Bez kontaktu 7+ dni",
      order: 4,
      size: "small",
      props: {
        title: "Bez kontaktu 7+ dni",
        value: stats.noContact7Days,
        icon: Clock,
        description: "Wymagają kontaktu",
        href: "/clients?filter=noContact7Days",
      },
    },
    {
      id: "noContact30Days",
      type: "stats",
      title: "Bez kontaktu 30+ dni",
      order: 5,
      size: "small",
      props: {
        title: "Bez kontaktu 30+ dni",
        value: stats.noContact30Days,
        icon: AlertCircle,
        description: "Wymagają pilnego kontaktu",
        href: "/clients?filter=noContact30Days",
      },
    },
    {
      id: "followUpToday",
      type: "stats",
      title: "Follow-up dzisiaj",
      order: 6,
      size: "small",
      props: {
        title: "Follow-up dzisiaj",
        value: stats.followUpToday,
        icon: Calendar,
        description: "Zaplanowane na dziś",
        href: "/clients?filter=followUpToday",
      },
    },
    // Upcoming tasks list
    {
      id: "upcomingTasks",
      type: "list",
      title: "Nadchodzące zadania",
      order: 7,
      size: "large",
      props: {
        title: "Nadchodzące zadania",
        description: "Zadania przypisane do Ciebie",
        icon: CheckSquare,
        items: upcomingTasks.map((task) => ({
          id: task.id,
          title: task.title,
          description: task.client ? getClientDisplayName(task.client) : undefined,
          href: `/tasks/${task.id}`,
          metadata: task.dueDate ? (
            <span className="text-xs">
              {new Date(task.dueDate).toLocaleDateString("pl-PL")}
            </span>
          ) : undefined,
        })),
        emptyState: {
          title: "Brak nadchodzących zadań",
          description: "Nie masz żadnych zadań przypisanych do Ciebie",
        },
        showViewAll: true,
        viewAllHref: "/tasks",
      },
    },
    ]

    // Add insurance widgets if available
    if (insuranceStats) {
      baseWidgets.push(
      {
        id: "insuranceCalculations",
        type: "stats",
        title: "Kalkulacje",
        order: 8,
        size: "small",
        props: {
          title: "Kalkulacje",
          value: insuranceStats.calculationsCount,
          icon: FileText,
          description: "Łączna liczba kalkulacji",
          href: "/insurance-agent/calculations",
        },
      },
      {
        id: "insurancePolicies",
        type: "stats",
        title: "Polisy",
        order: 9,
        size: "small",
        props: {
          title: "Polisy",
          value: insuranceStats.policiesCount,
          icon: Shield,
          description: "Wystawione polisy",
          href: "/insurance-agent/policies",
        },
      },
      {
        id: "insuranceVehicles",
        type: "stats",
        title: "Pojazdy",
        order: 10,
        size: "small",
        props: {
          title: "Pojazdy",
          value: insuranceStats.vehiclesCount,
          icon: Car,
          description: "Zarządzane pojazdy",
          href: "/insurance-agent/vehicles",
        },
      },
      {
        id: "insuranceAccepted",
        type: "stats",
        title: "Akceptacje",
        order: 11,
        size: "small",
        props: {
          title: "Akceptacje",
          value: insuranceStats.calculationsAccepted,
          icon: TrendingUp,
          description: "Zaakceptowane kalkulacje",
          href: "/insurance-agent/calculations?status=ACCEPTED",
        },
      },
      {
        id: "recentCalculations",
        type: "list",
        title: "Ostatnie kalkulacje",
        order: 12,
        size: "large",
        props: {
          title: "Ostatnie kalkulacje",
          description: "Najnowsze kalkulacje ubezpieczeniowe",
          icon: FileCheck,
          items: insuranceStats.recentCalculations.map((calc) => ({
            id: calc.id,
            title:
              calc.client?.type === "COMPANY"
                ? calc.client.companyName || "Brak nazwy"
                : `${calc.client?.firstName || ""} ${calc.client?.lastName || ""}`.trim() || "Brak nazwy",
            description: `Status: ${calc.status}${calc.vehicle ? ` | Pojazd: ${calc.vehicle.registrationNumber || calc.vehicle.vin || "Brak"}` : ""}`,
            href: `/insurance-agent/calculations/${calc.id}`,
            metadata: (
              <span className="text-xs">
                {new Date(calc.createdAt).toLocaleDateString("pl-PL")}
              </span>
            ),
          })),
          emptyState: {
            title: "Brak kalkulacji",
            description: "Nie masz jeszcze żadnych kalkulacji",
          },
          showViewAll: true,
          viewAllHref: "/insurance-agent/calculations",
        },
      },
      {
        id: "upcomingRenewals",
        type: "list",
        title: "Nadchodzące odnowienia",
        order: 13,
        size: "large",
        props: {
          title: "Nadchodzące odnowienia",
          description: "Polisy wymagające odnowienia w ciągu 30 dni",
          icon: Shield,
          items: insuranceStats.upcomingRenewals.map((policy) => ({
            id: policy.id,
            title:
              policy.client?.type === "COMPANY"
                ? policy.client.companyName || "Brak nazwy"
                : `${policy.client?.firstName || ""} ${policy.client?.lastName || ""}`.trim() || "Brak nazwy",
            description: `Polisa: ${policy.policyNumber}${policy.insuranceCompany ? ` | TU: ${policy.insuranceCompany.name}` : ""}`,
            href: `/insurance-agent/policies/${policy.id}`,
            metadata: (
              <span className="text-xs font-medium text-orange-600">
                Wygasa: {new Date(policy.validTo).toLocaleDateString("pl-PL")}
              </span>
            ),
          })),
          emptyState: {
            title: "Brak polis wymagających odnowienia",
            description: "Wszystkie polisy są aktualne",
          },
          showViewAll: true,
          viewAllHref: "/insurance-agent/policies",
        },
      }
      )
    }

    return baseWidgets
  }, [stats, upcomingTasks, insuranceStats, getClientDisplayName])

  const handleWidgetConfigSave = useCallback((config: Record<string, { enabled: boolean; order: number; size?: "small" | "large" }>) => {
    // Konfiguracja jest zapisywana w localStorage w dialogu
    // Tutaj możemy dodać dodatkową logikę jeśli potrzeba
  }, [])

  return (
    <>
      <div className="flex justify-end mb-4">
        <Button
          variant="outline"
          size="sm"
          onClick={() => setSettingsOpen(true)}
          className="gap-2"
        >
          <Settings2 className="h-4 w-4" />
          Konfiguruj widgety
        </Button>
      </div>
      <WidgetRegistry widgets={widgets} />
      <WidgetSettingsDialog
        open={settingsOpen}
        onOpenChange={setSettingsOpen}
        widgets={widgets}
        onSave={handleWidgetConfigSave}
      />
    </>
  )
})

