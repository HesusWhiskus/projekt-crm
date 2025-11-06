"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Sparkles, X } from "lucide-react"
import { changelog, getLatestVersion, type ChangelogEntry } from "@/lib/changelog"

const STORAGE_KEY = "crm_last_seen_version"

export function WhatsNewButton() {
  const [isOpen, setIsOpen] = useState(false)
  const [hasNewVersion, setHasNewVersion] = useState(false)
  const latestVersion = getLatestVersion()

  useEffect(() => {
    // Check if user has seen the latest version
    const lastSeenVersion = localStorage.getItem(STORAGE_KEY)
    if (lastSeenVersion !== latestVersion) {
      setHasNewVersion(true)
    }
  }, [latestVersion])

  const handleOpen = () => {
    setIsOpen(true)
    // Mark current version as seen
    localStorage.setItem(STORAGE_KEY, latestVersion)
    setHasNewVersion(false)
  }

  const handleClose = () => {
    setIsOpen(false)
  }

  const getChangeTypeLabel = (type: string) => {
    const labels: Record<string, { text: string; color: string }> = {
      added: { text: "Dodano", color: "bg-green-100 text-green-800" },
      changed: { text: "Zmieniono", color: "bg-blue-100 text-blue-800" },
      fixed: { text: "Naprawiono", color: "bg-yellow-100 text-yellow-800" },
      security: { text: "Bezpieczeństwo", color: "bg-red-100 text-red-800" },
    }
    return labels[type] || { text: type, color: "bg-muted text-muted-foreground" }
  }

  return (
    <>
      <Button
        variant="ghost"
        size="sm"
        onClick={handleOpen}
        className="relative"
        title="Co nowego"
      >
        <Sparkles className="h-4 w-4 mr-2" />
        Co nowego
        {hasNewVersion && (
          <span className="absolute -top-1 -right-1 h-3 w-3 bg-red-500 rounded-full border-2 border-white"></span>
        )}
      </Button>

      {isOpen && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full max-h-[90vh] overflow-hidden flex flex-col">
            {/* Header */}
            <div className="flex items-center justify-between p-6 border-b">
              <div>
                <h2 className="text-2xl font-bold flex items-center gap-2">
                  <Sparkles className="h-6 w-6" />
                  Co nowego
                </h2>
                <p className="text-sm text-muted-foreground mt-1">
                  Wersja {latestVersion}
                </p>
              </div>
              <Button
                variant="ghost"
                size="icon"
                onClick={handleClose}
                className="h-8 w-8"
              >
                <X className="h-4 w-4" />
              </Button>
            </div>

            {/* Content */}
            <div className="overflow-y-auto flex-1 p-6">
              {changelog.map((entry: ChangelogEntry) => (
                <div key={entry.version} className="mb-8 last:mb-0">
                  <div className="flex items-center gap-3 mb-4">
                    <h3 className="text-lg font-semibold">v{entry.version}</h3>
                    <span className="text-sm text-muted-foreground">{entry.date}</span>
                  </div>
                  <div className="space-y-3">
                    {entry.changes.map((change, index) => {
                      const typeInfo = getChangeTypeLabel(change.type)
                      return (
                        <div
                          key={index}
                          className="flex items-start gap-3 p-3 rounded-lg border border-border"
                        >
                          <span
                            className={`px-2 py-1 rounded text-xs font-medium whitespace-nowrap ${typeInfo.color}`}
                          >
                            {typeInfo.text}
                          </span>
                          <p className="text-sm text-foreground flex-1">
                            {change.description}
                          </p>
                        </div>
                      )
                    })}
                  </div>
                </div>
              ))}
            </div>

            {/* Footer */}
            <div className="p-6 border-t bg-muted">
              <Button onClick={handleClose} className="w-full">
                Zamknij
              </Button>
            </div>
          </div>
        </div>
      )}
    </>
  )
}

