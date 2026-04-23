"use client"

import { useState, useEffect, useCallback } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Checkbox } from "@/components/ui/checkbox"
import { useToast } from "@/hooks/use-toast"
import {
  ArrowLeftIcon,
  Loader2Icon,
  UtensilsIcon,
  UsersIcon,
  CarIcon,
  RefreshCwIcon,
} from "lucide-react"
import Link from "next/link"

interface FamilyMember {
  id: number
  registration_id: number
  first_name: string
  last_name: string
  age: number | null
  family_last_name: string
  lodging_type: string
  arrival_notes: string | null
  monday_dinner: boolean
  tuesday_breakfast: boolean
  tuesday_lunch: boolean
  tuesday_dinner: boolean
  wednesday_breakfast: boolean
  wednesday_lunch: boolean
  wednesday_dinner: boolean
  thursday_breakfast: boolean
  thursday_lunch: boolean
  thursday_dinner: boolean
  friday_breakfast: boolean
  friday_lunch: boolean
}

interface DriveInPass {
  id: number
  family_name: string
  contact_name: string
  num_adults: number
  num_children: number
  monday_dinner: boolean
  tuesday_breakfast: boolean
  tuesday_lunch: boolean
  tuesday_dinner: boolean
  wednesday_breakfast: boolean
  wednesday_lunch: boolean
  wednesday_dinner: boolean
  thursday_breakfast: boolean
  thursday_lunch: boolean
  thursday_dinner: boolean
  friday_breakfast: boolean
  friday_lunch: boolean
}

const MEALS = [
  { key: "monday_dinner", label: "Mon D" },
  { key: "tuesday_breakfast", label: "Tue B" },
  { key: "tuesday_lunch", label: "Tue L" },
  { key: "tuesday_dinner", label: "Tue D" },
  { key: "wednesday_breakfast", label: "Wed B" },
  { key: "wednesday_lunch", label: "Wed L" },
  { key: "wednesday_dinner", label: "Wed D" },
  { key: "thursday_breakfast", label: "Thu B" },
  { key: "thursday_lunch", label: "Thu L" },
  { key: "thursday_dinner", label: "Thu D" },
  { key: "friday_breakfast", label: "Fri B" },
  { key: "friday_lunch", label: "Fri L" },
] as const

type MealKey = typeof MEALS[number]["key"]

export default function MealAttendancePage() {
  const [familyMembers, setFamilyMembers] = useState<FamilyMember[]>([])
  const [driveInPasses, setDriveInPasses] = useState<DriveInPass[]>([])
  const [loading, setLoading] = useState(true)
  const [filter, setFilter] = useState<"all" | "lodging" | "drivein">("all")
  const [saving, setSaving] = useState<string | null>(null)
  const { toast } = useToast()

  const fetchData = useCallback(async () => {
    setLoading(true)
    try {
      const [fmRes, diRes] = await Promise.all([
        fetch("/api/meal-attendance/family-members"),
        fetch("/api/drivein-passes"),
      ])

      if (fmRes.ok) {
        const data = await fmRes.json()
        setFamilyMembers(Array.isArray(data) ? data : [])
      }

      if (diRes.ok) {
        const data = await diRes.json()
        setDriveInPasses(Array.isArray(data) ? data : [])
      }
    } catch {
      toast({ title: "Error", description: "Failed to load data", variant: "destructive" })
    } finally {
      setLoading(false)
    }
  }, [toast])

  useEffect(() => {
    fetchData()
  }, [fetchData])

  const toggleFamilyMemberMeal = async (member: FamilyMember, mealKey: MealKey) => {
    const newValue = !(member[mealKey] ?? true)
    const saveKey = `fm-${member.id}`

    // Optimistic update
    setFamilyMembers(prev => prev.map(fm =>
      fm.id === member.id ? { ...fm, [mealKey]: newValue } : fm
    ))

    setSaving(saveKey)
    try {
      const res = await fetch(`/api/family-members/${member.id}/meals`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          monday_dinner: member.monday_dinner ?? true,
          tuesday_breakfast: member.tuesday_breakfast ?? true,
          tuesday_lunch: member.tuesday_lunch ?? true,
          tuesday_dinner: member.tuesday_dinner ?? true,
          wednesday_breakfast: member.wednesday_breakfast ?? true,
          wednesday_lunch: member.wednesday_lunch ?? true,
          wednesday_dinner: member.wednesday_dinner ?? true,
          thursday_breakfast: member.thursday_breakfast ?? true,
          thursday_lunch: member.thursday_lunch ?? true,
          thursday_dinner: member.thursday_dinner ?? true,
          friday_breakfast: member.friday_breakfast ?? true,
          friday_lunch: member.friday_lunch ?? true,
          [mealKey]: newValue,
        }),
      })

      if (!res.ok) {
        setFamilyMembers(prev => prev.map(fm =>
          fm.id === member.id ? { ...fm, [mealKey]: !newValue } : fm
        ))
        toast({ title: "Error", description: "Failed to update", variant: "destructive" })
      }
    } catch {
      setFamilyMembers(prev => prev.map(fm =>
        fm.id === member.id ? { ...fm, [mealKey]: !newValue } : fm
      ))
      toast({ title: "Error", description: "Failed to update", variant: "destructive" })
    } finally {
      setSaving(null)
    }
  }

  const toggleDriveInMeal = async (pass: DriveInPass, mealKey: MealKey) => {
    const newValue = !pass[mealKey]
    const saveKey = `di-${pass.id}`

    // Optimistic update
    setDriveInPasses(prev => prev.map(p =>
      p.id === pass.id ? { ...p, [mealKey]: newValue } : p
    ))

    setSaving(saveKey)
    try {
      const res = await fetch(`/api/drivein-passes/${pass.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...pass, [mealKey]: newValue }),
      })

      if (!res.ok) {
        setDriveInPasses(prev => prev.map(p =>
          p.id === pass.id ? { ...p, [mealKey]: !newValue } : p
        ))
        toast({ title: "Error", description: "Failed to update", variant: "destructive" })
      }
    } catch {
      setDriveInPasses(prev => prev.map(p =>
        p.id === pass.id ? { ...p, [mealKey]: !newValue } : p
      ))
      toast({ title: "Error", description: "Failed to update", variant: "destructive" })
    } finally {
      setSaving(null)
    }
  }

  // Calculate meal totals
  const mealTotals: Record<MealKey, number> = {
    monday_dinner: 0, tuesday_breakfast: 0, tuesday_lunch: 0, tuesday_dinner: 0,
    wednesday_breakfast: 0, wednesday_lunch: 0, wednesday_dinner: 0,
    thursday_breakfast: 0, thursday_lunch: 0, thursday_dinner: 0,
    friday_breakfast: 0, friday_lunch: 0,
  }

  // Count lodging family members
  familyMembers.forEach(fm => {
    MEALS.forEach(meal => {
      if (fm[meal.key] ?? true) mealTotals[meal.key]++
    })
  })

  // Count drive-in passes (multiply by number of people)
  driveInPasses.forEach(pass => {
    const people = (pass.num_adults || 0) + (pass.num_children || 0)
    MEALS.forEach(meal => {
      if (pass[meal.key]) mealTotals[meal.key] += people
    })
  })

  const filteredFamilyMembers = filter === "drivein" ? [] : familyMembers
  const filteredDriveIn = filter === "lodging" ? [] : driveInPasses

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2Icon className="size-8 animate-spin text-muted-foreground" />
      </div>
    )
  }

  return (
    <div className="p-4 md:p-6 max-w-[1800px] mx-auto space-y-4">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center gap-4">
        <div className="flex items-center gap-4">
          <Link href="/admin">
            <Button variant="ghost" size="sm" className="gap-2">
              <ArrowLeftIcon className="size-4" />
              Back
            </Button>
          </Link>
          <div>
            <h1 className="text-2xl font-bold flex items-center gap-2">
              <UtensilsIcon className="size-6" />
              Meal Attendance Grid
            </h1>
            <p className="text-sm text-muted-foreground">
              Click checkboxes to toggle - Lodging guests default to all meals
            </p>
          </div>
        </div>
        <div className="flex gap-2 sm:ml-auto">
          <Button variant="outline" size="sm" onClick={fetchData} disabled={loading}>
            <RefreshCwIcon className={`size-4 mr-2 ${loading ? "animate-spin" : ""}`} />
            Refresh
          </Button>
        </div>
      </div>

      {/* Filter Tabs */}
      <div className="flex gap-2 flex-wrap">
        <Button
          variant={filter === "all" ? "default" : "outline"}
          size="sm"
          onClick={() => setFilter("all")}
        >
          All ({familyMembers.length + driveInPasses.length})
        </Button>
        <Button
          variant={filter === "lodging" ? "default" : "outline"}
          size="sm"
          onClick={() => setFilter("lodging")}
          className="gap-1"
        >
          <UsersIcon className="size-4" />
          Lodging ({familyMembers.length})
        </Button>
        <Button
          variant={filter === "drivein" ? "default" : "outline"}
          size="sm"
          onClick={() => setFilter("drivein")}
          className="gap-1"
        >
          <CarIcon className="size-4" />
          Drive-In ({driveInPasses.length})
        </Button>
      </div>

      {/* Totals Summary */}
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-sm">Meal Totals (All Attendees)</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-6 sm:grid-cols-12 gap-2 text-center">
            {MEALS.map(meal => (
              <div key={meal.key} className="bg-muted rounded p-2">
                <div className="text-xs font-medium">{meal.label}</div>
                <div className="text-lg font-bold text-primary">{mealTotals[meal.key]}</div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Main Grid */}
      <Card>
        <CardHeader className="pb-2">
          <CardTitle>Attendance Grid</CardTitle>
          <CardDescription>
            {filteredFamilyMembers.length + filteredDriveIn.length} entries shown
          </CardDescription>
        </CardHeader>
        <CardContent className="p-0">
          <div className="overflow-x-auto max-h-[70vh] overflow-y-auto">
            <table className="w-full text-sm">
              <thead className="sticky top-0 z-10">
                <tr className="border-b bg-muted">
                  <th className="text-left p-2 font-medium sticky left-0 bg-muted min-w-[180px] z-20">Name</th>
                  <th className="text-left p-2 font-medium min-w-[80px] bg-muted">Type</th>
                  <th className="text-left p-2 font-medium min-w-[150px] bg-muted">Notes</th>
                  {MEALS.map(meal => (
                    <th key={meal.key} className="text-center p-1 font-medium min-w-[45px] bg-muted">
                      <span className="text-xs">{meal.label}</span>
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {/* Lodging Family Members */}
                {filteredFamilyMembers.map((fm, idx) => (
                  <tr key={`fm-${fm.id}`} className={idx % 2 === 0 ? "bg-background" : "bg-muted/20"}>
                    <td className="p-2 sticky left-0 bg-inherit">
                      <div className="font-medium">{fm.first_name} {fm.last_name}</div>
                      <div className="text-xs text-muted-foreground">{fm.family_last_name}</div>
                    </td>
                    <td className="p-2">
                      <Badge variant="outline" className="text-xs bg-blue-50 text-blue-700 border-blue-200">
                        {fm.lodging_type || "Lodging"}
                      </Badge>
                    </td>
                    <td className="p-2">
                      {fm.arrival_notes && (
                        <span className="text-xs text-muted-foreground line-clamp-2" title={fm.arrival_notes}>
                          {fm.arrival_notes}
                        </span>
                      )}
                    </td>
                    {MEALS.map(meal => (
                      <td key={meal.key} className="text-center p-1">
                        <Checkbox
                          checked={fm[meal.key] ?? true}
                          onCheckedChange={() => toggleFamilyMemberMeal(fm, meal.key)}
                          disabled={saving === `fm-${fm.id}`}
                          className="mx-auto"
                        />
                      </td>
                    ))}
                  </tr>
                ))}

                {/* Drive-In Passes */}
                {filteredDriveIn.map((pass, idx) => (
                  <tr
                    key={`di-${pass.id}`}
                    className={`${(filteredFamilyMembers.length + idx) % 2 === 0 ? "bg-background" : "bg-muted/20"} bg-teal-50/30`}
                  >
                    <td className="p-2 sticky left-0 bg-inherit">
                      <div className="font-medium">{pass.family_name}</div>
                      <div className="text-xs text-muted-foreground">
                        {pass.num_adults}A + {pass.num_children}C = {pass.num_adults + pass.num_children}
                      </div>
                    </td>
                    <td className="p-2">
                      <Badge variant="outline" className="text-xs bg-teal-50 text-teal-700 border-teal-200">
                        Drive-In
                      </Badge>
                    </td>
                    <td className="p-2">
                      <span className="text-xs text-muted-foreground">
                        {pass.contact_name}
                      </span>
                    </td>
                    {MEALS.map(meal => (
                      <td key={meal.key} className="text-center p-1">
                        <Checkbox
                          checked={pass[meal.key] ?? false}
                          onCheckedChange={() => toggleDriveInMeal(pass, meal.key)}
                          disabled={saving === `di-${pass.id}`}
                          className="mx-auto"
                        />
                      </td>
                    ))}
                  </tr>
                ))}

                {filteredFamilyMembers.length === 0 && filteredDriveIn.length === 0 && (
                  <tr>
                    <td colSpan={15} className="p-8 text-center text-muted-foreground">
                      No attendees found
                    </td>
                  </tr>
                )}

                {/* Totals Row */}
                <tr className="bg-muted font-semibold border-t-2">
                  <td className="p-2 sticky left-0 bg-muted">TOTALS</td>
                  <td className="p-2"></td>
                  <td className="p-2"></td>
                  {MEALS.map(meal => (
                    <td key={meal.key} className="text-center p-1">
                      <Badge variant="default" className="text-xs">
                        {mealTotals[meal.key]}
                      </Badge>
                    </td>
                  ))}
                </tr>
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
