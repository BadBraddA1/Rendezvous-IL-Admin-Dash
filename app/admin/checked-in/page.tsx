"use client"

import useSWR from "swr"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { CheckIcon, KeyIcon, ClockIcon, HomeIcon, AlertCircleIcon, UserIcon, Undo2Icon } from "lucide-react"
import { useToast } from "@/hooks/use-toast"
import Link from "next/link"

const BASE_URL = process.env.NEXT_PUBLIC_BASE_URL ?? ""

const fetcher = (url: string) => fetch(url).then((r) => r.json())

interface CheckedInRegistration {
  id: number
  family_last_name: string
  email: string
  lodging_type: string | null
  room_keys: string[] | null
  checked_in: boolean
  checked_in_at: string | null
  keys_returned: boolean | null
  keys_returned_at: string | null
  payment_status: string | null
  family_member_count: number
}

export default function CheckedInPage() {
  const { toast } = useToast()
  const { data, isLoading, mutate } = useSWR<CheckedInRegistration[]>(
    `${BASE_URL}/api/registrations/checked-in`,
    fetcher,
    { refreshInterval: 30000 }
  )
  const registrations = Array.isArray(data) ? data : []
  const loading = isLoading

  const handleUndoCheckIn = async (id: number, familyName: string) => {
    if (!confirm(`Undo check-in for the ${familyName} family? This will clear their check-in time and any room keys assigned.`)) {
      return
    }
    try {
      const response = await fetch(`${BASE_URL}/api/registrations/${id}/checkin`, {
        method: "DELETE",
      })
      if (response.ok) {
        toast({
          title: "Check-in undone",
          description: `${familyName} family has been moved back to not checked in.`,
        })
        mutate()
      } else {
        const data = await response.json().catch(() => ({}))
        toast({
          title: "Error",
          description: data.error || "Failed to undo check-in",
          variant: "destructive",
        })
      }
    } catch (error) {
      console.error("Error undoing check-in:", error)
      toast({
        title: "Error",
        description: "Failed to undo check-in",
        variant: "destructive",
      })
    }
  }

  const handleMarkKeysReturned = async (id: number, returned: boolean) => {
    try {
      const response = await fetch(`${BASE_URL}/api/registrations/${id}/keys-returned`, {
        method: returned ? "DELETE" : "POST",
      })

      if (response.ok) {
        toast({
          title: "Success",
          description: returned ? "Keys marked as not returned" : "Keys marked as returned",
        })
        mutate()
      }
    } catch (error) {
      console.error("Error updating keys status:", error)
      toast({
        title: "Error",
        description: "Failed to update keys status",
        variant: "destructive",
      })
    }
  }

  const formatTime = (dateString: string | null) => {
    if (!dateString) return "-"
    const date = new Date(dateString)
    return date.toLocaleString("en-US", {
      month: "short",
      day: "numeric",
      hour: "numeric",
      minute: "2-digit",
      hour12: true,
    })
  }

  const motelRegistrations = registrations.filter(r => 
    r.lodging_type?.toLowerCase().includes("motel") && r.room_keys && r.room_keys.length > 0
  )

  const keysOutstanding = motelRegistrations.filter(r => !r.keys_returned).length
  const keysReturned = motelRegistrations.filter(r => r.keys_returned).length

  if (loading) {
    return (
      <div className="min-h-screen bg-muted/30 p-6">
        <div className="max-w-7xl mx-auto">
          <div className="flex items-center justify-center h-64">
            <div className="size-8 animate-spin rounded-full border-4 border-primary border-t-transparent" />
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-muted/30 p-6">
      <div className="max-w-7xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Checked-In Families</h1>
            <p className="text-muted-foreground mt-1">
              {registrations.length} families checked in
            </p>
          </div>
          <div className="flex gap-2">
            <Link href="/admin/checkin">
              <Button variant="outline">QR Check-In</Button>
            </Link>
            <Link href="/admin">
              <Button variant="outline">Dashboard</Button>
            </Link>
          </div>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-green-500/10 rounded-lg">
                  <CheckIcon className="size-5 text-green-600" />
                </div>
                <div>
                  <p className="text-2xl font-bold">{registrations.length}</p>
                  <p className="text-sm text-muted-foreground">Checked In</p>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-blue-500/10 rounded-lg">
                  <HomeIcon className="size-5 text-blue-600" />
                </div>
                <div>
                  <p className="text-2xl font-bold">{motelRegistrations.length}</p>
                  <p className="text-sm text-muted-foreground">Motel Rooms</p>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-amber-500/10 rounded-lg">
                  <KeyIcon className="size-5 text-amber-600" />
                </div>
                <div>
                  <p className="text-2xl font-bold">{keysOutstanding}</p>
                  <p className="text-sm text-muted-foreground">Keys Outstanding</p>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-green-500/10 rounded-lg">
                  <CheckIcon className="size-5 text-green-600" />
                </div>
                <div>
                  <p className="text-2xl font-bold">{keysReturned}</p>
                  <p className="text-sm text-muted-foreground">Keys Returned</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Room Keys Section */}
        {motelRegistrations.length > 0 && (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <KeyIcon className="size-5" />
                Room Key Tracking
              </CardTitle>
              <CardDescription>
                Track motel room keys - make sure all keys are returned at checkout
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Family</TableHead>
                    <TableHead>Room Keys</TableHead>
                    <TableHead>Checked In</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead className="text-right">Action</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {motelRegistrations.map((reg) => (
                    <TableRow key={reg.id}>
                      <TableCell>
                        <div>
                          <p className="font-medium">{reg.family_last_name}</p>
                          <p className="text-sm text-muted-foreground flex items-center gap-1">
                            <UserIcon className="size-3" />
                            {reg.family_member_count} members
                          </p>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="flex flex-wrap gap-1">
                          {reg.room_keys?.map((key, idx) => (
                            <Badge key={idx} variant="outline" className="font-mono">
                              {key}
                            </Badge>
                          ))}
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-1 text-sm text-muted-foreground">
                          <ClockIcon className="size-3" />
                          {formatTime(reg.checked_in_at)}
                        </div>
                      </TableCell>
                      <TableCell>
                        {reg.keys_returned ? (
                          <Badge variant="default" className="gap-1">
                            <CheckIcon className="size-3" />
                            Returned
                          </Badge>
                        ) : (
                          <Badge variant="secondary" className="gap-1">
                            <AlertCircleIcon className="size-3" />
                            Outstanding
                          </Badge>
                        )}
                      </TableCell>
                      <TableCell className="text-right">
                        <Button
                          size="sm"
                          variant={reg.keys_returned ? "outline" : "default"}
                          onClick={() => handleMarkKeysReturned(reg.id, reg.keys_returned || false)}
                        >
                          {reg.keys_returned ? "Undo Return" : "Mark Returned"}
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        )}

        {/* All Checked-In Families */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <CheckIcon className="size-5" />
              All Checked-In Families
            </CardTitle>
            <CardDescription>
              Complete list of families that have checked in
            </CardDescription>
          </CardHeader>
          <CardContent>
            {registrations.length === 0 ? (
              <div className="text-center py-12 text-muted-foreground">
                <CheckIcon className="size-12 mx-auto mb-4 opacity-20" />
                <p>No families have checked in yet</p>
              </div>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Family</TableHead>
                    <TableHead>Members</TableHead>
                    <TableHead>Lodging</TableHead>
                    <TableHead>Checked In At</TableHead>
                    <TableHead>Payment</TableHead>
                    <TableHead className="text-right">Action</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {registrations.map((reg) => (
                    <TableRow key={reg.id}>
                      <TableCell>
                        <p className="font-medium">{reg.family_last_name}</p>
                        <p className="text-sm text-muted-foreground">{reg.email}</p>
                      </TableCell>
                      <TableCell>{reg.family_member_count}</TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          {reg.lodging_type || "-"}
                          {reg.room_keys && reg.room_keys.length > 0 && (
                            <div className="flex gap-1">
                              {reg.room_keys.map((key, idx) => (
                                <Badge key={idx} variant="outline" className="font-mono text-xs">
                                  {key}
                                </Badge>
                              ))}
                            </div>
                          )}
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-1 text-sm">
                          <ClockIcon className="size-3 text-muted-foreground" />
                          {formatTime(reg.checked_in_at)}
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge variant={reg.payment_status === "paid" ? "default" : "secondary"}>
                          {reg.payment_status || "pending"}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-right">
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => handleUndoCheckIn(reg.id, reg.family_last_name)}
                          className="gap-1 text-amber-700 border-amber-300 hover:bg-amber-50"
                          title="Undo check-in (testing only)"
                        >
                          <Undo2Icon className="size-3" />
                          Undo Check-In
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
