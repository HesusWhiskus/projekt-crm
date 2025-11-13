"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select } from "@/components/ui/select"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { FileEdit, Plus, X } from "lucide-react"
import { Checkbox } from "@/components/ui/checkbox"

interface CustomFieldFormProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  onSuccess: () => void
}

const fieldTypes = [
  { value: "TEXT", label: "Tekst" },
  { value: "NUMBER", label: "Liczba" },
  { value: "DATE", label: "Data" },
  { value: "SELECT", label: "Lista wyboru" },
]

export function CustomFieldForm({ open, onOpenChange, onSuccess }: CustomFieldFormProps) {
  const [name, setName] = useState("")
  const [type, setType] = useState<"TEXT" | "NUMBER" | "DATE" | "SELECT">("TEXT")
  const [required, setRequired] = useState(false)
  const [options, setOptions] = useState<string[]>([])
  const [newOption, setNewOption] = useState("")
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const handleAddOption = () => {
    if (newOption.trim() && !options.includes(newOption.trim())) {
      setOptions([...options, newOption.trim()])
      setNewOption("")
    }
  }

  const handleRemoveOption = (index: number) => {
    setOptions(options.filter((_, i) => i !== index))
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)
    setError(null)

    if (type === "SELECT" && options.length === 0) {
      setError("Dodaj przynajmniej jedną opcję dla listy wyboru")
      setIsLoading(false)
      return
    }

    try {
      const response = await fetch("/api/settings/custom-fields", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name,
          type,
          required,
          options: type === "SELECT" ? options : undefined,
        }),
      })

      if (!response.ok) {
        const data = await response.json()
        throw new Error(data.error || "Nie udało się utworzyć pola")
      }

      setName("")
      setType("TEXT")
      setRequired(false)
      setOptions([])
      onSuccess()
      onOpenChange(false)
    } catch (err: any) {
      setError(err.message || "Wystąpił błąd")
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <FileEdit className="h-5 w-5" />
            Utwórz niestandardowe pole
          </DialogTitle>
          <DialogDescription>
            Dodaj niestandardowe pole do formularza klienta
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit}>
          <div className="space-y-4 py-4">
            {error && (
              <div className="p-3 bg-destructive/10 text-destructive text-sm rounded-md">
                {error}
              </div>
            )}
            <div className="space-y-2">
              <Label htmlFor="name">Nazwa pola *</Label>
              <Input
                id="name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="np. Numer konta, Branża, Źródło"
                required
                disabled={isLoading}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="type">Typ pola *</Label>
              <Select
                id="type"
                value={type}
                onChange={(e) => {
                  setType(e.target.value as "TEXT" | "NUMBER" | "DATE" | "SELECT")
                  if (e.target.value !== "SELECT") {
                    setOptions([])
                  }
                }}
                disabled={isLoading}
              >
                {fieldTypes.map((ft) => (
                  <option key={ft.value} value={ft.value}>
                    {ft.label}
                  </option>
                ))}
              </Select>
            </div>
            {type === "SELECT" && (
              <div className="space-y-2">
                <Label>Opcje *</Label>
                <div className="space-y-2 border rounded-md p-4">
                  {options.map((option, index) => (
                    <div key={index} className="flex items-center gap-2">
                      <Input value={option} disabled />
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        onClick={() => handleRemoveOption(index)}
                        disabled={isLoading}
                      >
                        <X className="h-4 w-4" />
                      </Button>
                    </div>
                  ))}
                  <div className="flex items-center gap-2">
                    <Input
                      value={newOption}
                      onChange={(e) => setNewOption(e.target.value)}
                      placeholder="Dodaj opcję"
                      onKeyDown={(e) => {
                        if (e.key === "Enter") {
                          e.preventDefault()
                          handleAddOption()
                        }
                      }}
                      disabled={isLoading}
                    />
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={handleAddOption}
                      disabled={isLoading || !newOption.trim()}
                    >
                      <Plus className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
                <p className="text-xs text-muted-foreground">
                  Dodaj opcje dla listy wyboru
                </p>
              </div>
            )}
            <div className="flex items-center space-x-2">
              <Checkbox
                id="required"
                checked={required}
                onCheckedChange={(checked) => setRequired(checked === true)}
                disabled={isLoading}
              />
              <Label htmlFor="required" className="text-sm font-normal cursor-pointer">
                Pole wymagane
              </Label>
            </div>
          </div>
          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
              disabled={isLoading}
            >
              Anuluj
            </Button>
            <Button type="submit" disabled={isLoading || !name.trim()}>
              {isLoading ? "Tworzenie..." : "Utwórz pole"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}

