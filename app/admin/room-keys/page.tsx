"use client"

import { useEffect, useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { useToast } from "@/hooks/use-toast"
import { 
  KeyIcon, 
  SearchIcon, 
  SaveIcon, 
  HomeIcon, 
  CheckIcon,
  XIcon,
  ArrowLeftIcon
} from "lucide-react"
import Link from "next/link"

interface Registration {
  id: number
  family_last_name: string
  email: string
  lodging_type: string | null
  pre_assigned_keys: string[] | null
  room_keys: string[] | null
  checked_in: boolean | null
  family_member_count?: number
}

export default function RoomKeysPage() {
  const [registrations, setRegistrations] = useState<Registration[]>([])
  const [loading, setLoading] = useState(true)
  const [searchQuery, setSearchQuery] = useState("")
  const [editingId, setEditingId] = useState<number | null>(null)
  const [editKeys, setEditKeys] = useState<string[]>([])
  const [saving, setSaving] = useState(false)
  const { toast } = useToast()

  useEffect(() => {
    fetchRegistrations()
  }, [])

  const fetchRegistrations = async () => {
    try {
      const response = await fetch("/api/registrations?lodging=motel")
      if (response.ok) {
        const data = await response.json()
        // Filter to only motel registrations
        const motelRegs = data.filter((r: Registration) => 
          r.lodging_type?.toLowerCase().includes("motel")
        )
        setRegistrations(motelRegs)
      }
    } catch (error) {
      console.error("[v0] Error fetching registrations:", error)
      toast({
        title: "Error",
        description: "Failed to load registrations",
        variant: "destructive",
      })
    } finally {
      setLoading(false)
    }
  }

  const handleStartEdit = (reg: Registration) => {
    setEditingId(reg.id)
    setEditKeys(reg.pre_assigned_keys || [])
  }

  const handleCancelEdit = () => {
    setEditingId(null)
    setEditKeys([])
  }

  const handleSaveKeys = async (regId: number) => {
    setSaving(true)
    try {
      const response = await fetch(`/api/registrations/${regId}/pre-assigned-keys`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ pre_assigned_keys: editKeys.filter(k => k.trim()) }),
      })

      if (response.ok) {
        toast({
          title: "Success",
          description: "Room keys assigned successfully",
        })
        // Update local state
        setRegistrations(registrations.map(r => 
          r.id === regId 
            ? { ...r, pre_assigned_keys: editKeys.filter(k => k.trim()) }
            : r
        ))
        setEditingId(null)
        setEditKeys([])
      } else {
        const err = await response.json()
        throw new Error(err.error || "Failed to save keys")
      }
    } catch (error: any) {
      console.error("[v0] Error saving keys:", error)
      toast({
        title: "Error",
        description: error.message || "Failed to save room keys",
        variant: "destructive",
      })
    } finally {
      setSaving(false)
    }
  }

  const filteredRegistrations = registrations.filter(r =>
    r.family_last_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    r.email.toLowerCase().includes(searchQuery.toLowerCase())
  )

  // Stats
  const totalMotel = registrations.length
  const withKeys = registrations.filter(r => r.pre_assigned_keys && r.pre_assigned_keys.length > 0).length
  const checkedIn = registrations.filter(r => r.checked_in).length

  if (loading) {
    return (
      <div className="min-h-screen bg-muted/30 p-4 md:p-6">
        <div className="max-w-6xl mx-auto">
          <div className="flex items-center justify-center py-12">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" />
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-muted/30 p-4 md:p-6">
      <div className="max-w-6xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <div className="flex items-center gap-3 mb-1">
              <Link href="/admin">
                <Button variant="ghost" size="icon" className="size-8">
                  <ArrowLeftIcon className="size-4" />
                </Button>
              </Link>
              <h1 className="text-2xl font-bold tracking-tight">Room Key Assignment</h1>
            </div>
            <p className="text-sm text-muted-foreground ml-11">Pre-assign motel room keys before check-in</p>
          </div>
        </div>

        {/* Stats */}
        <div className="grid gap-4 md:grid-cols-3">
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium flex items-center gap-2">
                <HomeIcon className="size-4 text-blue-500" />
                Total Motel Registrations
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{totalMotel}</div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium flex items-center gap-2">
                <KeyIcon className="size-4 text-green-500" />
                Keys Assigned
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-green-600">{withKeys}</div>
              <p className="text-xs text-muted-foreground">{totalMotel - withKeys} remaining</p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium flex items-center gap-2">
                <CheckIcon className="size-4 text-purple-500" />
                Already Checked In
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-purple-600">{checkedIn}</div>
            </CardContent>
          </Card>
        </div>

        {/* Search */}
        <Card>
          <CardHeader>
            <CardTitle>Motel Registrations</CardTitle>
            <CardDescription>Assign room keys to families before they arrive</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-4 mb-6">
              <div className="relative flex-1">
                <SearchIcon className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-muted-foreground" />
                <Input
                  placeholder="Search by family name or email..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>

            {/* Registrations List */}
            <div className="space-y-3">
              {filteredRegistrations.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  {searchQuery ? "No matching registrations found" : "No motel registrations found"}
                </div>
              ) : (
                filteredRegistrations.map((reg) => (
                  <div 
                    key={reg.id} 
                    className={`p-4 rounded-lg border ${
                      reg.checked_in 
                        ? "bg-green-50 border-green-200" 
                        : reg.pre_assigned_keys && reg.pre_assigned_keys.length > 0
                          ? "bg-blue-50 border-blue-200"
                          : "bg-background"
                    }`}
                  >
                    <div className="flex items-start justify-between gap-4">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-1">
                          <h3 className="font-semibold">{reg.family_last_name} Family</h3>
                          <Badge variant="outline" className="text-xs">
                            {reg.lodging_type}
                          </Badge>
                          {reg.checked_in && (
                            <Badge variant="default" className="text-xs bg-green-600">
                              <CheckIcon className="size-3 mr-1" />
                              Checked In
                            </Badge>
                          )}
                        </div>
                        <p className="text-sm text-muted-foreground">{reg.email}</p>
                        {reg.family_member_count && (
                          <p className="text-xs text-muted-foreground mt-1">
                            {reg.family_member_count} family members
                          </p>
                        )}
                      </div>

                      {editingId === reg.id ? (
                        <div className="flex flex-col gap-2 min-w-[250px]">
                          <div className="space-y-2">
                            {editKeys.map((key, index) => (
                              <div key={index} className="flex gap-2">
                                <Input
                                  placeholder={`Room ${index + 1} key...`}
                                  value={key}
                                  onChange={(e) => {
                                    const newKeys = [...editKeys]
                                    newKeys[index] = e.target.value
                                    setEditKeys(newKeys)
                                  }}
                                  className="h-8"
                                />
                                {editKeys.length > 1 && (
                                  <Button
                                    variant="ghost"
                                    size="icon"
                                    className="size-8 shrink-0"
                                    onClick={() => setEditKeys(editKeys.filter((_, i) => i !== index))}
                                  >
                                    <XIcon className="size-3" />
                                  </Button>
                                )}
                              </div>
                            ))}
                            {editKeys.length === 0 && (
                              <Input
                                placeholder="Room key number..."
                                value=""
                                onChange={(e) => setEditKeys([e.target.value])}
                                className="h-8"
                              />
                            )}
                          </div>
                          <div className="flex gap-2">
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => setEditKeys([...editKeys, ""])}
                              className="flex-1"
                            >
                              + Add Key
                            </Button>
                          </div>
                          <div className="flex gap-2 pt-2 border-t">
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={handleCancelEdit}
                              className="flex-1"
                            >
                              Cancel
                            </Button>
                            <Button
                              size="sm"
                              onClick={() => handleSaveKeys(reg.id)}
                              disabled={saving}
                              className="flex-1"
                            >
                              <SaveIcon className="size-3 mr-1" />
                              {saving ? "Saving..." : "Save"}
                            </Button>
                          </div>
                        </div>
                      ) : (
                        <div className="flex items-center gap-3">
                          {reg.pre_assigned_keys && reg.pre_assigned_keys.length > 0 ? (
                            <div className="flex items-center gap-2">
                              <div className="text-right">
                                <p className="text-sm font-medium text-blue-700">
                                  Keys: {reg.pre_assigned_keys.join(", ")}
                                </p>
                              </div>
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => handleStartEdit(reg)}
                                disabled={reg.checked_in || false}
                              >
                                <KeyIcon className="size-3 mr-1" />
                                Edit
                              </Button>
                            </div>
                          ) : (
                            <Button
                              variant="default"
                              size="sm"
                              onClick={() => handleStartEdit(reg)}
                              disabled={reg.checked_in || false}
                            >
                              <KeyIcon className="size-3 mr-1" />
                              Assign Keys
                            </Button>
                          )}
                        </div>
                      )}
                    </div>
                  </div>
                ))
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
