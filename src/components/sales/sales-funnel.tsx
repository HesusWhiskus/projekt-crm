"use client"

import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { cn } from "@/lib/utils"
import { ClientStatus } from "@prisma/client"
import { clientStatusLabels } from "@/lib/status-config"

interface SalesFunnelProps {
  data: Array<{
    status: ClientStatus
    count: number
    percentage: number
  }>
  total: number
  className?: string
}

const funnelStages: ClientStatus[] = [
  "NEW_LEAD",
  "IN_CONTACT",
  "DEMO_SENT",
  "NEGOTIATION",
  "ACTIVE_CLIENT",
]

export function SalesFunnel({ data, total, className }: SalesFunnelProps) {
  const maxCount = Math.max(...data.map((d) => d.count), 1)

  return (
    <Card className={cn("w-full", className)}>
      <CardHeader>
        <CardTitle>Lejek sprzedażowy</CardTitle>
        <CardDescription>
          {total} klientów w procesie sprzedażowym
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {funnelStages.map((stage, index) => {
            const stageData = data.find((d) => d.status === stage)
            const count = stageData?.count || 0
            const percentage = stageData?.percentage || 0
            const width = maxCount > 0 ? (count / maxCount) * 100 : 0

            return (
              <div key={stage} className="space-y-2">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-medium">
                      {clientStatusLabels[stage]}
                    </span>
                    <span className="text-xs text-muted-foreground">
                      ({count})
                    </span>
                  </div>
                  <span className="text-sm font-semibold">{percentage.toFixed(1)}%</span>
                </div>
                <div className="relative h-8 bg-muted rounded-md overflow-hidden">
                  <div
                    className={cn(
                      "h-full transition-all duration-500 flex items-center justify-end pr-2",
                      index === 0 && "bg-blue-500",
                      index === 1 && "bg-yellow-500",
                      index === 2 && "bg-purple-500",
                      index === 3 && "bg-orange-500",
                      index === 4 && "bg-green-500"
                    )}
                    style={{ width: `${width}%` }}
                  >
                    {count > 0 && (
                      <span className="text-xs font-medium text-white">
                        {count}
                      </span>
                    )}
                  </div>
                </div>
              </div>
            )
          })}
        </div>
      </CardContent>
    </Card>
  )
}

