"use client"

import { useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { UserRole } from "@prisma/client"
import { Edit, Trash2 } from "lucide-react"

interface User {
  id: string
  email: string
  name: string | null
  role: UserRole
  position: string | null
  createdAt: Date
  groups: Array<{
    group: {
      id: string
      name: string
    }
  }>
}

interface UsersListProps {
  users: User[]
}

export function UsersList({ users }: UsersListProps) {
  const [isLoading, setIsLoading] = useState(false)

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

      window.location.reload()
    } catch (error) {
      console.error(error)
      alert("Wystąpił błąd podczas aktualizacji roli")
    } finally {
      setIsLoading(false)
    }
  }

  return (
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
                  <td className="p-2">
                    {user.groups.length > 0
                      ? user.groups.map((ug) => ug.group.name).join(", ")
                      : "-"}
                  </td>
                  <td className="p-2">
                    <div className="flex space-x-2">
                      <Button variant="ghost" size="icon">
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
  )
}

