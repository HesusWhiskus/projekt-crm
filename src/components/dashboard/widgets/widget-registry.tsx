"use client"

import { ReactNode } from "react"
import { ResponsiveGrid } from "@/components/ui/responsive-grid"
import { StatsWidget, StatsWidgetProps } from "./stats-widget"
import { ChartWidget, ChartWidgetProps } from "./chart-widget"
import { ListWidget, ListWidgetProps } from "./list-widget"

export type WidgetType = "stats" | "chart" | "list"

export interface BaseWidgetConfig {
  id: string
  type: WidgetType
  title: string
  enabled?: boolean
  order?: number
  gridCols?: {
    mobile?: number
    tablet?: number
    desktop?: number
    wide?: number
  }
}

export interface StatsWidgetConfig extends BaseWidgetConfig {
  type: "stats"
  props: StatsWidgetProps
}

export interface ChartWidgetConfig extends BaseWidgetConfig {
  type: "chart"
  props: ChartWidgetProps
}

export interface ListWidgetConfig extends BaseWidgetConfig {
  type: "list"
  props: ListWidgetProps
}

export type WidgetConfig = StatsWidgetConfig | ChartWidgetConfig | ListWidgetConfig

export interface WidgetRegistryProps {
  widgets: WidgetConfig[]
  onWidgetUpdate?: (widgetId: string, updates: Partial<WidgetConfig>) => void
}

const widgetComponents = {
  stats: StatsWidget,
  chart: ChartWidget,
  list: ListWidget,
}

export function WidgetRegistry({ widgets, onWidgetUpdate }: WidgetRegistryProps) {
  const enabledWidgets = widgets
    .filter((widget) => widget.enabled !== false)
    .sort((a, b) => (a.order || 0) - (b.order || 0))

  if (enabledWidgets.length === 0) {
    return null
  }

  return (
    <ResponsiveGrid
      columns={{
        mobile: 1,
        tablet: 2,
        desktop: 3,
        wide: 4,
      }}
      gap="md"
    >
      {enabledWidgets.map((widget) => {
        if (widget.type === "stats") {
          const Component = widgetComponents.stats
          return (
            <div
              key={widget.id}
              className={`
                ${widget.gridCols?.mobile === 2 ? "col-span-2" : ""}
                ${widget.gridCols?.tablet === 2 ? "md:col-span-2" : ""}
                ${widget.gridCols?.desktop === 2 ? "lg:col-span-2" : ""}
                ${widget.gridCols?.wide === 2 ? "xl:col-span-2" : ""}
              `}
            >
              <Component {...(widget as StatsWidgetConfig).props} />
            </div>
          )
        }
        if (widget.type === "chart") {
          const Component = widgetComponents.chart
          return (
            <div
              key={widget.id}
              className={`
                ${widget.gridCols?.mobile === 2 ? "col-span-2" : ""}
                ${widget.gridCols?.tablet === 2 ? "md:col-span-2" : ""}
                ${widget.gridCols?.desktop === 2 ? "lg:col-span-2" : ""}
                ${widget.gridCols?.wide === 2 ? "xl:col-span-2" : ""}
              `}
            >
              <Component {...(widget as ChartWidgetConfig).props} />
            </div>
          )
        }
        if (widget.type === "list") {
          const Component = widgetComponents.list
          return (
            <div
              key={widget.id}
              className={`
                ${widget.gridCols?.mobile === 2 ? "col-span-2" : ""}
                ${widget.gridCols?.tablet === 2 ? "md:col-span-2" : ""}
                ${widget.gridCols?.desktop === 2 ? "lg:col-span-2" : ""}
                ${widget.gridCols?.wide === 2 ? "xl:col-span-2" : ""}
              `}
            >
              <Component {...(widget as ListWidgetConfig).props} />
            </div>
          )
        }
        return null
      })}
    </ResponsiveGrid>
  )
}

