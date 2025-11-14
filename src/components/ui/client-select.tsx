"use client"

import * as React from "react"
import { Check, ChevronsUpDown } from "lucide-react"
import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command"
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover"

interface Client {
  id: string
  firstName: string | null
  lastName: string | null
  companyName: string | null
  type: "PERSON" | "COMPANY"
  email: string | null
}

interface SearchableClientSelectProps {
  value?: string
  onValueChange: (value: string) => void
  placeholder?: string
  disabled?: boolean
  required?: boolean
  className?: string
}

export function SearchableClientSelect({
  value,
  onValueChange,
  placeholder = "Wyszukaj klienta...",
  disabled = false,
  required = false,
  className,
}: SearchableClientSelectProps) {
  const [open, setOpen] = React.useState(false)
  const [searchQuery, setSearchQuery] = React.useState("")
  const [clients, setClients] = React.useState<Client[]>([])
  const [isLoading, setIsLoading] = React.useState(false)
  const [selectedClient, setSelectedClient] = React.useState<Client | null>(null)

  // Debounce search query
  React.useEffect(() => {
    if (searchQuery.length < 2) {
      setClients([])
      return
    }

    const timeoutId = setTimeout(() => {
      searchClients(searchQuery)
    }, 300)

    return () => clearTimeout(timeoutId)
  }, [searchQuery])

  // Load selected client when value changes (for edit mode)
  React.useEffect(() => {
    if (value && !selectedClient && value.length > 10) {
      // Fetch client by searching for it - this is a workaround
      // Ideally we'd have a separate endpoint to fetch by ID
      const fetchClientById = async () => {
        try {
          // Try to find in current clients first
          const foundInList = clients.find((c) => c.id === value)
          if (foundInList) {
            setSelectedClient(foundInList)
            return
          }

          // If not found, we can't easily fetch by ID with current API
          // The component will show the placeholder until user searches
        } catch (error) {
          console.error("Error fetching client:", error)
        }
      }
      fetchClientById()
    }
  }, [value, selectedClient, clients])

  const searchClients = async (query: string) => {
    if (query.length < 2) {
      setClients([])
      return
    }

    setIsLoading(true)
    try {
      const response = await fetch(`/api/clients/search?q=${encodeURIComponent(query)}`)
      if (!response.ok) {
        throw new Error("Błąd podczas wyszukiwania")
      }
      const data = await response.json()
      setClients(data.clients || [])
    } catch (error) {
      console.error("Error searching clients:", error)
      setClients([])
    } finally {
      setIsLoading(false)
    }
  }

  const handleSelect = (client: Client) => {
    setSelectedClient(client)
    onValueChange(client.id)
    setOpen(false)
    setSearchQuery("")
  }

  const displayValue = selectedClient
    ? selectedClient.type === "COMPANY"
      ? selectedClient.companyName || "Brak nazwy firmy"
      : `${selectedClient.firstName || ""} ${selectedClient.lastName || ""}`.trim() || "Brak nazwy"
    : placeholder

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          role="combobox"
          aria-expanded={open}
          className={cn(
            "w-full justify-between",
            !selectedClient && "text-muted-foreground",
            className
          )}
          disabled={disabled}
        >
          {displayValue}
          <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-full p-0" align="start">
        <Command>
          <CommandInput
            placeholder="Wpisz minimum 2 znaki..."
            value={searchQuery}
            onValueChange={setSearchQuery}
          />
          <CommandList>
            <CommandEmpty>
              {isLoading ? (
                "Wyszukiwanie..."
              ) : searchQuery.length < 2 ? (
                "Wpisz minimum 2 znaki, aby wyszukać"
              ) : (
                "Nie znaleziono klientów"
              )}
            </CommandEmpty>
            <CommandGroup>
              {clients.map((client) => {
                const clientName =
                  client.type === "COMPANY"
                    ? client.companyName || "Brak nazwy firmy"
                    : `${client.firstName || ""} ${client.lastName || ""}`.trim() || "Brak nazwy"

                return (
                  <CommandItem
                    key={client.id}
                    value={client.id}
                    onSelect={() => handleSelect(client)}
                  >
                    <Check
                      className={cn(
                        "mr-2 h-4 w-4",
                        value === client.id ? "opacity-100" : "opacity-0"
                      )}
                    />
                    <div className="flex flex-col">
                      <span>{clientName}</span>
                      {client.email && (
                        <span className="text-xs text-muted-foreground">
                          {client.email}
                        </span>
                      )}
                    </div>
                  </CommandItem>
                )
              })}
            </CommandGroup>
          </CommandList>
        </Command>
      </PopoverContent>
    </Popover>
  )
}

