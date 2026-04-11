"use client"

import { DropdownMenuItem } from "@/components/ui/dropdown-menu"

import { DropdownMenuContent } from "@/components/ui/dropdown-menu"

import { DropdownMenuTrigger } from "@/components/ui/dropdown-menu"

import { DropdownMenu } from "@/components/ui/dropdown-menu"

import { useEffect, useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { cn } from "@/lib/utils"
import {
  CalendarIcon,
  SearchIcon,
  PlusIcon,
  PencilIcon,
  TrashIcon,
  UsersIcon,
  CheckCircleIcon,
  ClockIcon,
  DownloadIcon,
  HeartHandshakeIcon,
  AlertCircleIcon,
  LightbulbIcon,
  Mail,
  KeyIcon,
  BookOpenIcon,
  LogOutIcon,
  MountainSnowIcon,
} from "lucide-react"
import { RegistrationDialog } from "./registration-dialog"
import { RegistrationDetailsDialog } from "./registration-details-dialog"
import { CountdownTimer } from "./countdown-timer"
import { useToast } from "@/hooks/use-toast"
import Link from "next/link"
import { PaymentStatusDialog } from "./payment-status-dialog"
import { handleExportBadges, handleExportFullData, handleExportLWCC, handleExportContactInfo, handleExportResendTshirtOrdered, handleExportResendNoTshirt, handleExportTshirtBreakdown } from "./export-badges"
import { DropdownMenuSeparator, DropdownMenuLabel } from "@/components/ui/dropdown-menu"

interface Registration {
  id: number
  family_last_name: string
  email: string
  husband_phone: string | null
  wife_phone: string | null
  address: string | null
  city: string | null
  state: string | null
  zip: string | null
  home_congregation: string | null
  currently_homeschooling: boolean | null
  years_homeschooling: number | null
  times_attended: number | null
  lodging_type: string | null
  lodging_total: number | null
  tshirt_total: number | null
  scholarship_donation: number | null
  scholarship_requested: boolean | null
  emergency_contact_name: string | null
  emergency_contact_phone: string | null
  emergency_contact_relationship: string | null
  payment_status: string | null
  registration_fee: number | null
  full_payment_paid: boolean | null
  created_at: string
  updated_at: string
  family_member_count?: number
  tshirt_order_count?: number
  volunteer_count?: number
  first_person_name?: string | null
}

// Abbreviate lodging type for compact display
function abbreviateLodging(lodging: string | null): string {
  if (!lodging) return "—"
  const lower = lodging.toLowerCase()
  if (lower === "tent") return "Tent"
  if (lower === "rv") return "RV"
  if (lower === "commuting") return "Comm"
  // Handle motel patterns like "motel-1queen-2bunk" -> "M-1Q-2B"
  if (lower.startsWith("motel-")) {
    const parts = lower.replace("motel-", "").split("-")
    const abbrev = parts.map(p => {
      const match = p.match(/^(\d*)(.+)$/)
      if (!match) return p.charAt(0).toUpperCase()
      const [, num, type] = match
      const typeAbbrev = type === "queen" ? "Q" : type === "bunk" ? "B" : type === "king" ? "K" : type.charAt(0).toUpperCase()
      return num ? `${num}${typeAbbrev}` : typeAbbrev
    }).join("-")
    return `M-${abbrev}`
  }
  return lodging
}

interface Stats {
  overall: {
    total: string
    paid: string
    pending: string
    partial: string
    total_attendees: string
    recent_week: string
    checked_in: string
    checked_in_attendees: string
  }
  byLodging: Array<{
    lodging_type: string
    registrations: string
    attendees: string
  }>
  tshirts: {
    total_shirts: number
    families_with_shirts: number
    tshirt_revenue: number
  }
}

export function AdminDashboard() {
  const [registrations, setRegistrations] = useState<Registration[]>([])
  const [stats, setStats] = useState<Stats | null>(null)
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState("")
  const [statusFilter, setStatusFilter] = useState("all")
  const [sortBy, setSortBy] = useState<"family_last_name" | "created_at">("family_last_name")
  const [sortDir, setSortDir] = useState<"asc" | "desc">("asc")
  const [dialogOpen, setDialogOpen] = useState(false)
  const [editingRegistration, setEditingRegistration] = useState<Registration | null>(null)
  const [viewingRegistration, setViewingRegistration] = useState<number | null>(null)
  const [editingPaymentId, setEditingPaymentId] = useState<number | null>(null)
  const { toast } = useToast()

  const handleLogout = async () => {
    await fetch("/api/admin/logout", { method: "POST" })
    window.location.href = "/admin/login"
  }

  const fetchRegistrations = async () => {
    try {
      const params = new URLSearchParams()
      if (statusFilter !== "all") params.append("status", statusFilter)
      if (search) params.append("search", search)

      const response = await fetch(`/api/registrations?${params}`)
      const data = await response.json()
      setRegistrations(data)
    } catch (error) {
      console.error("[v0] Error fetching registrations:", error)
      toast({
        title: "Error",
        description: "Failed to fetch registrations",
        variant: "destructive",
      })
    }
  }

  const fetchStats = async () => {
    try {
      const response = await fetch("/api/registrations/stats")
      const data = await response.json()
      setStats(data)
    } catch (error) {
      console.error("[v0] Error fetching stats:", error)
    }
  }

  const handleDelete = async (id: number) => {
    if (!confirm("Are you sure you want to delete this registration?")) return

    try {
      const response = await fetch(`/api/registrations/${id}`, {
        method: "DELETE",
      })

      if (response.ok) {
        toast({
          title: "Success",
          description: "Registration deleted successfully",
        })
        fetchRegistrations()
        fetchStats()
      }
    } catch (error) {
      console.error("[v0] Error deleting registration:", error)
      toast({
        title: "Error",
        description: "Failed to delete registration",
        variant: "destructive",
      })
    }
  }

  const handleEdit = (registration: Registration) => {
    setEditingRegistration(registration)
    setDialogOpen(true)
  }

  const handleDialogClose = (shouldRefresh?: boolean) => {
    setDialogOpen(false)
    setEditingRegistration(null)
    if (shouldRefresh) {
      fetchRegistrations()
      fetchStats()
    }
  }

  useEffect(() => {
    const loadData = async () => {
      setLoading(true)
      await Promise.all([fetchRegistrations(), fetchStats()])
      setLoading(false)
    }
    loadData()
  }, [statusFilter, search])

  // Re-fetch when the tab becomes visible again (e.g. returning from check-in page)
  useEffect(() => {
    const handleVisibilityChange = () => {
      if (document.visibilityState === "visible") {
        fetchRegistrations()
        fetchStats()
      }
    }
    document.addEventListener("visibilitychange", handleVisibilityChange)
    return () => document.removeEventListener("visibilitychange", handleVisibilityChange)
  }, [statusFilter, search])

  // Poll every 30 seconds so live updates from check-in station appear automatically
  useEffect(() => {
    const interval = setInterval(() => {
      fetchRegistrations()
      fetchStats()
    }, 30_000)
    return () => clearInterval(interval)
  }, [statusFilter, search])

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4" />
          <p className="text-muted-foreground">Loading dashboard...</p>
        </div>
      </div>
    )
  }

  const registrationClosesDate = new Date("2026-04-15T11:59:00-05:00")
  const eventStartsDate = new Date("2026-05-04T13:00:00-05:00")

  const filteredRegistrations = registrations
    .filter((reg) => {
      if (statusFilter !== "all" && reg.payment_status !== statusFilter) return false
      if (
        search &&
        !reg.family_last_name.toLowerCase().includes(search.toLowerCase()) &&
        !reg.email.toLowerCase().includes(search.toLowerCase())
      )
        return false
      return true
    })
    .sort((a, b) => {
      let cmp = 0
      if (sortBy === "family_last_name") {
        cmp = (a.family_last_name || "").localeCompare(b.family_last_name || "")
      } else {
        cmp = new Date(a.created_at || 0).getTime() - new Date(b.created_at || 0).getTime()
      }
      return sortDir === "asc" ? cmp : -cmp
    })

  const handleSort = (col: "family_last_name" | "created_at") => {
    if (sortBy === col) {
      setSortDir((d) => (d === "asc" ? "desc" : "asc"))
    } else {
      setSortBy(col)
      setSortDir("asc")
    }
  }

  return (
    <div className="min-h-screen bg-muted/30 p-6 space-y-6">
      <div className="max-w-7xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Event Registrations</h1>
            <p className="text-muted-foreground mt-1">Manage and monitor all event registrations</p>
          </div>
          <div className="flex gap-2">
            <Button variant="ghost" size="lg" onClick={handleLogout} className="text-muted-foreground">
              <LogOutIcon className="mr-2 size-4" />
              Sign Out
            </Button>
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="outline" size="lg">
                  <DownloadIcon className="mr-2 size-4" />
                  Export Data
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-56">
                <DropdownMenuItem onClick={handleExportBadges}>
                  <DownloadIcon className="mr-2 size-4" />
                  Name Badges (CSV)
                </DropdownMenuItem>
                <DropdownMenuItem onClick={handleExportFullData}>
                  <DownloadIcon className="mr-2 size-4" />
                  Full Registration Data
                </DropdownMenuItem>
                <DropdownMenuItem onClick={handleExportLWCC}>
                  <DownloadIcon className="mr-2 size-4" />
                  LWCC Breakdown (Per Person)
                </DropdownMenuItem>
                <DropdownMenuItem onClick={handleExportContactInfo}>
                  <DownloadIcon className="mr-2 size-4" />
                  Contact Information
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuLabel className="text-xs text-muted-foreground px-2 py-1">T-Shirt Reports</DropdownMenuLabel>
                <DropdownMenuItem onClick={handleExportTshirtBreakdown}>
                  <DownloadIcon className="mr-2 size-4" />
                  T-Shirt Breakdown by Family
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuLabel className="text-xs text-muted-foreground px-2 py-1">Resend Email Lists</DropdownMenuLabel>
                <DropdownMenuItem onClick={handleExportResendTshirtOrdered}>
                  <DownloadIcon className="mr-2 size-4" />
                  T-Shirt Ordered (Resend)
                </DropdownMenuItem>
                <DropdownMenuItem onClick={handleExportResendNoTshirt}>
                  <DownloadIcon className="mr-2 size-4" />
                  No T-Shirt Order (Resend)
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
            <Button onClick={() => setDialogOpen(true)} size="lg">
              <PlusIcon className="mr-2" />
              New Registration
            </Button>
          </div>
        </div>

        <div className="grid gap-4 md:grid-cols-2">
          <CountdownTimer targetDate={registrationClosesDate} label="Registration Closes" icon="calendar" />
          <CountdownTimer targetDate={eventStartsDate} label="Event Starts" icon="clock" />
        </div>

        <div className="grid gap-4 md:grid-cols-4">
          <Link href="/admin/checkin">
            <Card className="cursor-pointer hover:bg-muted/50 transition-colors">
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-sm font-medium">Check-In</CardTitle>
                <CheckCircleIcon className="size-4 text-green-500" />
              </CardHeader>
              <CardContent>
                <div className="text-sm text-muted-foreground">Check in families onsite</div>
              </CardContent>
            </Card>
          </Link>

          <Link href="/admin/health-info">
            <Card className="cursor-pointer hover:bg-muted/50 transition-colors">
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-sm font-medium">Health Information</CardTitle>
                <AlertCircleIcon className="size-4 text-red-500" />
              </CardHeader>
              <CardContent>
                <div className="text-sm text-muted-foreground">View health conditions</div>
              </CardContent>
            </Card>
          </Link>

          <Link href="/admin/volunteers">
            <Card className="cursor-pointer hover:bg-muted/50 transition-colors">
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-sm font-medium">Volunteer Signups</CardTitle>
                <HeartHandshakeIcon className="size-4 text-blue-500" />
              </CardHeader>
              <CardContent>
                <div className="text-sm text-muted-foreground">View all volunteers</div>
              </CardContent>
            </Card>
          </Link>

          <Link href="/admin/lessons">
            <Card className="cursor-pointer hover:bg-muted/50 transition-colors">
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-sm font-medium">Lesson Bids</CardTitle>
                <BookOpenIcon className="size-4 text-amber-600" />
              </CardHeader>
              <CardContent>
                <div className="text-sm text-muted-foreground">Manage lesson presenter selection</div>
              </CardContent>
            </Card>
          </Link>

          <Link href="/admin/sessions">
            <Card className="cursor-pointer hover:bg-muted/50 transition-colors">
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-sm font-medium">Session Suggestions</CardTitle>
                <LightbulbIcon className="size-4 text-yellow-500" />
              </CardHeader>
              <CardContent>
                <div className="text-sm text-muted-foreground">View session ideas</div>
              </CardContent>
            </Card>
          </Link>

          <Link href="/admin/tshirts">
            <Card className="cursor-pointer hover:bg-muted/50 transition-colors">
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-sm font-medium">T-Shirt Orders</CardTitle>
                <svg className="size-4 text-indigo-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 21h10V8l-5-5-5 5v13z M12 3v5h5" />
                </svg>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{stats.tshirts?.total_shirts ?? 0}</div>
                <p className="text-xs text-muted-foreground mt-1">
                  {stats.tshirts?.families_with_shirts ?? 0} {stats.tshirts?.families_with_shirts === 1 ? "family" : "families"} &middot; ${Number(stats.tshirts?.tshirt_revenue ?? 0).toFixed(2)}
                </p>
              </CardContent>
            </Card>
          </Link>

          {/* Email Communications card */}
          <Link href="/admin/email">
            <Card className="cursor-pointer hover:bg-muted/50 transition-colors">
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-sm font-medium">Email Communications</CardTitle>
                <Mail className="size-4 text-purple-500" />
              </CardHeader>
              <CardContent>
                <div className="text-sm text-muted-foreground">Send emails to all registered families</div>
              </CardContent>
            </Card>
          </Link>

          {/* Checked-In Families card */}
          <Link href="/admin/checked-in">
            <Card className="cursor-pointer hover:bg-muted/50 transition-colors">
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-sm font-medium">Checked-In Families</CardTitle>
                <CheckCircleIcon className="size-4 text-green-500" />
              </CardHeader>
              <CardContent>
                <div className="text-sm text-muted-foreground">View all checked-in families</div>
              </CardContent>
            </Card>
          </Link>

          {/* Arrival Notes shortcut */}
          <Link href="/admin/arrival-notes">
            <Card className="cursor-pointer hover:bg-muted/50 transition-colors border-orange-200">
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-sm font-medium">Arrival Notes</CardTitle>
                <ClockIcon className="size-4 text-orange-500" />
              </CardHeader>
              <CardContent>
                <div className="text-sm text-muted-foreground">Late arrivals &amp; early departures</div>
              </CardContent>
            </Card>
          </Link>

          {/* Adventure Activities shortcut */}
          <Link href="/admin/adventure">
            <Card className="cursor-pointer hover:bg-muted/50 transition-colors border-blue-200">
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-sm font-medium">Adventure Activities</CardTitle>
                <MountainSnowIcon className="size-4 text-blue-500" />
              </CardHeader>
              <CardContent>
                <div className="text-sm text-muted-foreground">Climbing tower &amp; activities</div>
              </CardContent>
            </Card>
          </Link>

          {/* Key Checkout card */}
          <Link href="/admin/checkout">
            <Card className="cursor-pointer hover:bg-muted/50 transition-colors">
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-sm font-medium">Key Checkout</CardTitle>
                <KeyIcon className="size-4 text-amber-500" />
              </CardHeader>
              <CardContent>
                <div className="text-sm text-muted-foreground">Process motel key returns</div>
              </CardContent>
            </Card>
          </Link>
        </div>

        {/* Stats Cards */}
        {stats && (
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-5">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-sm font-medium">Total Registrations</CardTitle>
                <UsersIcon className="size-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{stats.overall.total}</div>
                <p className="text-xs text-muted-foreground mt-1">{stats.overall.total_attendees} family members</p>
              </CardContent>
            </Card>

            <Card className="border-green-200 bg-green-50/50">
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-sm font-medium">Checked In</CardTitle>
                <CheckCircleIcon className="size-4 text-green-600" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-green-700">{stats.overall.checked_in}</div>
                <p className="text-xs text-muted-foreground mt-1">{stats.overall.checked_in_attendees} people on site</p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-sm font-medium">Paid</CardTitle>
                <CheckCircleIcon className="size-4 text-green-600" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{stats.overall.paid}</div>
                <p className="text-xs text-muted-foreground mt-1">Full payment received</p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-sm font-medium">Pending Payment</CardTitle>
                <ClockIcon className="size-4 text-yellow-600" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{stats.overall.pending}</div>
                <p className="text-xs text-muted-foreground mt-1">Awaiting payment</p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-sm font-medium">This Week</CardTitle>
                <CalendarIcon className="size-4 text-blue-600" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{stats.overall.recent_week}</div>
                <p className="text-xs text-muted-foreground mt-1">New registrations</p>
              </CardContent>
            </Card>
          </div>
        )}

        {/* Filters */}
        <Card>
          <CardHeader>
            <CardTitle>Filter Registrations</CardTitle>
            <CardDescription>Search and filter event registrations</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex flex-col sm:flex-row gap-4">
              <div className="flex-1">
                <div className="relative">
                  <SearchIcon className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-muted-foreground" />
                  <Input
                    placeholder="Search by family name or email..."
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                    className="pl-9"
                  />
                </div>
              </div>
              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger className="w-full sm:w-[180px]">
                  <SelectValue placeholder="Payment Status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Status</SelectItem>
                  <SelectItem value="paid">Paid</SelectItem>
                  <SelectItem value="pending">Pending</SelectItem>
                  <SelectItem value="partial">Partial</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </CardContent>
        </Card>

        {/* Registrations Table */}
        <Card>
          <CardHeader>
            <CardTitle>Registrations</CardTitle>
            <CardDescription>
              {filteredRegistrations.length} registration{filteredRegistrations.length !== 1 ? "s" : ""} found
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="rounded-md border">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>
                      <button
                        onClick={() => handleSort("family_last_name")}
                        className="flex items-center gap-1 font-semibold hover:text-foreground transition-colors group"
                      >
                        Family Name
                        <span className="text-muted-foreground group-hover:text-foreground">
                          {sortBy === "family_last_name" ? (sortDir === "asc" ? "↑" : "↓") : "↕"}
                        </span>
                      </button>
                    </TableHead>
                    <TableHead>
                      <button
                        onClick={() => handleSort("created_at")}
                        className="flex items-center gap-1 font-semibold hover:text-foreground transition-colors group"
                      >
                        Registered
                        <span className="text-muted-foreground group-hover:text-foreground">
                          {sortBy === "created_at" ? (sortDir === "asc" ? "↑" : "↓") : "↕"}
                        </span>
                      </button>
                    </TableHead>
                    <TableHead>Name</TableHead>
                    <TableHead>Phone</TableHead>
                    <TableHead>Lodging</TableHead>
                    <TableHead>FM</TableHead>
                    <TableHead>Expected Total</TableHead>
                    <TableHead>Amount Owed</TableHead>
                    <TableHead>Payment Status</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredRegistrations.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={10} className="text-center py-8 text-muted-foreground">
                        No registrations found
                      </TableCell>
                    </TableRow>
                  ) : (
                    filteredRegistrations.map((registration) => {
                      const regFee = Number(registration.registration_fee) || 0
                      const lodgingTotal = Number(registration.lodging_total) || 0
                      const tshirtTotal = Number(registration.tshirt_total) || 0
                      const donation = Number(registration.scholarship_donation) || 0
                      const expectedTotal = regFee + lodgingTotal + tshirtTotal + donation

                      // Calculate amount owed based on payment status
                      const amountOwed =
                        registration.payment_status === "paid"
                          ? 0
                          : registration.payment_status === "partial"
                            ? lodgingTotal + tshirtTotal + donation // If partial, assume reg fee paid
                            : expectedTotal // If pending, owe everything

                      return (
                        <TableRow key={registration.id}>
                          <TableCell className="font-medium">{registration.family_last_name || "N/A"}</TableCell>
                          <TableCell className="text-xs text-muted-foreground whitespace-nowrap">
                            {registration.created_at
                              ? new Date(registration.created_at).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })
                              : "—"}
                            <div className="text-[10px]">
                              {registration.created_at
                                ? new Date(registration.created_at).toLocaleTimeString("en-US", { hour: "numeric", minute: "2-digit", hour12: true })
                                : ""}
                            </div>
                          </TableCell>
                          <TableCell>{registration.first_person_name || "—"}</TableCell>
                          <TableCell className="text-sm">{registration.husband_phone || registration.wife_phone || "—"}</TableCell>
                          <TableCell>
                            <div>
                              <Badge variant="outline" className="text-xs">{abbreviateLodging(registration.lodging_type)}</Badge>
                              {lodgingTotal > 0 && (
                                <div className="text-xs text-muted-foreground mt-1">${lodgingTotal.toFixed(2)}</div>
                              )}
                            </div>
                          </TableCell>
                          <TableCell>
                            <div className="flex items-center gap-1.5">
                              <UsersIcon className="size-4 text-muted-foreground" />
                              {registration.family_member_count || 0}
                            </div>
                          </TableCell>
                          <TableCell>
                            <div className="font-medium">${expectedTotal.toFixed(2)}</div>
                            <div className="text-xs text-muted-foreground space-y-0.5">
                              <div>Reg: ${regFee.toFixed(2)}</div>
                              {lodgingTotal > 0 && <div>Lodging: ${lodgingTotal.toFixed(2)}</div>}
                              {tshirtTotal > 0 && <div>T-Shirts: ${tshirtTotal.toFixed(2)}</div>}
                              {donation > 0 && <div>Donation: ${donation.toFixed(2)}</div>}
                            </div>
                          </TableCell>
                          <TableCell>
                            <div className={`font-medium ${amountOwed > 0 ? "text-red-600" : "text-green-600"}`}>
                              ${amountOwed.toFixed(2)}
                            </div>
                          </TableCell>
                          <TableCell>
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => setEditingPaymentId(registration.id)}
                              className={cn(
                                "w-[130px] justify-start text-left font-normal",
                                registration.payment_status === "paid" && "bg-green-50 border-green-200 text-green-700",
                                registration.payment_status === "pending" &&
                                  "bg-yellow-50 border-yellow-200 text-yellow-700",
                                registration.payment_status === "partial" &&
                                  "bg-orange-50 border-orange-200 text-orange-700",
                              )}
                            >
                              {registration.payment_status === "paid" && "Paid"}
                              {registration.payment_status === "pending" && "Pending"}
                              {registration.payment_status === "partial" && "Partial"}
                            </Button>
                            {registration.scholarship_requested && (
                              <span className="ml-1 flex items-center gap-1 text-[10px] font-semibold text-purple-700 bg-purple-50 border border-purple-200 px-1.5 py-0.5 rounded-full whitespace-nowrap">
                                Scholarship
                              </span>
                            )}
                          </TableCell>
                          <TableCell className="text-right">
                            <div className="flex justify-end items-center gap-1">
                              <Button
                                variant="ghost"
                                size="sm"
                                className="h-8 px-3 text-sm font-medium"
                                onClick={() => setViewingRegistration(registration.id)}
                              >
                                View
                                <PencilIcon className="ml-2 size-3.5 text-muted-foreground" />
                              </Button>
                              <Button
                                variant="ghost"
                                size="sm"
                                className="h-8 w-8 p-0 text-muted-foreground hover:text-destructive"
                                onClick={() => handleDelete(registration.id)}
                              >
                                <TrashIcon className="size-4" />
                              </Button>
                            </div>
                          </TableCell>
                        </TableRow>
                      )
                    })
                  )}
                </TableBody>
              </Table>
            </div>
          </CardContent>
        </Card>
      </div>

      <RegistrationDialog open={dialogOpen} onOpenChange={handleDialogClose} registration={editingRegistration} />

      {viewingRegistration && (
        <RegistrationDetailsDialog registrationId={viewingRegistration} onClose={() => setViewingRegistration(null)} />
      )}

      {editingPaymentId && (
        <PaymentStatusDialog
          key={`payment-${editingPaymentId}-${registrations.find((r) => r.id === editingPaymentId)?.payment_status}`}
          registration={registrations.find((r) => r.id === editingPaymentId)!}
          open={!!editingPaymentId}
          onOpenChange={(open) => !open && setEditingPaymentId(null)}
          onUpdate={async () => {
            console.log("[v0] Payment updated, refreshing data...")
            await fetchRegistrations()
            await fetchStats()
            console.log("[v0] Data refreshed")
          }}
        />
      )}
    </div>
  )
}
