"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select } from "@/components/ui/select"
import { UserRole } from "@prisma/client"
import { Edit, X } from "lucide-react"
import { useRouter } from "next/navigation"

interface User {
  id: string
  email: string
  name: string | null
  role: UserRole
  position: string | null
  organizationId: string | null
  organization: {
    id: string
    name: string
  } | null
  createdAt: Date
  groups: Array<{
    group: {
      id: string
      name: string
    }
  }>
}

interface Organization {
  id: string
  name: string
}

interface UsersListProps {
  users: User[]
}

export function UsersList({ users }: UsersListProps) {
  const router = useRouter()
  const [isLoading, setIsLoading] = useState(false)
  const [editingUser, setEditingUser] = useState<User | null>(null)
  const [organizations, setOrganizations] = useState<Organization[]>([])
  const [editFormData, setEditFormData] = useState({
    name: "",
    position: "",
    organizationId: "",
  })

  // Fetch organizations on mount
  useEffect(() => {
    fetch("/api/admin/organizations")
      .then((res) => res.json())
      .then((data) => {
        if (data.organizations) {
          setOrganizations(data.organizations)
        }
      })
      .catch((err) => {
        console.error("Error fetching organizations:", err)
      })
  }, [])

  const handleRoleChange = async (userId: string, newRole: UserRole) => {
    setIsLoading(true)
    try {
      const response = await fetch(`/api/admin/users/${userId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ role: newRole }),
      })

      if (!response.ok) {
        throw new Error("Błąd podczas aktualizacji roli")
      }

      router.refresh()
    } catch (error) {
      console.error(error)
      alert("Wystąpił błąd podczas aktualizacji roli")
    } finally {
      setIsLoading(false)
    }
  }

  const handleEditClick = (user: User) => {
    setEditingUser(user)
    setEditFormData({
      name: user.name || "",
      position: user.position || "",
      organizationId: user.organizationId || "",
    })
  }

  const handleEditSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!editingUser) return

    setIsLoading(true)
    try {
      const response = await fetch(`/api/admin/users/${editingUser.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: editFormData.name || null,
          position: editFormData.position || null,
          organizationId: editFormData.organizationId || null,
        }),
      })

      if (!response.ok) {
        throw new Error("Błąd podczas aktualizacji użytkownika")
      }

      setEditingUser(null)
      router.refresh()
    } catch (error) {
      console.error(error)
      alert("Wystąpił błąd podczas aktualizacji użytkownika")
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <>
      <Card>
        <CardHeader>
          <CardTitle>Lista użytkowników</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b">
                  <th className="text-left p-2">Email</th>
                  <th className="text-left p-2">Imię i nazwisko</th>
                  <th className="text-left p-2">Stanowisko</th>
                  <th className="text-left p-2">Rola</th>
                  <th className="text-left p-2">Organizacja</th>
                  <th className="text-left p-2">Grupy</th>
                  <th className="text-left p-2">Akcje</th>
                </tr>
              </thead>
              <tbody>
                {users.map((user) => (
                  <tr key={user.id} className="border-b">
                    <td className="p-2">{user.email}</td>
                    <td className="p-2">{user.name || "-"}</td>
                    <td className="p-2">{user.position || "-"}</td>
                    <td className="p-2">
                      <select
                        value={user.role}
                        onChange={(e) =>
                          handleRoleChange(user.id, e.target.value as UserRole)
                        }
                        disabled={isLoading}
                        className="border rounded px-2 py-1"
                      >
                        <option value="USER">Użytkownik</option>
                        <option value="ADMIN">Administrator</option>
                      </select>
                    </td>
                    <td className="p-2">{user.organization?.name || "-"}</td>
                    <td className="p-2">
                      {user.groups.length > 0
                        ? user.groups.map((ug) => ug.group.name).join(", ")
                        : "-"}
                    </td>
                    <td className="p-2">
                      <div className="flex space-x-2">
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => handleEditClick(user)}
                          disabled={isLoading}
                          title="Edytuj użytkownika"
                        >
                          <Edit className="h-4 w-4" />
                        </Button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>

      {/* Edit User Dialog */}
      {editingUser && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <Card className="w-full max-w-md m-4">
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle>Edytuj użytkownika</CardTitle>
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => setEditingUser(null)}
                  disabled={isLoading}
                >
                  <X className="h-4 w-4" />
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleEditSubmit} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="edit-email">Email</Label>
                  <Input
                    id="edit-email"
                    type="email"
                    value={editingUser.email}
                    disabled
                    className="bg-gray-100"
                  />
                  <p className="text-xs text-muted-foreground">
                    Email nie może być zmieniony
                  </p>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="edit-name">Imię i nazwisko</Label>
                  <Input
                    id="edit-name"
                    type="text"
                    value={editFormData.name}
                    onChange={(e) =>
                      setEditFormData({ ...editFormData, name: e.target.value })
                    }
                    disabled={isLoading}
                    placeholder="Jan Kowalski"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="edit-position">Stanowisko</Label>
                  <Input
                    id="edit-position"
                    type="text"
                    value={editFormData.position}
                    onChange={(e) =>
                      setEditFormData({
                        ...editFormData,
                        position: e.target.value,
                      })
                    }
                    disabled={isLoading}
                    placeholder="Specjalista ds. Sprzedaży"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="edit-organization">Organizacja</Label>
                  <Select
                    id="edit-organization"
                    value={editFormData.organizationId}
                    onChange={(e) =>
                      setEditFormData({
                        ...editFormData,
                        organizationId: e.target.value,
                      })
                    }
                    disabled={isLoading}
                  >
                    <option value="">Brak organizacji</option>
                    {organizations.map((org) => (
                      <option key={org.id} value={org.id}>
                        {org.name}
                      </option>
                    ))}
                  </Select>
                </div>
                <div className="flex justify-end space-x-2 pt-4">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => setEditingUser(null)}
                    disabled={isLoading}
                  >
                    Anuluj
                  </Button>
                  <Button type="submit" disabled={isLoading}>
                    {isLoading ? "Zapisywanie..." : "Zapisz"}
                  </Button>
                </div>
              </form>
            </CardContent>
          </Card>
        </div>
      )}
    </>
  )
}

