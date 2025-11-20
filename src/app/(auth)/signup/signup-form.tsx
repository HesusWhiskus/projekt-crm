"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { CardContent } from "@/components/ui/card"

interface Organization {
  id: string
  name: string
  plan: string
}

export default function SignUpForm() {
  const router = useRouter()
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    password: "",
    confirmPassword: "",
    position: "",
    organizationId: "",
  })
  const [organizations, setOrganizations] = useState<Organization[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    // Pobierz listę organizacji przy mount
    fetch("/api/organizations")
      .then((res) => res.json())
      .then((data) => {
        if (data.organizations) {
          setOrganizations(data.organizations)
        }
      })
      .catch((err) => {
        console.error("Error fetching organizations:", err)
        // Nie pokazuj błędu użytkownikowi - organizacja jest opcjonalna
      })
  }, [])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)

    if (formData.password !== formData.confirmPassword) {
      setError("Hasła nie są identyczne")
      return
    }

    if (formData.password.length < 8) {
      setError("Hasło musi mieć co najmniej 8 znaków")
      return
    }

    setIsLoading(true)

    try {
      const response = await fetch("/api/auth/register", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          name: formData.name,
          email: formData.email,
          password: formData.password,
          position: formData.position,
          organizationId: formData.organizationId || undefined,
        }),
      })

      const data = await response.json()

      if (!response.ok) {
        setError(data.error || "Wystąpił błąd podczas rejestracji")
        return
      }

      router.push("/signin?registered=true")
    } catch (error) {
      setError("Wystąpił błąd podczas rejestracji")
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <CardContent>
      {error && (
        <div className="mb-4 p-3 bg-destructive/10 text-destructive text-sm rounded-md">
          {error}
        </div>
      )}
      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="space-y-2">
          <Label htmlFor="name">Imię i nazwisko</Label>
          <Input
            id="name"
            type="text"
            placeholder="Jan Kowalski"
            value={formData.name}
            onChange={(e) => setFormData({ ...formData, name: e.target.value })}
            required
            disabled={isLoading}
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="email">Email</Label>
          <Input
            id="email"
            type="email"
            placeholder="twoj@email.com"
            value={formData.email}
            onChange={(e) => setFormData({ ...formData, email: e.target.value })}
            required
            disabled={isLoading}
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="position">Stanowisko (opcjonalnie)</Label>
          <Input
            id="position"
            type="text"
            placeholder="Specjalista ds. Sprzedaży"
            value={formData.position}
            onChange={(e) => setFormData({ ...formData, position: e.target.value })}
            disabled={isLoading}
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="organizationId">Organizacja (opcjonalnie)</Label>
          <Select
            value={formData.organizationId || ""}
            onValueChange={(value) => setFormData({ ...formData, organizationId: value || "" })}
            disabled={isLoading || organizations.length === 0}
          >
            <SelectTrigger id="organizationId">
              <SelectValue placeholder={organizations.length === 0 ? "Brak dostępnych organizacji" : "Brak organizacji"} />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="">{organizations.length === 0 ? "Brak dostępnych organizacji" : "Brak organizacji"}</SelectItem>
              {organizations.map((org) => (
                <SelectItem key={org.id} value={org.id}>
                  {org.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          {organizations.length === 0 && (
            <p className="text-xs text-muted-foreground">
              Brak dostępnych organizacji. Możesz zarejestrować się bez organizacji.
            </p>
          )}
        </div>
        <div className="space-y-2">
          <Label htmlFor="password">Hasło</Label>
          <Input
            id="password"
            type="password"
            value={formData.password}
            onChange={(e) => setFormData({ ...formData, password: e.target.value })}
            required
            disabled={isLoading}
            minLength={8}
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="confirmPassword">Potwierdź hasło</Label>
          <Input
            id="confirmPassword"
            type="password"
            value={formData.confirmPassword}
            onChange={(e) => setFormData({ ...formData, confirmPassword: e.target.value })}
            required
            disabled={isLoading}
            minLength={8}
          />
        </div>
        <Button type="submit" className="w-full" disabled={isLoading}>
          {isLoading ? "Rejestrowanie..." : "Zarejestruj się"}
        </Button>
      </form>

      <div className="mt-4 text-center text-sm">
        <a href="/signin" className="text-primary hover:underline">
          Masz już konto? Zaloguj się
        </a>
      </div>
    </CardContent>
  )
}

