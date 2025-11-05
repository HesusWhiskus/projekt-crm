"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Select } from "@/components/ui/select"
import { X } from "lucide-react"

interface Group {
  id: string
  name: string
  description: string | null
  createdAt: Date
  users: Array<{
    user: {
      id: string
      email: string
      name: string | null
    }
  }>
}

interface GroupsListProps {
  groups: Group[]
  users: Array<{
    id: string
    email: string
    name: string | null
  }>
}

export function GroupsList({ groups: initialGroups, users }: GroupsListProps) {
  const router = useRouter()
  const [groups, setGroups] = useState(initialGroups)
  const [isCreating, setIsCreating] = useState(false)
  const [formData, setFormData] = useState({
    name: "",
    description: "",
  })
  const [addingUserToGroup, setAddingUserToGroup] = useState<string | null>(null)
  const [selectedUserId, setSelectedUserId] = useState("")

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsCreating(true)

    try {
      const response = await fetch("/api/admin/groups", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData),
      })

      if (!response.ok) {
        const data = await response.json()
        throw new Error(data.error || "Błąd podczas tworzenia grupy")
      }

      const result = await response.json()
      
      // Dodaj nową grupę na początku listy z pustą tablicą użytkowników
      const newGroup = {
        ...result.group,
        users: [],
      }
      setGroups([newGroup, ...groups])
      
      setFormData({ name: "", description: "" })
      router.refresh()
    } catch (error: any) {
      console.error(error)
      alert(error.message || "Wystąpił błąd podczas tworzenia grupy")
    } finally {
      setIsCreating(false)
    }
  }

  const handleAddUserToGroup = async (groupId: string) => {
    if (!selectedUserId) return

    try {
      const response = await fetch(`/api/admin/groups/${groupId}/users`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ userId: selectedUserId }),
      })

      if (!response.ok) {
        const data = await response.json()
        throw new Error(data.error || "Błąd podczas dodawania użytkownika")
      }

      // Zaktualizuj lokalny state - dodaj użytkownika do grupy
      const selectedUser = users.find((u) => u.id === selectedUserId)
      if (selectedUser) {
        setGroups(
          groups.map((group) =>
            group.id === groupId
              ? {
                  ...group,
                  users: [
                    ...group.users,
                    {
                      user: {
                        id: selectedUser.id,
                        email: selectedUser.email,
                        name: selectedUser.name,
                      },
                    },
                  ],
                }
              : group
          )
        )
      }

      setSelectedUserId("")
      setAddingUserToGroup(null)
      router.refresh()
    } catch (error: any) {
      console.error(error)
      alert(error.message || "Wystąpił błąd podczas dodawania użytkownika")
    }
  }

  const handleRemoveUserFromGroup = async (groupId: string, userId: string) => {
    if (!confirm("Czy na pewno chcesz usunąć tego użytkownika z grupy?")) {
      return
    }

    try {
      const response = await fetch(`/api/admin/groups/${groupId}/users/${userId}`, {
        method: "DELETE",
      })

      if (!response.ok) {
        const data = await response.json()
        throw new Error(data.error || "Błąd podczas usuwania użytkownika")
      }

      // Zaktualizuj lokalny state - usuń użytkownika z grupy
      setGroups(
        groups.map((group) =>
          group.id === groupId
            ? {
                ...group,
                users: group.users.filter((ug) => ug.user.id !== userId),
              }
            : group
        )
      )

      router.refresh()
    } catch (error: any) {
      console.error(error)
      alert(error.message || "Wystąpił błąd podczas usuwania użytkownika")
    }
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Utwórz nową grupę</CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleCreate} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="name">Nazwa grupy</Label>
              <Input
                id="name"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                required
                disabled={isCreating}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="description">Opis</Label>
              <Textarea
                id="description"
                value={formData.description}
                onChange={(e) =>
                  setFormData({ ...formData, description: e.target.value })
                }
                disabled={isCreating}
              />
            </div>
            <Button type="submit" disabled={isCreating}>
              {isCreating ? "Tworzenie..." : "Utwórz grupę"}
            </Button>
          </form>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Lista grup</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {groups.map((group) => (
              <div key={group.id} className="border rounded p-4">
                <div className="flex justify-between items-start">
                  <div className="flex-1">
                    <h3 className="font-semibold">{group.name}</h3>
                    {group.description && (
                      <p className="text-sm text-muted-foreground mt-1">
                        {group.description}
                      </p>
                    )}
                    <div className="mt-3">
                      <div className="flex items-center justify-between mb-2">
                        <p className="text-sm font-medium">
                          Członkowie ({group.users.length})
                        </p>
                        <Button
                          type="button"
                          variant="outline"
                          size="sm"
                          onClick={() => {
                            setAddingUserToGroup(addingUserToGroup === group.id ? null : group.id)
                            setSelectedUserId("")
                          }}
                        >
                          {addingUserToGroup === group.id ? "Anuluj" : "+ Dodaj użytkownika"}
                        </Button>
                      </div>
                      {addingUserToGroup === group.id && (
                        <div className="flex gap-2 mb-3">
                          <Select
                            value={selectedUserId}
                            onChange={(e) => setSelectedUserId(e.target.value)}
                            className="flex-1"
                          >
                            <option value="">Wybierz użytkownika</option>
                            {users
                              .filter(
                                (u) => !group.users.some((ug) => ug.user.id === u.id)
                              )
                              .map((user) => (
                                <option key={user.id} value={user.id}>
                                  {user.name || user.email}
                                </option>
                              ))}
                          </Select>
                          <Button
                            type="button"
                            onClick={() => handleAddUserToGroup(group.id)}
                            disabled={!selectedUserId}
                          >
                            Dodaj
                          </Button>
                        </div>
                      )}
                      {group.users.length > 0 ? (
                        <ul className="space-y-1">
                          {group.users.map((ug) => (
                            <li
                              key={ug.user.id}
                              className="flex items-center justify-between text-sm bg-gray-50 p-2 rounded"
                            >
                              <span>{ug.user.name || ug.user.email}</span>
                              <Button
                                type="button"
                                variant="ghost"
                                size="sm"
                                onClick={() => handleRemoveUserFromGroup(group.id, ug.user.id)}
                                className="h-6 w-6 p-0"
                              >
                                <X className="h-3 w-3" />
                              </Button>
                            </li>
                          ))}
                        </ul>
                      ) : (
                        <p className="text-sm text-muted-foreground">Brak członków</p>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  )
}

