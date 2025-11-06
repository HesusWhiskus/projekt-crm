"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"

export function SecuritySettings() {
  const router = useRouter()
  const [formData, setFormData] = useState({
    currentPassword: "",
    newPassword: "",
    confirmPassword: "",
  })
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState<string | null>(null)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)
    setSuccess(null)

    if (formData.newPassword.length < 8) {
      setError("Nowe hasło musi mieć co najmniej 8 znaków")
      return
    }

    if (formData.newPassword !== formData.confirmPassword) {
      setError("Nowe hasła nie są identyczne")
      return
    }

    if (!formData.currentPassword) {
      setError("Podaj obecne hasło")
      return
    }

    setIsLoading(true)

    try {
      const response = await fetch("/api/users/profile", {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          currentPassword: formData.currentPassword,
          newPassword: formData.newPassword,
        }),
      })

      const data = await response.json()

      if (!response.ok) {
        setError(data.error || "Wystąpił błąd podczas zmiany hasła")
        return
      }

      setSuccess("Hasło zostało zmienione pomyślnie")
      setFormData({
        currentPassword: "",
        newPassword: "",
        confirmPassword: "",
      })
      router.refresh()
    } catch (error) {
      setError("Wystąpił błąd podczas zmiany hasła")
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Zmiana hasła</CardTitle>
        <CardDescription>Zaktualizuj swoje hasło do konta</CardDescription>
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
            <Label htmlFor="currentPassword">Obecne hasło</Label>
            <Input
              id="currentPassword"
              type="password"
              value={formData.currentPassword}
              onChange={(e) =>
                setFormData({ ...formData, currentPassword: e.target.value })
              }
              disabled={isLoading}
              required
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="newPassword">Nowe hasło</Label>
            <Input
              id="newPassword"
              type="password"
              value={formData.newPassword}
              onChange={(e) =>
                setFormData({ ...formData, newPassword: e.target.value })
              }
              disabled={isLoading}
              minLength={8}
              required
            />
            <p className="text-xs text-muted-foreground">
              Hasło musi mieć co najmniej 8 znaków
            </p>
          </div>
          <div className="space-y-2">
            <Label htmlFor="confirmPassword">Potwierdź nowe hasło</Label>
            <Input
              id="confirmPassword"
              type="password"
              value={formData.confirmPassword}
              onChange={(e) =>
                setFormData({ ...formData, confirmPassword: e.target.value })
              }
              disabled={isLoading}
              minLength={8}
              required
            />
          </div>

          <Button type="submit" disabled={isLoading}>
            {isLoading ? "Zapisywanie..." : "Zmień hasło"}
          </Button>
        </form>
      </CardContent>
    </Card>
  )
}

