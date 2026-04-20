"use client"

import { useState, useEffect, useCallback } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { useToast } from "@/hooks/use-toast"
import {
  ArrowLeftIcon,
  PlusIcon,
  Loader2Icon,
  PencilIcon,
  TrashIcon,
  CarIcon,
  UsersIcon,
  UtensilsIcon,
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
import { Checkbox } from "@/components/ui/checkbox"
import { Textarea } from "@/components/ui/textarea"
import Link from "next/link"

interface DriveInPass {
  id: number
  family_name: string
  contact_name: string
  contact_phone: string | null
  contact_email: string | null
  num_adults: number
  num_children: number
  thursday_lunch: boolean
  thursday_dinner: boolean
  friday_breakfast: boolean
  friday_lunch: boolean
  friday_dinner: boolean
  saturday_breakfast: boolean
  saturday_lunch: boolean
  saturday_dinner: boolean
  sunday_breakfast: boolean
  sunday_lunch: boolean
  notes: string | null
  created_at: string
}

const MEALS = [
  { key: "thursday_lunch", label: "Thu Lunch" },
  { key: "thursday_dinner", label: "Thu Dinner" },
  { key: "friday_breakfast", label: "Fri Breakfast" },
  { key: "friday_lunch", label: "Fri Lunch" },
  { key: "friday_dinner", label: "Fri Dinner" },
  { key: "saturday_breakfast", label: "Sat Breakfast" },
  { key: "saturday_lunch", label: "Sat Lunch" },
  { key: "saturday_dinner", label: "Sat Dinner" },
  { key: "sunday_breakfast", label: "Sun Breakfast" },
  { key: "sunday_lunch", label: "Sun Lunch" },
] as const

type MealKey = typeof MEALS[number]["key"]

const emptyForm = {
  family_name: "",
  contact_name: "",
  contact_phone: "",
  contact_email: "",
  num_adults: 0,
  num_children: 0,
  thursday_lunch: false,
  thursday_dinner: false,
  friday_breakfast: false,
  friday_lunch: false,
  friday_dinner: false,
  saturday_breakfast: false,
  saturday_lunch: false,
  saturday_dinner: false,
  sunday_breakfast: false,
  sunday_lunch: false,
  notes: "",
}

export default function DriveInPassesPage() {
  const [passes, setPasses] = useState<DriveInPass[]>([])
  const [loading, setLoading] = useState(true)
  const [dialogOpen, setDialogOpen] = useState(false)
  const [editingPass, setEditingPass] = useState<DriveInPass | null>(null)
  const [form, setForm] = useState(emptyForm)
  const [saving, setSaving] = useState(false)
  const [deleting, setDeleting] = useState<number | null>(null)
  const { toast } = useToast()

  const fetchPasses = useCallback(async () => {
    try {
      const res = await fetch("/api/drivein-passes")
      const data = await res.json()
      setPasses(Array.isArray(data) ? data : [])
    } catch {
      toast({ title: "Error", description: "Failed to load drive-in passes", variant: "destructive" })
    } finally {
      setLoading(false)
    }
  }, [toast])

  useEffect(() => {
    fetchPasses()
  }, [fetchPasses])

  const openAddDialog = () => {
    setEditingPass(null)
    setForm(emptyForm)
    setDialogOpen(true)
  }

  const openEditDialog = (pass: DriveInPass) => {
    setEditingPass(pass)
    setForm({
      family_name: pass.family_name,
      contact_name: pass.contact_name,
      contact_phone: pass.contact_phone || "",
      contact_email: pass.contact_email || "",
      num_adults: pass.num_adults,
      num_children: pass.num_children,
      thursday_lunch: pass.thursday_lunch,
      thursday_dinner: pass.thursday_dinner,
      friday_breakfast: pass.friday_breakfast,
      friday_lunch: pass.friday_lunch,
      friday_dinner: pass.friday_dinner,
      saturday_breakfast: pass.saturday_breakfast,
      saturday_lunch: pass.saturday_lunch,
      saturday_dinner: pass.saturday_dinner,
      sunday_breakfast: pass.sunday_breakfast,
      sunday_lunch: pass.sunday_lunch,
      notes: pass.notes || "",
    })
    setDialogOpen(true)
  }

  const handleSubmit = async () => {
    if (!form.family_name.trim() || !form.contact_name.trim()) {
      toast({ title: "Error", description: "Family name and contact name are required", variant: "destructive" })
      return
    }

    setSaving(true)
    try {
      const url = editingPass ? `/api/drivein-passes/${editingPass.id}` : "/api/drivein-passes"
      const method = editingPass ? "PUT" : "POST"

      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      })

      if (res.ok) {
        toast({ title: "Success", description: editingPass ? "Drive-in pass updated" : "Drive-in pass created" })
        setDialogOpen(false)
        fetchPasses()
      } else {
        const data = await res.json()
        toast({ title: "Error", description: data.error || "Failed to save", variant: "destructive" })
      }
    } catch {
      toast({ title: "Error", description: "Failed to save drive-in pass", variant: "destructive" })
    } finally {
      setSaving(false)
    }
  }

  const handleDelete = async (pass: DriveInPass) => {
    if (!confirm(`Delete drive-in pass for ${pass.family_name}?`)) return

    setDeleting(pass.id)
    try {
      const res = await fetch(`/api/drivein-passes/${pass.id}`, { method: "DELETE" })
      if (res.ok) {
        toast({ title: "Deleted", description: "Drive-in pass has been removed" })
        fetchPasses()
      } else {
        toast({ title: "Error", description: "Failed to delete", variant: "destructive" })
      }
    } catch {
      toast({ title: "Error", description: "Failed to delete drive-in pass", variant: "destructive" })
    } finally {
      setDeleting(null)
    }
  }

  const getMealsCount = (pass: DriveInPass) => {
    return MEALS.filter((m) => pass[m.key]).length
  }

  const getMealsList = (pass: DriveInPass) => {
    return MEALS.filter((m) => pass[m.key]).map((m) => m.label)
  }

  const totalPeople = passes.reduce((sum, p) => sum + p.num_adults + p.num_children, 0)
  const totalAdults = passes.reduce((sum, p) => sum + p.num_adults, 0)
  const totalChildren = passes.reduce((sum, p) => sum + p.num_children, 0)

  // Calculate meal counts
  const mealCounts: Record<MealKey, number> = {
    thursday_lunch: 0,
    thursday_dinner: 0,
    friday_breakfast: 0,
    friday_lunch: 0,
    friday_dinner: 0,
    saturday_breakfast: 0,
    saturday_lunch: 0,
    saturday_dinner: 0,
    sunday_breakfast: 0,
    sunday_lunch: 0,
  }

  passes.forEach((pass) => {
    const people = pass.num_adults + pass.num_children
    MEALS.forEach((meal) => {
      if (pass[meal.key]) {
        mealCounts[meal.key] += people
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
          <h1 className="text-2xl font-bold flex items-center gap-2">
            <CarIcon className="size-6" />
            Drive-In Passes
          </h1>
          <p className="text-sm text-muted-foreground mt-0.5">
            Track families attending meals only (no lodging)
          </p>
        </div>
        <Button onClick={openAddDialog} className="gap-2">
          <PlusIcon className="size-4" />
          Add Pass
        </Button>
      </div>

      {/* Stats Cards */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Total Families</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{passes.length}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Total People</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{totalPeople}</div>
            <p className="text-xs text-muted-foreground mt-1">
              {totalAdults} adults, {totalChildren} children
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium flex items-center gap-1">
              <UtensilsIcon className="size-3" />
              Avg Meals/Family
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {passes.length > 0 ? (passes.reduce((sum, p) => sum + getMealsCount(p), 0) / passes.length).toFixed(1) : 0}
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium flex items-center gap-1">
              <UsersIcon className="size-3" />
              Total Meal Servings
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {Object.values(mealCounts).reduce((a, b) => a + b, 0)}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Meal Breakdown */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <UtensilsIcon className="size-5" />
            Meal Counts (Additional People)
          </CardTitle>
          <CardDescription>Number of extra people for each meal from drive-in passes</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid gap-2 md:grid-cols-5">
            {MEALS.map((meal) => (
              <div key={meal.key} className="flex items-center justify-between p-3 rounded-lg bg-muted/50">
                <span className="text-sm font-medium">{meal.label}</span>
                <Badge variant={mealCounts[meal.key] > 0 ? "default" : "secondary"}>
                  {mealCounts[meal.key]}
                </Badge>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Passes Table */}
      <Card>
        <CardHeader>
          <CardTitle>All Drive-In Passes</CardTitle>
          <CardDescription>{passes.length} familie(s) registered</CardDescription>
        </CardHeader>
        <CardContent>
          {passes.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              <CarIcon className="size-12 mx-auto mb-3 opacity-30" />
              <p>No drive-in passes yet</p>
              <Button onClick={openAddDialog} variant="outline" className="mt-4 gap-2">
                <PlusIcon className="size-4" />
                Add First Pass
              </Button>
            </div>
          ) : (
            <div className="rounded-md border overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Family Name</TableHead>
                    <TableHead>Contact</TableHead>
                    <TableHead>People</TableHead>
                    <TableHead>Meals</TableHead>
                    <TableHead>Notes</TableHead>
                    <TableHead className="w-[100px]">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {passes.map((pass) => (
                    <TableRow key={pass.id}>
                      <TableCell className="font-medium">{pass.family_name}</TableCell>
                      <TableCell>
                        <div className="text-sm">{pass.contact_name}</div>
                        {pass.contact_email && (
                          <div className="text-xs text-muted-foreground">{pass.contact_email}</div>
                        )}
                        {pass.contact_phone && (
                          <div className="text-xs text-muted-foreground">{pass.contact_phone}</div>
                        )}
                      </TableCell>
                      <TableCell>
                        <Badge variant="outline">
                          {pass.num_adults + pass.num_children} total
                        </Badge>
                        <div className="text-xs text-muted-foreground mt-1">
                          {pass.num_adults}A / {pass.num_children}C
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="flex flex-wrap gap-1">
                          {getMealsList(pass).length > 0 ? (
                            getMealsList(pass).map((meal) => (
                              <Badge key={meal} variant="secondary" className="text-xs">
                                {meal}
                              </Badge>
                            ))
                          ) : (
                            <span className="text-xs text-muted-foreground">No meals selected</span>
                          )}
                        </div>
                      </TableCell>
                      <TableCell>
                        <span className="text-xs text-muted-foreground truncate max-w-[150px] block">
                          {pass.notes || "—"}
                        </span>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-1">
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={() => openEditDialog(pass)}
                            className="h-8 w-8 p-0"
                          >
                            <PencilIcon className="size-4" />
                          </Button>
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={() => handleDelete(pass)}
                            disabled={deleting === pass.id}
                            className="h-8 w-8 p-0 text-destructive hover:text-destructive"
                          >
                            {deleting === pass.id ? (
                              <Loader2Icon className="size-4 animate-spin" />
                            ) : (
                              <TrashIcon className="size-4" />
                            )}
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Add/Edit Dialog */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{editingPass ? "Edit Drive-In Pass" : "Add Drive-In Pass"}</DialogTitle>
            <DialogDescription>
              Track a family attending meals only (no lodging)
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            {/* Family Info */}
            <div className="grid gap-4 md:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="family_name">Family Name *</Label>
                <Input
                  id="family_name"
                  value={form.family_name}
                  onChange={(e) => setForm({ ...form, family_name: e.target.value })}
                  placeholder="Smith"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="contact_name">Contact Name *</Label>
                <Input
                  id="contact_name"
                  value={form.contact_name}
                  onChange={(e) => setForm({ ...form, contact_name: e.target.value })}
                  placeholder="John Smith"
                />
              </div>
            </div>

            <div className="grid gap-4 md:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="contact_email">Email</Label>
                <Input
                  id="contact_email"
                  type="email"
                  value={form.contact_email}
                  onChange={(e) => setForm({ ...form, contact_email: e.target.value })}
                  placeholder="john@example.com"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="contact_phone">Phone</Label>
                <Input
                  id="contact_phone"
                  value={form.contact_phone}
                  onChange={(e) => setForm({ ...form, contact_phone: e.target.value })}
                  placeholder="(555) 123-4567"
                />
              </div>
            </div>

            {/* People Count */}
            <div className="grid gap-4 md:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="num_adults">Number of Adults</Label>
                <Input
                  id="num_adults"
                  type="number"
                  min="0"
                  value={form.num_adults}
                  onChange={(e) => setForm({ ...form, num_adults: parseInt(e.target.value) || 0 })}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="num_children">Number of Children</Label>
                <Input
                  id="num_children"
                  type="number"
                  min="0"
                  value={form.num_children}
                  onChange={(e) => setForm({ ...form, num_children: parseInt(e.target.value) || 0 })}
                />
              </div>
            </div>

            {/* Meals Selection */}
            <div className="space-y-3">
              <Label>Meals Attending</Label>
              <div className="grid gap-2 md:grid-cols-2">
                {MEALS.map((meal) => (
                  <div key={meal.key} className="flex items-center space-x-2">
                    <Checkbox
                      id={meal.key}
                      checked={form[meal.key]}
                      onCheckedChange={(checked) =>
                        setForm({ ...form, [meal.key]: checked === true })
                      }
                    />
                    <Label htmlFor={meal.key} className="text-sm font-normal cursor-pointer">
                      {meal.label}
                    </Label>
                  </div>
                ))}
              </div>
            </div>

            {/* Notes */}
            <div className="space-y-2">
              <Label htmlFor="notes">Notes</Label>
              <Textarea
                id="notes"
                value={form.notes}
                onChange={(e) => setForm({ ...form, notes: e.target.value })}
                placeholder="Any additional notes..."
                rows={2}
              />
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setDialogOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleSubmit} disabled={saving}>
              {saving && <Loader2Icon className="size-4 animate-spin mr-2" />}
              {editingPass ? "Update" : "Create"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
