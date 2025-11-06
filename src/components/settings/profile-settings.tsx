"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { useSession } from "next-auth/react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { UserRole } from "@prisma/client"

interface ProfileSettingsProps {
  user: {
    id: string
    email: string
    name?: string | null
    image?: string | null
    role: UserRole
    position?: string | null
  }
}

export function ProfileSettings({ user }: ProfileSettingsProps) {
  const router = useRouter()
  const { update } = useSession()
  const [formData, setFormData] = useState({
    name: user.name || "",
    position: user.position || "",
  })
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState<string | null>(null)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)
    setSuccess(null)
    setIsLoading(true)

    try {
      const response = await fetch("/api/users/profile", {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          name: formData.name,
          position: formData.position,
        }),
      })

      const data = await response.json()

      if (!response.ok) {
        setError(data.error || "Wystąpił błąd podczas aktualizacji profilu")
        return
      }

      setSuccess("Profil został zaktualizowany pomyślnie")
      if (update) {
        await update()
      }
      router.refresh()
    } catch (error) {
      setError("Wystąpił błąd podczas aktualizacji profilu")
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Dane osobowe</CardTitle>
        <CardDescription>Zaktualizuj swoje dane osobowe</CardDescription>
      </CardHeader>
      <CardContent>
        {error && (
          <div className="mb-4 p-3 bg-destructive/10 text-destructive text-sm rounded-md">
            {error}
          </div>
        )}
        {success && (
          <div className="mb-4 p-3 bg-green-500/10 text-green-700 text-sm rounded-md">
            {success}
          </div>
        )}
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="name">Imię i nazwisko</Label>
            <Input
              id="name"
              type="text"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              disabled={isLoading}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="email">Email</Label>
            <Input
              id="email"
              type="email"
              value={user.email}
              disabled
              className="bg-gray-100"
            />
            <p className="text-xs text-muted-foreground">
              Email nie może być zmieniony
            </p>
          </div>
          <div className="space-y-2">
            <Label htmlFor="position">Stanowisko</Label>
            <Input
              id="position"
              type="text"
              placeholder="Specjalista ds. Sprzedaży"
              value={formData.position}
              onChange={(e) => setFormData({ ...formData, position: e.target.value })}
              disabled={isLoading}
            />
          </div>

          <Button type="submit" disabled={isLoading}>
            {isLoading ? "Zapisywanie..." : "Zapisz zmiany"}
          </Button>
        </form>
      </CardContent>
    </Card>
  )
}

