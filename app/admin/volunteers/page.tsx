"use client"

import { useState, useEffect, useCallback } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { useToast } from "@/hooks/use-toast"
import { VolunteerScheduleDialog } from "@/components/volunteer-schedule-dialog"
import {
  ArrowLeftIcon,
  CalendarIcon,
  ClockIcon,
  Loader2Icon,
  MailIcon,
  SendIcon,
  CheckCircleIcon,
  XCircleIcon,
  HelpCircleIcon,
  UsersIcon,
  RotateCcwIcon,
  SearchIcon,
  AlertTriangleIcon,
  UserIcon,
  BookOpenIcon,
  GlobeIcon,
  EyeOffIcon,
} from "lucide-react"
import { Input } from "@/components/ui/input"
import Link from "next/link"

interface Volunteer {
  id: number
  registration_id: number
  volunteer_name: string
  volunteer_type: string
  assigned_date: string | null
  time_slot: string | null
  prayer_type: string | null
  notes: string | null
  schedule_status: string | null
  schedule_email_sent_at: string | null
  responded_at: string | null
  claimed_lesson_id: number | null
  claimed_lesson_title: string | null
  family_last_name: string
  email: string
}

const EVENT_DAYS = [
  { date: "2026-05-04", label: "Monday, May 4" },
  { date: "2026-05-05", label: "Tuesday, May 5" },
  { date: "2026-05-06", label: "Wednesday, May 6" },
  { date: "2026-05-07", label: "Thursday, May 7" },
  { date: "2026-05-08", label: "Friday, May 8" },
]

const TIME_SLOTS = ["Morning Devotion", "Evening Devotion"]

function StatusBadge({ status, emailSent }: { status: string | null; emailSent: boolean }) {
  if (!emailSent) return <Badge variant="outline" className="text-xs gap-1"><HelpCircleIcon className="size-3" />Not Sent</Badge>
  if (status === "approved") return <Badge className="text-xs gap-1 bg-green-500 hover:bg-green-600"><CheckCircleIcon className="size-3" />Accepted</Badge>
  if (status === "declined") return <Badge variant="destructive" className="text-xs gap-1"><XCircleIcon className="size-3" />Declined</Badge>
  return <Badge variant="secondary" className="text-xs gap-1"><MailIcon className="size-3" />Awaiting Reply</Badge>
}

export default function VolunteersPage() {
  const [volunteers, setVolunteers] = useState<Volunteer[]>([])
  const [loading, setLoading] = useState(true)
  const [sendingAll, setSendingAll] = useState(false)
  const [sendingId, setSendingId] = useState<number | null>(null)
  const [resettingId, setResettingId] = useState<number | null>(null)
  const [search, setSearch] = useState("")
  const [scheduleDialogOpen, setScheduleDialogOpen] = useState(false)
  const [selectedVolunteer, setSelectedVolunteer] = useState<Volunteer | null>(null)
  const [schedulePublished, setSchedulePublished] = useState(false)
  const [togglingPublish, setTogglingPublish] = useState(false)
  const { toast } = useToast()

  const fetchVolunteers = useCallback(async () => {
    try {
      const res = await fetch("/api/volunteers")
      const data = await res.json()
      setVolunteers(Array.isArray(data) ? data : [])
    } catch {
      toast({ title: "Error", description: "Failed to load volunteers", variant: "destructive" })
    } finally {
      setLoading(false)
    }
  }, [toast])

  const fetchPublishStatus = useCallback(async () => {
    try {
      const res = await fetch("/api/settings/schedule-published")
      const data = await res.json()
      setSchedulePublished(!!data.published)
    } catch {
      // silently fail
    }
  }, [])

  useEffect(() => {
    fetchVolunteers()
    fetchPublishStatus()
  }, [fetchVolunteers, fetchPublishStatus])

  const togglePublish = async () => {
    setTogglingPublish(true)
    try {
      const next = !schedulePublished
      const res = await fetch("/api/settings/schedule-published", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ published: next }),
      })
      if (res.ok) {
        setSchedulePublished(next)
        toast({
          title: next ? "Schedule Published" : "Schedule Hidden",
          description: next
            ? "The volunteer schedule is now visible on the /home page."
            : "The volunteer schedule has been hidden from the /home page.",
        })
      }
    } catch {
      toast({ title: "Error", description: "Failed to update publish status", variant: "destructive" })
    } finally {
      setTogglingPublish(false)
    }
  }

  const scheduledVolunteers = volunteers.filter((v) => v.assigned_date && v.time_slot)
  const unscheduledVolunteers = volunteers.filter((v) => !v.assigned_date || !v.time_slot)

  // Group by person name to detect multi-signups
  const byPerson: Record<string, Volunteer[]> = {}
  for (const vol of volunteers) {
    const key = `${vol.volunteer_name}||${vol.registration_id}`
    if (!byPerson[key]) byPerson[key] = []
    byPerson[key].push(vol)
  }
  const multiSignupNames = new Set(
    Object.entries(byPerson)
      .filter(([, vols]) => vols.length > 1)
      .map(([key]) => key)
  )
  const multiSignupCount = multiSignupNames.size

  const sendScheduleEmail = async (vol: Volunteer) => {
    setSendingId(vol.id)
    try {
      const res = await fetch("/api/volunteers/send-schedule", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ volunteerIds: [vol.id] }),
      })
      const data = await res.json()
      if (res.ok) {
        toast({ title: "Email Sent", description: data.message })
        fetchVolunteers()
      } else {
        toast({ title: "Error", description: data.error || "Failed to send", variant: "destructive" })
      }
    } catch {
      toast({ title: "Error", description: "Failed to send email", variant: "destructive" })
    } finally {
      setSendingId(null)
    }
  }

  const resetVolunteer = async (vol: Volunteer) => {
    if (!confirm(`Reset schedule for ${vol.volunteer_name}? This will clear their assignment, email status, and response.`)) return
    setResettingId(vol.id)
    try {
      const res = await fetch(`/api/volunteers/${vol.id}/reset`, { method: "POST" })
      if (res.ok) {
        toast({ title: "Reset", description: `${vol.volunteer_name}'s schedule has been cleared.` })
        fetchVolunteers()
      } else {
        toast({ title: "Error", description: "Failed to reset volunteer", variant: "destructive" })
      }
    } catch {
      toast({ title: "Error", description: "Failed to reset volunteer", variant: "destructive" })
    } finally {
      setResettingId(null)
    }
  }

  const sendAllScheduleEmails = async () => {    if (!confirm(`Send schedule emails to all ${scheduledVolunteers.length} assigned volunteers?`)) return
    setSendingAll(true)
    try {
      const res = await fetch("/api/volunteers/send-schedule", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({}),
      })
      const data = await res.json()
      if (res.ok) {
        toast({ title: "Emails Sent", description: data.message })
        fetchVolunteers()
      } else {
        toast({ title: "Error", description: data.error || "Failed to send", variant: "destructive" })
      }
    } catch {
      toast({ title: "Error", description: "Failed to send emails", variant: "destructive" })
    } finally {
      setSendingAll(false)
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2Icon className="size-8 animate-spin text-muted-foreground" />
      </div>
    )
  }

  return (
    <div className="p-4 md:p-6 max-w-6xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex items-center gap-4">
        <Link href="/admin">
          <Button variant="ghost" size="sm" className="gap-2">
            <ArrowLeftIcon className="size-4" />
            Back
          </Button>
        </Link>
        <div className="flex-1">
          <h1 className="text-2xl font-bold">Volunteer Scheduling</h1>
          <p className="text-sm text-muted-foreground mt-0.5">
            {scheduledVolunteers.length} assigned · {unscheduledVolunteers.length} unassigned
          </p>
        </div>
        <Button
          variant={schedulePublished ? "default" : "outline"}
          onClick={togglePublish}
          disabled={togglingPublish}
          className={`gap-2 ${schedulePublished ? "bg-green-600 hover:bg-green-700 text-white" : ""}`}
        >
          {togglingPublish ? (
            <Loader2Icon className="size-4 animate-spin" />
          ) : schedulePublished ? (
            <GlobeIcon className="size-4" />
          ) : (
            <EyeOffIcon className="size-4" />
          )}
          {schedulePublished ? "Published" : "Publish Schedule"}
        </Button>
      </div>

      {/* Multi-signup warning banner */}
      {multiSignupCount > 0 && (
        <div className="flex items-start gap-3 p-4 bg-amber-50 border border-amber-300 rounded-xl text-amber-900">
          <AlertTriangleIcon className="size-5 shrink-0 mt-0.5 text-amber-600" />
          <div>
            <p className="font-semibold text-sm">
              {multiSignupCount} {multiSignupCount === 1 ? "person has" : "people have"} signed up for multiple roles
            </p>
            <p className="text-xs text-amber-700 mt-0.5">
              Check the "By Person" tab to review and resolve any conflicts.
            </p>
          </div>
        </div>
      )}

      <Tabs defaultValue="schedule">
        <TabsList>
          <TabsTrigger value="schedule" className="gap-2">
            <CalendarIcon className="size-4" />
            Final Schedule
          </TabsTrigger>
          <TabsTrigger value="manage" className="gap-2">
            <UsersIcon className="size-4" />
            By Role
          </TabsTrigger>
          <TabsTrigger value="byPerson" className="gap-2">
            <UserIcon className="size-4" />
            By Person
            {multiSignupCount > 0 && (
              <span className="ml-1 bg-amber-500 text-white text-[10px] font-bold px-1.5 py-0.5 rounded-full leading-none">
                {multiSignupCount}
              </span>
            )}
          </TabsTrigger>
        </TabsList>

        {/* FINAL SCHEDULE TAB */}
        <TabsContent value="schedule" className="space-y-6 mt-6">
          {scheduledVolunteers.length > 0 && (
            <div className="flex items-center justify-between p-4 bg-muted/40 rounded-xl border">
              <div>
                <p className="font-medium text-sm">{scheduledVolunteers.length} volunteers assigned</p>
                <p className="text-xs text-muted-foreground mt-0.5">
                  {scheduledVolunteers.filter((v) => v.schedule_status === "approved").length} accepted ·{" "}
                  {scheduledVolunteers.filter((v) => v.schedule_status === "declined").length} declined ·{" "}
                  {scheduledVolunteers.filter((v) => v.schedule_email_sent_at && !v.schedule_status).length} awaiting reply
                </p>
              </div>
              <Button onClick={sendAllScheduleEmails} disabled={sendingAll} className="gap-2">
                {sendingAll ? <Loader2Icon className="size-4 animate-spin" /> : <SendIcon className="size-4" />}
                Send All
              </Button>
            </div>
          )}

          {/* Full grid: all 5 days × 2 sessions, always shown */}
          <div className="overflow-x-auto -mx-4 px-4">
            <div className="min-w-[640px]">
              {/* Column headers */}
              <div className="grid grid-cols-[120px_1fr_1fr_1fr_1fr_1fr] gap-2 mb-2">
                <div />
                {EVENT_DAYS.map((day) => (
                  <div key={day.date} className="text-center">
                    <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">
                      {new Date(day.date + "T12:00:00").toLocaleDateString("en-US", { weekday: "short" })}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      May {new Date(day.date + "T12:00:00").getDate()}
                    </p>
                  </div>
                ))}
              </div>

              {/* Rows: one per time slot */}
              {TIME_SLOTS.map((slot) => (
                <div key={slot} className="grid grid-cols-[120px_1fr_1fr_1fr_1fr_1fr] gap-2 mb-3">
                  {/* Slot label */}
                  <div className="flex items-start pt-2">
                    <p className="text-xs font-medium text-muted-foreground leading-tight">{slot}</p>
                  </div>

                  {/* One cell per day */}
                  {EVENT_DAYS.map((day) => {
                    const normalise = (d: string | null) => d ? String(d).substring(0, 10) : null
                    const vols = scheduledVolunteers.filter(
                      (v) => normalise(v.assigned_date) === day.date && v.time_slot === slot
                    )
                    const isEmpty = vols.length === 0

                    return (
                      <div
                        key={day.date}
                        className={`rounded-lg border p-2 min-h-[72px] ${
                          isEmpty
                            ? "border-dashed border-muted-foreground/20 bg-muted/20"
                            : "border-border bg-card"
                        }`}
                      >
                        {isEmpty ? (
                          <p className="text-xs text-muted-foreground/40 text-center mt-3">—</p>
                        ) : (
                          <div className="space-y-1.5">
                            {vols.map((vol) => (
                              <div key={vol.id} className="space-y-1">
                                <p className="text-xs font-medium leading-tight truncate">{vol.volunteer_name}</p>
                                <p className="text-[10px] text-muted-foreground leading-tight truncate">
                                  {vol.volunteer_type}{vol.prayer_type ? ` - ${vol.prayer_type}` : ""}
                                </p>
                                <StatusBadge status={vol.schedule_status} emailSent={!!vol.schedule_email_sent_at} />
                                <Button
                                  size="sm"
                                  variant="ghost"
                                  onClick={() => sendScheduleEmail(vol)}
                                  disabled={sendingId === vol.id}
                                  className="h-6 px-1.5 text-[10px] w-full justify-start gap-1"
                                >
                                  {sendingId === vol.id ? (
                                    <Loader2Icon className="size-2.5 animate-spin" />
                                  ) : (
                                    <MailIcon className="size-2.5" />
                                  )}
                                  {vol.schedule_email_sent_at ? "Resend" : "Send"}
                                </Button>
                              </div>
                            ))}
                          </div>
                        )}
                      </div>
                    )
                  })}
                </div>
              ))}
            </div>
          </div>

          {volunteers.length === 0 && (
            <div className="text-center py-16 text-muted-foreground">
              <CalendarIcon className="size-10 mx-auto mb-3 opacity-40" />
              <p className="font-medium">No volunteers yet</p>
              <p className="text-sm mt-1">Use the Manage Assignments tab to assign volunteers to sessions.</p>
            </div>
          )}
        </TabsContent>

        {/* MANAGE ASSIGNMENTS TAB */}
        <TabsContent value="manage" className="space-y-4 mt-6">
          {/* Search */}
          <div className="relative">
            <SearchIcon className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-muted-foreground" />
            <Input
              placeholder="Search by name or volunteer type..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-9"
            />
          </div>

          {unscheduledVolunteers.length > 0 && (
            <div className="p-3 bg-amber-50 border border-amber-200 rounded-lg text-sm text-amber-800">
              {unscheduledVolunteers.length} volunteer{unscheduledVolunteers.length !== 1 ? "s" : ""} still need a schedule assignment.
            </div>
          )}

          {(() => {
            const filtered = volunteers.filter((v) => {
              if (!search.trim()) return true
              const q = search.toLowerCase()
              return (
                v.volunteer_name.toLowerCase().includes(q) ||
                v.volunteer_type.toLowerCase().includes(q) ||
                v.family_last_name?.toLowerCase().includes(q)
              )
            })

            if (filtered.length === 0) {
              return (
                <div className="text-center py-12 text-muted-foreground">
                  <SearchIcon className="size-8 mx-auto mb-2 opacity-40" />
                  <p className="font-medium">No results for "{search}"</p>
                </div>
              )
            }

            // Group by volunteer_type
            const groups: Record<string, Volunteer[]> = {}
            for (const vol of filtered) {
              const key = vol.volunteer_type || "Other"
              if (!groups[key]) groups[key] = []
              groups[key].push(vol)
            }

            return Object.entries(groups).sort(([a], [b]) => a.localeCompare(b)).map(([type, vols]) => (
              <div key={type} className="space-y-2">
                <div className="flex items-center gap-2">
                  <h3 className="text-sm font-semibold text-foreground">{type}</h3>
                  <span className="text-xs text-muted-foreground bg-muted px-2 py-0.5 rounded-full">
                    {vols.length}
                  </span>
                  <div className="flex-1 h-px bg-border" />
                </div>
                {vols.map((vol) => {
                  const personKey = `${vol.volunteer_name}||${vol.registration_id}`
                  const isMulti = multiSignupNames.has(personKey)
                  return (
                  <div key={vol.id} className={`flex items-center justify-between gap-4 p-4 bg-card border rounded-xl ${isMulti ? "border-amber-300 bg-amber-50/50" : ""}`}>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <p className="font-medium text-sm">{vol.volunteer_name}</p>
                        <span className="text-xs text-muted-foreground">{vol.family_last_name} family</span>
                        {isMulti && (
                          <span className="flex items-center gap-1 text-[10px] font-semibold text-amber-700 bg-amber-100 border border-amber-300 px-1.5 py-0.5 rounded-full">
                            <AlertTriangleIcon className="size-2.5" />
                            Multi-signup
                          </span>
                        )}
                        {vol.claimed_lesson_title && (
                          <span className="flex items-center gap-1 text-[10px] font-medium text-amber-900 bg-amber-50 border border-amber-200 px-1.5 py-0.5 rounded-full">
                            <BookOpenIcon className="size-2.5" />
                            {vol.claimed_lesson_title}
                          </span>
                        )}
                        {vol.assigned_date && vol.time_slot && (
                          <StatusBadge status={vol.schedule_status} emailSent={!!vol.schedule_email_sent_at} />
                        )}
                      </div>
                      {vol.assigned_date && vol.time_slot ? (
                        <p className="text-xs text-muted-foreground mt-1 flex items-center gap-1">
                          <CalendarIcon className="size-3" />
                          {EVENT_DAYS.find((d) => d.date === String(vol.assigned_date).substring(0, 10))?.label ?? vol.assigned_date} · {vol.time_slot}
                        </p>
                      ) : (
                        <p className="text-xs text-amber-600 mt-1">No schedule assigned</p>
                      )}
                    </div>
                    <div className="flex items-center gap-2">
                      {vol.assigned_date && (
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => resetVolunteer(vol)}
                          disabled={resettingId === vol.id}
                          className="text-muted-foreground hover:text-destructive gap-1"
                        >
                          {resettingId === vol.id ? (
                            <Loader2Icon className="size-3 animate-spin" />
                          ) : (
                            <RotateCcwIcon className="size-3" />
                          )}
                          Reset
                        </Button>
                      )}
                      <Button
                        size="sm"
                        variant={vol.assigned_date ? "outline" : "default"}
                        onClick={() => {
                          setSelectedVolunteer(vol)
                          setScheduleDialogOpen(true)
                        }}
                      >
                        {vol.assigned_date ? "Edit" : "Assign"}
                      </Button>
                    </div>
                  </div>
                  )
                })}
              </div>
            ))
          })()}

          {volunteers.length === 0 && !search && (
            <div className="text-center py-16 text-muted-foreground">
              <UsersIcon className="size-10 mx-auto mb-3 opacity-40" />
              <p className="font-medium">No volunteers yet</p>
              <p className="text-sm mt-1">Volunteers will appear here once families register and sign up.</p>
            </div>
          )}
        </TabsContent>
        {/* BY PERSON TAB */}
        <TabsContent value="byPerson" className="space-y-4 mt-6">
          <div className="relative">
            <SearchIcon className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-muted-foreground" />
            <Input
              placeholder="Search by name or family..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-9"
            />
          </div>

          {multiSignupCount > 0 && (
            <div className="flex items-center gap-2 text-sm text-amber-800 bg-amber-50 border border-amber-200 rounded-lg px-3 py-2">
              <AlertTriangleIcon className="size-4 text-amber-600 shrink-0" />
              <span><strong>{multiSignupCount}</strong> {multiSignupCount === 1 ? "person has" : "people have"} signed up for more than one role — highlighted below.</span>
            </div>
          )}

          {(() => {
            // Group all volunteer rows by person (name + registration_id)
            const personMap: Record<string, Volunteer[]> = {}
            for (const vol of volunteers) {
              const key = `${vol.volunteer_name}||${vol.registration_id}`
              if (!personMap[key]) personMap[key] = []
              personMap[key].push(vol)
            }

            const people = Object.entries(personMap)
              .map(([key, vols]) => ({
                key,
                name: vols[0].volunteer_name,
                family: vols[0].family_last_name,
                registrationId: vols[0].registration_id,
                signups: vols,
                isMulti: vols.length > 1,
              }))
              .filter(({ name, family }) => {
                if (!search.trim()) return true
                const q = search.toLowerCase()
                return name.toLowerCase().includes(q) || family?.toLowerCase().includes(q)
              })
              .sort((a, b) => {
                // Sort multi-signups first, then alphabetically
                if (a.isMulti && !b.isMulti) return -1
                if (!a.isMulti && b.isMulti) return 1
                return a.name.localeCompare(b.name)
              })

            if (people.length === 0) {
              return (
                <div className="text-center py-12 text-muted-foreground">
                  <SearchIcon className="size-8 mx-auto mb-2 opacity-40" />
                  <p className="font-medium">No results for "{search}"</p>
                </div>
              )
            }

            return (
              <div className="space-y-3">
                {people.map(({ key, name, family, signups, isMulti }) => (
                  <div
                    key={key}
                    className={`border rounded-xl overflow-hidden ${isMulti ? "border-amber-300" : "border-border"}`}
                  >
                    {/* Person header */}
                    <div className={`flex items-center gap-3 px-4 py-3 ${isMulti ? "bg-amber-50" : "bg-muted/30"}`}>
                      <div className="flex items-center justify-center size-8 rounded-full bg-background border font-semibold text-sm shrink-0">
                        {name.charAt(0).toUpperCase()}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 flex-wrap">
                          <p className="font-semibold text-sm">{name}</p>
                          <span className="text-xs text-muted-foreground">{family} family</span>
                          {isMulti && (
                            <span className="flex items-center gap-1 text-[10px] font-bold text-amber-700 bg-amber-100 border border-amber-300 px-1.5 py-0.5 rounded-full">
                              <AlertTriangleIcon className="size-2.5" />
                              {signups.length} signups
                            </span>
                          )}
                        </div>
                      </div>
                    </div>

                    {/* Signup rows */}
                    <div className="divide-y">
                      {signups.map((vol) => (
                        <div key={vol.id} className="flex items-center justify-between gap-3 px-4 py-3 bg-card">
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2 flex-wrap">
                              <span className="text-sm font-medium">{vol.volunteer_type}</span>
                              {vol.claimed_lesson_title && (
                                <span className="flex items-center gap-1 text-[10px] font-medium text-amber-900 bg-amber-50 border border-amber-200 px-1.5 py-0.5 rounded-full">
                                  <BookOpenIcon className="size-2.5" />
                                  {vol.claimed_lesson_title}
                                </span>
                              )}
                              <StatusBadge status={vol.schedule_status} emailSent={!!vol.schedule_email_sent_at} />
                            </div>
                            {vol.assigned_date && vol.time_slot ? (
                              <p className="text-xs text-muted-foreground mt-0.5 flex items-center gap-1">
                                <CalendarIcon className="size-3" />
                                {EVENT_DAYS.find((d) => d.date === String(vol.assigned_date).substring(0, 10))?.label ?? vol.assigned_date} · {vol.time_slot}
                              </p>
                            ) : (
                              <p className="text-xs text-amber-600 mt-0.5">No schedule assigned</p>
                            )}
                          </div>
                          <div className="flex items-center gap-2 shrink-0">
                            {vol.assigned_date && (
                              <Button
                                size="sm"
                                variant="ghost"
                                onClick={() => resetVolunteer(vol)}
                                disabled={resettingId === vol.id}
                                className="text-muted-foreground hover:text-destructive gap-1 h-7 px-2 text-xs"
                              >
                                {resettingId === vol.id ? <Loader2Icon className="size-3 animate-spin" /> : <RotateCcwIcon className="size-3" />}
                                Reset
                              </Button>
                            )}
                            <Button
                              size="sm"
                              variant={vol.assigned_date ? "outline" : "default"}
                              className="h-7 px-2 text-xs"
                              onClick={() => {
                                setSelectedVolunteer(vol)
                                setScheduleDialogOpen(true)
                              }}
                            >
                              {vol.assigned_date ? "Edit" : "Assign"}
                            </Button>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            )
          })()}

          {volunteers.length === 0 && (
            <div className="text-center py-16 text-muted-foreground">
              <UserIcon className="size-10 mx-auto mb-3 opacity-40" />
              <p className="font-medium">No volunteers yet</p>
            </div>
          )}
        </TabsContent>
      </Tabs>

      {selectedVolunteer && (
        <VolunteerScheduleDialog
          open={scheduleDialogOpen}
          onOpenChange={setScheduleDialogOpen}
          volunteer={selectedVolunteer}
          onSave={() => {
            fetchVolunteers()
            setScheduleDialogOpen(false)
          }}
        />
      )}
    </div>
  )
}
