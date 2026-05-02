"use client"

import { useEffect, useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Switch } from "@/components/ui/switch"
import { Label } from "@/components/ui/label"
import { MountainSnowIcon, ArrowLeftIcon, UsersIcon, PhoneIcon, DollarSignIcon, AlertTriangleIcon, Loader2Icon } from "lucide-react"
import Link from "next/link"
import { useToast } from "@/hooks/use-toast"

interface AdventureRegistration {
  id: number
  family_last_name: string
  email: string
  husband_phone: string | null
  wife_phone: string | null
  climbing_tower_total: number
  lodging_type: string | null
  first_person_name: string | null
  family_member_count: number
}

export default function AdventurePage() {
  const [registrations, setRegistrations] = useState<AdventureRegistration[]>([])
  const [totalRevenue, setTotalRevenue] = useState(0)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [adventureEnabled, setAdventureEnabled] = useState<boolean | null>(null)
  const [togglingAdventure, setTogglingAdventure] = useState(false)
  const [zeroingOut, setZeroingOut] = useState(false)
  const { toast } = useToast()

  // Fetch adventure enabled setting
  useEffect(() => {
    fetch("/api/settings/adventure")
      .then((r) => r.json())
      .then((data) => setAdventureEnabled(data.enabled))
      .catch(() => setAdventureEnabled(false))
  }, [])

  const handleToggleAdventure = async (enabled: boolean) => {
    setTogglingAdventure(true)
    try {
      const res = await fetch("/api/settings/adventure", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ enabled }),
      })
      if (res.ok) {
        setAdventureEnabled(enabled)
        toast({
          title: enabled ? "Adventure Activities Enabled" : "Adventure Activities Disabled",
          description: enabled 
            ? "Adventure costs will be included in totals." 
            : "Adventure costs will be excluded from totals. Run 'Zero Out' to remove from registrations.",
        })
      }
    } catch {
      toast({ title: "Error", description: "Failed to update setting", variant: "destructive" })
    } finally {
      setTogglingAdventure(false)
    }
  }

  const handleZeroOutAdventure = async () => {
    if (!confirm("This will set climbing_tower_total to $0 for ALL registrations. This cannot be undone. Are you sure?")) return
    
    setZeroingOut(true)
    try {
      const res = await fetch("/api/registrations/adventure/zero-out", { method: "POST" })
      const data = await res.json()
      if (res.ok) {
        toast({ 
          title: "Adventure Totals Zeroed Out", 
          description: `Updated ${data.updated} registration(s). Total removed: $${data.totalRemoved.toFixed(2)}` 
        })
        // Refresh the list
        setRegistrations([])
        setTotalRevenue(0)
      } else {
        toast({ title: "Error", description: data.error, variant: "destructive" })
      }
    } catch {
      toast({ title: "Error", description: "Failed to zero out adventure totals", variant: "destructive" })
    } finally {
      setZeroingOut(false)
    }
  }

  useEffect(() => {
    fetch("/api/registrations/adventure")
      .then((r) => r.json())
      .then((data) => {
        if (data.registrations) {
          setRegistrations(data.registrations)
          setTotalRevenue(data.total_revenue || 0)
        } else {
          setError("Failed to load data")
        }
      })
      .catch(() => setError("Failed to load adventure registrations"))
      .finally(() => setLoading(false))
  }, [])

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <div className="border-b bg-gradient-to-r from-blue-50 to-cyan-50">
        <div className="max-w-5xl mx-auto px-4 py-6">
          <div className="flex items-center gap-3 mb-2">
            <Link href="/admin">
              <Button variant="ghost" size="sm" className="gap-1.5 text-muted-foreground">
                <ArrowLeftIcon className="size-4" />
                Back to Dashboard
              </Button>
            </Link>
          </div>
          <div className="flex items-start justify-between gap-4 flex-wrap">
            <div className="flex items-center gap-3">
              <div className="p-2.5 rounded-lg bg-blue-100 border border-blue-200">
                <MountainSnowIcon className="size-5 text-blue-600" />
              </div>
              <div>
                <h1 className="text-2xl font-bold tracking-tight">Adventure Activities</h1>
                <p className="text-sm text-muted-foreground">
                  Families signed up for climbing tower &amp; adventure activities
                </p>
              </div>
            </div>

            {/* Adventure Toggle */}
            <div className="flex items-center gap-4">
              <div className="flex items-center gap-3 p-3 rounded-lg border bg-card">
                <div className="flex items-center gap-2">
                  <Switch 
                    id="adventure-toggle"
                    checked={adventureEnabled ?? false}
                    onCheckedChange={handleToggleAdventure}
                    disabled={togglingAdventure || adventureEnabled === null}
                  />
                  <Label htmlFor="adventure-toggle" className="text-sm font-medium">
                    {adventureEnabled ? "Enabled" : "Disabled"}
                  </Label>
                </div>
                {adventureEnabled === false && (
                  <Button 
                    variant="destructive" 
                    size="sm"
                    onClick={handleZeroOutAdventure}
                    disabled={zeroingOut || registrations.length === 0}
                  >
                    {zeroingOut ? (
                      <><Loader2Icon className="size-4 mr-1 animate-spin" />Zeroing...</>
                    ) : (
                      "Zero Out All"
                    )}
                  </Button>
                )}
              </div>
            </div>

            {!loading && registrations.length > 0 && (
              <div className="flex gap-3">
                <Card className="border-blue-200 bg-blue-50/60">
                  <CardContent className="px-4 py-3 flex items-center gap-2">
                    <UsersIcon className="size-4 text-blue-500" />
                    <div>
                      <div className="text-lg font-bold">{registrations.length}</div>
                      <div className="text-xs text-muted-foreground">{registrations.length === 1 ? "family" : "families"}</div>
                    </div>
                  </CardContent>
                </Card>
                <Card className="border-cyan-200 bg-cyan-50/60">
                  <CardContent className="px-4 py-3 flex items-center gap-2">
                    <MountainSnowIcon className="size-4 text-cyan-600" />
                    <div>
                      <div className="text-lg font-bold">
                        {registrations.reduce((sum, r) => sum + Math.round(Number(r.climbing_tower_total) / 10), 0)}
                      </div>
                      <div className="text-xs text-muted-foreground">participants</div>
                    </div>
                  </CardContent>
                </Card>
                <Card className="border-green-200 bg-green-50/60">
                  <CardContent className="px-4 py-3 flex items-center gap-2">
                    <DollarSignIcon className="size-4 text-green-500" />
                    <div>
                      <div className="text-lg font-bold">${Number(totalRevenue).toFixed(2)}</div>
                      <div className="text-xs text-muted-foreground">total collected</div>
                    </div>
                  </CardContent>
                </Card>
              </div>
            )}
          </div>
        </div>
      </div>

      <div className="max-w-5xl mx-auto px-4 py-6 space-y-3">
        {/* Warning Banner when disabled */}
        {adventureEnabled === false && (
          <Card className="border-amber-300 bg-amber-50">
            <CardContent className="py-4 flex items-center gap-3">
              <AlertTriangleIcon className="size-5 text-amber-600 shrink-0" />
              <div>
                <p className="font-medium text-amber-800">Adventure Activities are Disabled</p>
                <p className="text-sm text-amber-700">
                  Adventure costs are NOT being included in registration totals. 
                  Use &quot;Zero Out All&quot; to remove existing charges from all registrations.
                </p>
              </div>
            </CardContent>
          </Card>
        )}

        {loading && (
          <div className="text-center py-16 text-muted-foreground">Loading adventure registrations...</div>
        )}

        {error && (
          <div className="text-center py-16 text-red-500">{error}</div>
        )}

        {!loading && !error && registrations.length === 0 && (
          <div className="text-center py-16 text-muted-foreground">
            No families have signed up for adventure activities yet.
          </div>
        )}

        {!loading && !error && registrations.length > 0 && (
          <div className="rounded-lg border overflow-hidden">
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-muted/50 border-b">
                  <th className="text-left px-4 py-3 font-medium text-muted-foreground">Family</th>
                  <th className="text-left px-4 py-3 font-medium text-muted-foreground">Contact</th>
                  <th className="text-left px-4 py-3 font-medium text-muted-foreground">Lodging</th>
                  <th className="text-left px-4 py-3 font-medium text-muted-foreground">Members | Signed Up</th>
                  <th className="text-right px-4 py-3 font-medium text-muted-foreground">Activity Total</th>
                </tr>
              </thead>
              <tbody className="divide-y">
                {registrations.map((reg) => (
                  <tr key={reg.id} className="hover:bg-muted/30 transition-colors">
                    <td className="px-4 py-3">
                      <div className="font-medium">{reg.family_last_name} Family</div>
                      {reg.first_person_name && (
                        <div className="text-xs text-muted-foreground">{reg.first_person_name}</div>
                      )}
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-1 text-muted-foreground text-xs">
                        <PhoneIcon className="size-3" />
                        {reg.husband_phone || reg.wife_phone || "—"}
                      </div>
                      <div className="text-xs text-muted-foreground">{reg.email}</div>
                    </td>
                    <td className="px-4 py-3">
                      {reg.lodging_type ? (
                        <Badge variant="outline" className="text-xs">{reg.lodging_type}</Badge>
                      ) : (
                        <span className="text-muted-foreground">—</span>
                      )}
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-1.5">
                        <div className="flex items-center gap-1 text-muted-foreground">
                          <UsersIcon className="size-3.5" />
                          {reg.family_member_count}
                        </div>
                        <span className="text-muted-foreground/50">|</span>
                        <div className="flex items-center gap-1 text-blue-600 font-medium">
                          <MountainSnowIcon className="size-3.5" />
                          {Math.round(Number(reg.climbing_tower_total) / 10)}
                        </div>
                      </div>
                    </td>
                    <td className="px-4 py-3 text-right">
                      <span className="font-semibold text-blue-700">
                        ${Number(reg.climbing_tower_total).toFixed(2)}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
              <tfoot>
                <tr className="border-t bg-muted/30">
                  <td colSpan={4} className="px-4 py-3 text-sm font-medium text-muted-foreground">
                    Total — {registrations.length} {registrations.length === 1 ? "family" : "families"}
                  </td>
                  <td className="px-4 py-3 text-right font-bold text-blue-700">
                    ${Number(totalRevenue).toFixed(2)}
                  </td>
                </tr>
              </tfoot>
            </table>
          </div>
        )}
      </div>
    </div>
  )
}
