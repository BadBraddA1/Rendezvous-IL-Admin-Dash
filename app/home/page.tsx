"use client"

import { useEffect, useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { UsersIcon, HomeIcon, TentIcon, BuildingIcon, CalendarIcon, ClockIcon } from "lucide-react"

interface CheckedInFamily {
  id: number
  family_last_name: string
  father_signature: string | null
  lodging_type: string | null
  checked_in_at: string
  family_member_count: number
}

interface Stats {
  total_checked_in: number
  total_people_on_site: number
}

interface ScheduleEntry {
  volunteer_name: string
  volunteer_type: string
  assigned_date: string
  time_slot: string
  prayer_type: string | null
  notes: string | null
  schedule_status: string | null
  claimed_lesson_title: string | null
}

// Custom sort order for schedule display:
// Opening Prayer -> Song Leader A -> Song Leader B -> Reading Scripture A -> Presenting A -> Reading Scripture B -> Presenting B -> Closing Prayer
function getVolunteerSortOrder(entry: ScheduleEntry): number {
  const type = entry.volunteer_type
  const order = entry.prayer_type // "A", "B", "Opening Prayer", "Closing Prayer", or null

  if (type === "Leading prayer") {
    if (order === "Opening Prayer") return 0
    if (order === "Closing Prayer") return 100
    return 50
  }
  if (type === "Leading singing") {
    if (order === "A") return 10
    if (order === "B") return 11
    return 12
  }
  if (type === "Reading scripture") {
    if (order === "A") return 20
    if (order === "B") return 40
    return 25
  }
  if (type === "Presenting a lesson") {
    if (order === "A") return 30
    if (order === "B") return 50
    return 35
  }
  return 200
}

function sortScheduleEntries(entries: ScheduleEntry[]): ScheduleEntry[] {
  return [...entries].sort((a, b) => {
    const orderA = getVolunteerSortOrder(a)
    const orderB = getVolunteerSortOrder(b)
    if (orderA !== orderB) return orderA - orderB
    return a.volunteer_name.localeCompare(b.volunteer_name)
  })
}

const EVENT_DAYS = [
  { date: "2026-05-04", label: "Monday, May 4" },
  { date: "2026-05-05", label: "Tuesday, May 5" },
  { date: "2026-05-06", label: "Wednesday, May 6" },
  { date: "2026-05-07", label: "Thursday, May 7" },
  { date: "2026-05-08", label: "Friday, May 8" },
]
const TIME_SLOTS = ["Morning Devotion", "Evening Devotion"]

export default function HomePage() {
  const [families, setFamilies] = useState<CheckedInFamily[]>([])
  const [stats, setStats] = useState<Stats | null>(null)
  const [loading, setLoading] = useState(true)
  const [schedule, setSchedule] = useState<ScheduleEntry[]>([])
  const [schedulePublished, setSchedulePublished] = useState(false)

  const fetchCheckedIn = async () => {
    try {
      const response = await fetch("/api/registrations/checked-in")
      const data = await response.json()
      
      if (Array.isArray(data)) {
        setFamilies(data)
        
        // Calculate stats
        const totalPeople = data.reduce((sum: number, f: CheckedInFamily) => sum + (Number(f.family_member_count) || 1), 0)
        setStats({
          total_checked_in: data.length,
          total_people_on_site: totalPeople,
        })
      }
    } catch (error) {
      console.error("Error fetching checked-in families:", error)
    } finally {
      setLoading(false)
    }
  }

  const fetchSchedule = async () => {
    try {
      const res = await fetch("/api/public/schedule")
      const data = await res.json()
      setSchedulePublished(!!data.published)
      setSchedule(Array.isArray(data.schedule) ? data.schedule : [])
    } catch {
      // silently fail
    }
  }

  useEffect(() => {
    fetchCheckedIn()
    fetchSchedule()
    const interval = setInterval(() => {
      fetchCheckedIn()
      fetchSchedule()
    }, 30000)
    return () => clearInterval(interval)
  }, [])

  const getLodgingIcon = (type: string | null) => {
    if (!type) return <HomeIcon className="size-4" />
    const lowerType = type.toLowerCase()
    if (lowerType.includes("cabin")) return <HomeIcon className="size-4" />
    if (lowerType.includes("tent") || lowerType.includes("rv")) return <TentIcon className="size-4" />
    if (lowerType.includes("motel") || lowerType.includes("hotel")) return <BuildingIcon className="size-4" />
    return <HomeIcon className="size-4" />
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-amber-50 to-white flex items-center justify-center">
        <div className="text-center">
          <div className="size-12 mx-auto mb-4 animate-spin rounded-full border-4 border-primary border-t-transparent" />
          <p className="text-muted-foreground">Loading...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-amber-50 to-white">
      {/* Header */}
      <div className="bg-amber-800 text-white py-8 px-4">
        <div className="max-w-4xl mx-auto text-center">
          <h1 className="text-3xl md:text-4xl font-bold mb-2">Rendezvous 2026</h1>
          <p className="text-amber-200">May 4-8, 2026 - Lake Williamson Christian Center</p>
        </div>
      </div>

      {/* Stats */}
      <div className="max-w-4xl mx-auto px-4 -mt-6">
        <div className="grid grid-cols-2 gap-4">
          <Card className="bg-white shadow-lg border-0">
            <CardContent className="p-6 text-center">
              <div className="text-4xl font-bold text-amber-800">{stats?.total_checked_in || 0}</div>
              <p className="text-sm text-muted-foreground mt-1">Families Checked In</p>
            </CardContent>
          </Card>
          <Card className="bg-white shadow-lg border-0">
            <CardContent className="p-6 text-center">
              <div className="text-4xl font-bold text-amber-800">{stats?.total_people_on_site || 0}</div>
              <p className="text-sm text-muted-foreground mt-1">People On Site</p>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Families List */}
      <div className="max-w-4xl mx-auto px-4 py-8">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <UsersIcon className="size-5" />
              Families On Site
            </CardTitle>
            <CardDescription>
              {families.length === 0 
                ? "No families have checked in yet" 
                : `${families.length} ${families.length === 1 ? "family" : "families"} currently checked in`}
            </CardDescription>
          </CardHeader>
          <CardContent>
            {families.length === 0 ? (
              <div className="text-center py-12 text-muted-foreground">
                <UsersIcon className="size-12 mx-auto mb-4 opacity-50" />
                <p>Waiting for families to check in...</p>
              </div>
            ) : (
              <div className="grid gap-3 sm:grid-cols-2 md:grid-cols-3">
                {families.map((family) => {
                  const isDuplicate = families.filter(
                    (f) => f.family_last_name === family.family_last_name
                  ).length > 1
                  const displayName = isDuplicate && family.father_signature
                    ? `${family.father_signature} ${family.family_last_name}`
                    : family.family_last_name
                  return (
                  <div
                    key={family.id}
                    className="flex items-center gap-3 p-3 rounded-lg bg-muted/50 hover:bg-muted transition-colors"
                  >
                    <div className="flex-1 min-w-0">
                      <p className="font-medium truncate">{displayName}</p>
                      <div className="flex items-center gap-2 text-xs text-muted-foreground mt-1">
                        <span>{Number(family.family_member_count) || 1} {(Number(family.family_member_count) || 1) === 1 ? "person" : "people"}</span>
                        {family.lodging_type && (
                          <>
                            <span>-</span>
                            <span className="flex items-center gap-1">
                              {getLodgingIcon(family.lodging_type)}
                              {family.lodging_type}
                            </span>
                          </>
                        )}
                      </div>
                    </div>
                  </div>
                  )
                })}
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Volunteer Schedule */}
      {schedulePublished && schedule.length > 0 && (
        <div className="max-w-4xl mx-auto px-4 pb-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <CalendarIcon className="size-5" />
                Volunteer Schedule
              </CardTitle>
              <CardDescription>Devotional assignments for Rendezvous 2026</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              {EVENT_DAYS.map((day) => {
                const dayEntries = schedule.filter(
                  (e) => String(e.assigned_date).substring(0, 10) === day.date
                )
                if (dayEntries.length === 0) return null
                return (
                  <div key={day.date}>
                    <h3 className="text-sm font-semibold text-amber-800 mb-2">{day.label}</h3>
                    <div className="space-y-2">
                      {TIME_SLOTS.map((slot) => {
                        const slotEntries = sortScheduleEntries(dayEntries.filter((e) => e.time_slot === slot))
                        if (slotEntries.length === 0) return null
                        return (
                          <div key={slot} className="flex gap-3 p-3 rounded-lg bg-muted/50">
                            <div className="flex items-center gap-1 text-xs text-muted-foreground min-w-[110px] shrink-0">
                              <ClockIcon className="size-3" />
                              {slot}
                            </div>
                            <div className="flex flex-wrap gap-2">
                              {slotEntries.map((entry, i) => {
                                // Build the role label with A/B or Opening/Closing Prayer
                                let roleLabel = entry.volunteer_type
                                if (entry.prayer_type === "A" || entry.prayer_type === "B") {
                                  roleLabel = `[${entry.prayer_type}] ${entry.volunteer_type}`
                                } else if (entry.prayer_type === "Opening Prayer" || entry.prayer_type === "Closing Prayer") {
                                  roleLabel = entry.prayer_type
                                }
                                return (
                                  <div key={i} className="text-sm">
                                    <span className="font-medium">{entry.volunteer_name}</span>
                                    <span className="text-muted-foreground ml-1 text-xs">
                                      — {roleLabel}
                                      {entry.claimed_lesson_title && ` (${entry.claimed_lesson_title})`}
                                    </span>
                                  </div>
                                )
                              })}
                            </div>
                          </div>
                        )
                      })}
                    </div>
                  </div>
                )
              })}
            </CardContent>
          </Card>
        </div>
      )}

      {/* Footer */}
      <div className="text-center py-6 text-sm text-muted-foreground">
        <p>Auto-refreshes every 30 seconds</p>
      </div>
    </div>
  )
}
