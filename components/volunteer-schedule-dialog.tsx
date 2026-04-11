"use client"

import { useState, useEffect } from "react"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { CalendarIcon } from "lucide-react"
import { useToast } from "@/hooks/use-toast"

interface Volunteer {
  id: number
  volunteer_name: string
  volunteer_type: string
  assigned_date?: string | null
  time_slot?: string | null
  prayer_type?: string | null
  notes?: string | null
}

interface VolunteerScheduleDialogProps {
  volunteer: Volunteer
  // Uncontrolled (trigger button) mode
  onSuccess?: () => void
  // Controlled mode
  open?: boolean
  onOpenChange?: (open: boolean) => void
  onSave?: () => void
}

export function VolunteerScheduleDialog({
  volunteer,
  onSuccess,
  open: controlledOpen,
  onOpenChange,
  onSave,
}: VolunteerScheduleDialogProps) {
  const isControlled = controlledOpen !== undefined
  const [internalOpen, setInternalOpen] = useState(false)
  const open = isControlled ? controlledOpen : internalOpen

  const setOpen = (val: boolean) => {
    if (isControlled) {
      onOpenChange?.(val)
    } else {
      setInternalOpen(val)
    }
  }

  const [assignedDate, setAssignedDate] = useState(volunteer.assigned_date || "unassigned")
  const [baseTimeSlot, setBaseTimeSlot] = useState(volunteer.time_slot || "unassigned")
  const [prayerPosition, setPrayerPosition] = useState(volunteer.prayer_type || "Opening Prayer")
  const [presentationOrder, setPresentationOrder] = useState(volunteer.prayer_type || "A")
  const [notes, setNotes] = useState(volunteer.notes || "")
  const [isSubmitting, setIsSubmitting] = useState(false)
  const { toast } = useToast()

  // Sync state when volunteer changes (controlled mode re-opens for a different person)
  useEffect(() => {
    setAssignedDate(volunteer.assigned_date || "unassigned")
    setBaseTimeSlot(volunteer.time_slot || "unassigned")
    setPrayerPosition(volunteer.prayer_type || "Opening Prayer")
    setPresentationOrder(volunteer.prayer_type || "A")
    setNotes(volunteer.notes || "")
  }, [volunteer.id, volunteer.assigned_date, volunteer.time_slot, volunteer.prayer_type, volunteer.notes])

  const eventDates = [
    { value: "2026-05-04", label: "Monday, May 4" },
    { value: "2026-05-05", label: "Tuesday, May 5" },
    { value: "2026-05-06", label: "Wednesday, May 6" },
    { value: "2026-05-07", label: "Thursday, May 7" },
    { value: "2026-05-08", label: "Friday, May 8" },
  ]

  const handleSubmit = async () => {
    setIsSubmitting(true)
    try {
      const response = await fetch(`/api/volunteers/${volunteer.id}/schedule`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          assigned_date: assignedDate === "unassigned" ? null : assignedDate,
          time_slot: baseTimeSlot === "unassigned" ? null : baseTimeSlot,
          prayer_type: 
            volunteer.volunteer_type === "Leading prayer" && baseTimeSlot !== "unassigned" ? prayerPosition :
            (volunteer.volunteer_type === "Presenting a lesson" || volunteer.volunteer_type === "Leading singing") && baseTimeSlot !== "unassigned" ? presentationOrder :
            null,
          notes: notes || null,
        }),
      })

      if (!response.ok) throw new Error("Failed to update schedule")

      toast({ title: "Schedule Updated", description: "Volunteer schedule has been updated successfully." })
      setOpen(false)
      onSuccess?.()
      onSave?.()
    } catch {
      toast({ title: "Error", description: "Failed to update volunteer schedule.", variant: "destructive" })
    } finally {
      setIsSubmitting(false)
    }
  }

  const dialogContent = (
    <DialogContent>
      <DialogHeader>
        <DialogTitle>Schedule Volunteer</DialogTitle>
      </DialogHeader>
      <div className="space-y-4 py-4">
        <div className="space-y-1">
          <Label>Volunteer</Label>
          <p className="text-sm font-medium">{volunteer.volunteer_name}</p>
          <p className="text-sm text-muted-foreground">{volunteer.volunteer_type}</p>
        </div>

        <div className="space-y-2">
          <Label htmlFor="date">Assigned Date</Label>
          <Select value={assignedDate} onValueChange={setAssignedDate}>
            <SelectTrigger id="date"><SelectValue placeholder="Select a date" /></SelectTrigger>
            <SelectContent>
              <SelectItem value="unassigned">Unassigned</SelectItem>
              {eventDates.map((date) => (
                <SelectItem key={date.value} value={date.value}>{date.label}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="space-y-2">
          <Label htmlFor="time-slot">Time Slot</Label>
          <Select value={baseTimeSlot} onValueChange={setBaseTimeSlot}>
            <SelectTrigger id="time-slot"><SelectValue placeholder="Select time slot" /></SelectTrigger>
            <SelectContent>
              <SelectItem value="unassigned">Unassigned</SelectItem>
              <SelectItem value="Morning Devotion">Morning Devotion</SelectItem>
              <SelectItem value="Evening Devotion">Evening Devotion</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {volunteer.volunteer_type === "Leading prayer" && baseTimeSlot !== "unassigned" && (
          <div className="space-y-2">
            <Label htmlFor="prayer-position">Prayer Position</Label>
            <Select value={prayerPosition} onValueChange={setPrayerPosition}>
              <SelectTrigger id="prayer-position"><SelectValue placeholder="Select prayer position" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="Opening Prayer">Opening Prayer</SelectItem>
                <SelectItem value="Closing Prayer">Closing Prayer</SelectItem>
              </SelectContent>
            </Select>
          </div>
        )}

        {(volunteer.volunteer_type === "Presenting a lesson" || volunteer.volunteer_type === "Leading singing") && baseTimeSlot !== "unassigned" && (
          <div className="space-y-2">
            <Label htmlFor="presentation-order">Order</Label>
            <Select value={presentationOrder} onValueChange={setPresentationOrder}>
              <SelectTrigger id="presentation-order"><SelectValue placeholder="Select order" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="A">A - First</SelectItem>
                <SelectItem value="B">B - Second</SelectItem>
              </SelectContent>
            </Select>
          </div>
        )}

        <div className="space-y-2">
          <Label htmlFor="notes">Notes (Optional)</Label>
          <textarea
            id="notes"
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            className="w-full min-h-[80px] rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
            placeholder="Add any notes or special instructions..."
          />
        </div>

        <div className="flex justify-end gap-2">
          <Button variant="outline" onClick={() => setOpen(false)} disabled={isSubmitting}>Cancel</Button>
          <Button onClick={handleSubmit} disabled={isSubmitting}>
            {isSubmitting ? "Saving..." : "Save Schedule"}
          </Button>
        </div>
      </div>
    </DialogContent>
  )

  if (isControlled) {
    return (
      <Dialog open={open} onOpenChange={setOpen}>
        {dialogContent}
      </Dialog>
    )
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" size="sm">
          <CalendarIcon className="mr-2 size-4" />
          {volunteer.assigned_date ? "Edit Schedule" : "Assign Schedule"}
        </Button>
      </DialogTrigger>
      {dialogContent}
    </Dialog>
  )
}
