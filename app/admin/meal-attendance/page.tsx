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
  SaveIcon,
  PlusIcon,
} from "lucide-react"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Label } from "@/components/ui/label"
import { Input } from "@/components/ui/input"
import Link from "next/link"

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
  { key: "monday_dinner", label: "Mon D", fullLabel: "Monday Dinner" },
  { key: "tuesday_breakfast", label: "Tue B", fullLabel: "Tuesday Breakfast" },
  { key: "tuesday_lunch", label: "Tue L", fullLabel: "Tuesday Lunch" },
  { key: "tuesday_dinner", label: "Tue D", fullLabel: "Tuesday Dinner" },
  { key: "wednesday_breakfast", label: "Wed B", fullLabel: "Wednesday Breakfast" },
  { key: "wednesday_lunch", label: "Wed L", fullLabel: "Wednesday Lunch" },
  { key: "wednesday_dinner", label: "Wed D", fullLabel: "Wednesday Dinner" },
  { key: "thursday_breakfast", label: "Thu B", fullLabel: "Thursday Breakfast" },
  { key: "thursday_lunch", label: "Thu L", fullLabel: "Thursday Lunch" },
  { key: "thursday_dinner", label: "Thu D", fullLabel: "Thursday Dinner" },
  { key: "friday_breakfast", label: "Fri B", fullLabel: "Friday Breakfast" },
  { key: "friday_lunch", label: "Fri L", fullLabel: "Friday Lunch" },
] as const

type MealKey = typeof MEALS[number]["key"]

export default function MealAttendancePage() {
  const [passes, setPasses] = useState<DriveInPass[]>([])
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState<number | null>(null)
  const [addDialogOpen, setAddDialogOpen] = useState(false)
  const [newFamily, setNewFamily] = useState({ family_name: "", contact_name: "", num_adults: 1, num_children: 0 })
  const [addingSaving, setAddingSaving] = useState(false)
  const { toast } = useToast()

  const fetchPasses = useCallback(async () => {
    try {
      const res = await fetch("/api/drivein-passes")
      const data = await res.json()
      setPasses(Array.isArray(data) ? data : [])
    } catch {
      toast({ title: "Error", description: "Failed to load data", variant: "destructive" })
    } finally {
      setLoading(false)
    }
  }, [toast])

  useEffect(() => {
    fetchPasses()
  }, [fetchPasses])

  const toggleMeal = async (pass: DriveInPass, mealKey: MealKey) => {
    const newValue = !pass[mealKey]
    
    // Optimistic update
    setPasses(prev => prev.map(p => 
      p.id === pass.id ? { ...p, [mealKey]: newValue } : p
    ))

    setSaving(pass.id)
    try {
      const res = await fetch(`/api/drivein-passes/${pass.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...pass, [mealKey]: newValue }),
      })

      if (!res.ok) {
        // Revert on error
        setPasses(prev => prev.map(p => 
          p.id === pass.id ? { ...p, [mealKey]: !newValue } : p
        ))
        toast({ title: "Error", description: "Failed to update", variant: "destructive" })
      }
    } catch {
      // Revert on error
      setPasses(prev => prev.map(p => 
        p.id === pass.id ? { ...p, [mealKey]: !newValue } : p
      ))
      toast({ title: "Error", description: "Failed to update", variant: "destructive" })
    } finally {
      setSaving(null)
    }
  }

  const addQuickFamily = async () => {
    if (!newFamily.family_name.trim()) {
      toast({ title: "Error", description: "Family name is required", variant: "destructive" })
      return
    }

    setAddingSaving(true)
    try {
      const res = await fetch("/api/drivein-passes", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...newFamily,
          contact_name: newFamily.contact_name || newFamily.family_name,
          monday_dinner: false,
          tuesday_breakfast: false,
          tuesday_lunch: false,
          tuesday_dinner: false,
          wednesday_breakfast: false,
          wednesday_lunch: false,
          wednesday_dinner: false,
          thursday_breakfast: false,
          thursday_lunch: false,
          thursday_dinner: false,
          friday_breakfast: false,
          friday_lunch: false,
        }),
      })

      if (res.ok) {
        toast({ title: "Added", description: `${newFamily.family_name} family added` })
        setAddDialogOpen(false)
        setNewFamily({ family_name: "", contact_name: "", num_adults: 1, num_children: 0 })
        fetchPasses()
      } else {
        toast({ title: "Error", description: "Failed to add family", variant: "destructive" })
      }
    } catch {
      toast({ title: "Error", description: "Failed to add family", variant: "destructive" })
    } finally {
      setAddingSaving(false)
    }
  }

  // Calculate meal totals
  const mealTotals: Record<MealKey, number> = {
    monday_dinner: 0,
    tuesday_breakfast: 0,
    tuesday_lunch: 0,
    tuesday_dinner: 0,
    wednesday_breakfast: 0,
    wednesday_lunch: 0,
    wednesday_dinner: 0,
    thursday_breakfast: 0,
    thursday_lunch: 0,
    thursday_dinner: 0,
    friday_breakfast: 0,
    friday_lunch: 0,
  }

  passes.forEach((pass) => {
    const people = pass.num_adults + pass.num_children
    MEALS.forEach((meal) => {
      if (pass[meal.key]) {
        mealTotals[meal.key] += people
      }
    })
  })

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2Icon className="size-8 animate-spin text-muted-foreground" />
      </div>
    )
  }

  return (
    <div className="p-4 md:p-6 max-w-7xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex items-center gap-4">
        <Link href="/admin">
          <Button variant="ghost" size="sm" className="gap-2">
            <ArrowLeftIcon className="size-4" />
            Back
          </Button>
        </Link>
        <div className="flex-1">
          <h1 className="text-2xl font-bold flex items-center gap-2">
            <UtensilsIcon className="size-6" />
            Meal Attendance Grid
          </h1>
          <p className="text-sm text-muted-foreground mt-0.5">
            Click checkboxes to toggle meal attendance
          </p>
        </div>
        <Button onClick={() => setAddDialogOpen(true)} className="gap-2">
          <PlusIcon className="size-4" />
          Add Family
        </Button>
      </div>

      {/* Grid Card */}
      <Card>
        <CardHeader>
          <CardTitle>Drive-In Pass Meal Grid</CardTitle>
          <CardDescription>
            {passes.length} families - Click to toggle attendance
          </CardDescription>
        </CardHeader>
        <CardContent>
          {passes.length === 0 ? (
            <div className="text-center py-12 text-muted-foreground">
              <UtensilsIcon className="size-12 mx-auto mb-3 opacity-30" />
              <p>No drive-in families yet</p>
              <Button onClick={() => setAddDialogOpen(true)} variant="outline" className="mt-4 gap-2">
                <PlusIcon className="size-4" />
                Add First Family
              </Button>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b bg-muted/50">
                    <th className="text-left p-2 font-medium sticky left-0 bg-muted/50 min-w-[150px]">Family</th>
                    <th className="text-center p-2 font-medium min-w-[40px]">#</th>
                    {MEALS.map((meal) => (
                      <th key={meal.key} className="text-center p-1 font-medium min-w-[50px]">
                        <span className="text-xs">{meal.label}</span>
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {passes.map((pass) => (
                    <tr key={pass.id} className="border-b hover:bg-muted/30">
                      <td className="p-2 font-medium sticky left-0 bg-background">
                        <div>{pass.family_name}</div>
                        <div className="text-xs text-muted-foreground">{pass.contact_name}</div>
                      </td>
                      <td className="text-center p-2">
                        <Badge variant="outline" className="text-xs">
                          {pass.num_adults + pass.num_children}
                        </Badge>
                      </td>
                      {MEALS.map((meal) => (
                        <td key={meal.key} className="text-center p-1">
                          <Checkbox
                            checked={pass[meal.key]}
                            onCheckedChange={() => toggleMeal(pass, meal.key)}
                            disabled={saving === pass.id}
                            className="mx-auto"
                          />
                        </td>
                      ))}
                    </tr>
                  ))}
                  {/* Totals Row */}
                  <tr className="bg-muted/50 font-semibold border-t-2">
                    <td className="p-2 sticky left-0 bg-muted/50">TOTALS</td>
                    <td className="text-center p-2">
                      {passes.reduce((sum, p) => sum + p.num_adults + p.num_children, 0)}
                    </td>
                    {MEALS.map((meal) => (
                      <td key={meal.key} className="text-center p-1">
                        <Badge variant={mealTotals[meal.key] > 0 ? "default" : "secondary"} className="text-xs">
                          {mealTotals[meal.key]}
                        </Badge>
                      </td>
                    ))}
                  </tr>
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Quick Add Dialog */}
      <Dialog open={addDialogOpen} onOpenChange={setAddDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Quick Add Family</DialogTitle>
            <DialogDescription>
              Add a new drive-in family, then check their meals in the grid
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="family_name">Family Name *</Label>
              <Input
                id="family_name"
                value={newFamily.family_name}
                onChange={(e) => setNewFamily({ ...newFamily, family_name: e.target.value })}
                placeholder="Smith"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="contact_name">Contact Name</Label>
              <Input
                id="contact_name"
                value={newFamily.contact_name}
                onChange={(e) => setNewFamily({ ...newFamily, contact_name: e.target.value })}
                placeholder="John Smith"
              />
            </div>
            <div className="grid gap-4 grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="num_adults">Adults</Label>
                <Input
                  id="num_adults"
                  type="number"
                  min="0"
                  value={newFamily.num_adults}
                  onChange={(e) => setNewFamily({ ...newFamily, num_adults: parseInt(e.target.value) || 0 })}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="num_children">Children</Label>
                <Input
                  id="num_children"
                  type="number"
                  min="0"
                  value={newFamily.num_children}
                  onChange={(e) => setNewFamily({ ...newFamily, num_children: parseInt(e.target.value) || 0 })}
                />
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setAddDialogOpen(false)}>Cancel</Button>
            <Button onClick={addQuickFamily} disabled={addingSaving} className="gap-2">
              {addingSaving ? <Loader2Icon className="size-4 animate-spin" /> : <SaveIcon className="size-4" />}
              Add Family
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
