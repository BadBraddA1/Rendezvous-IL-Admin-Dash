"use client"

import type React from "react"

import { useState, useEffect } from "react"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Checkbox } from "@/components/ui/checkbox"
import { useToast } from "@/hooks/use-toast"

interface FamilyMemberDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  registrationId: number
  member?: any
  onSuccess: () => void
}

export function FamilyMemberDialog({ open, onOpenChange, registrationId, member, onSuccess }: FamilyMemberDialogProps) {
  const [loading, setLoading] = useState(false)
  const [formData, setFormData] = useState({
    first_name: "",
    age: "",
    date_of_birth: "",
    is_baptized: false,
    person_cost: "",
  })
  const { toast } = useToast()

  useEffect(() => {
    if (member) {
      setFormData({
        first_name: member.first_name || "",
        age: member.age?.toString() || "",
        date_of_birth: member.date_of_birth ? new Date(member.date_of_birth).toISOString().split("T")[0] : "",
        is_baptized: member.is_baptized || false,
        person_cost: member.person_cost?.toString() || "",
      })
    } else {
      setFormData({
        first_name: "",
        age: "",
        date_of_birth: "",
        is_baptized: false,
        person_cost: "",
      })
    }
  }, [member, open])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)

    try {
      const url = member ? `/api/family-members/${member.id}` : "/api/family-members"
      const method = member ? "PUT" : "POST"

      const response = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          registration_id: registrationId,
          first_name: formData.first_name,
          age: Number.parseInt(formData.age) || null,
          date_of_birth: formData.date_of_birth || null,
          is_baptized: formData.is_baptized,
          person_cost: Number.parseFloat(formData.person_cost) || null,
        }),
      })

      if (response.ok) {
        toast({
          title: "Success",
          description: `Family member ${member ? "updated" : "added"} successfully`,
        })
        onSuccess()
        onOpenChange(false)
      } else {
        throw new Error("Failed to save family member")
      }
    } catch (error) {
      console.error("[v0] Error saving family member:", error)
      toast({
        title: "Error",
        description: "Failed to save family member",
        variant: "destructive",
      })
    } finally {
      setLoading(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>{member ? "Edit" : "Add"} Family Member</DialogTitle>
          <DialogDescription>
            {member ? "Update the family member information" : "Add a new family member to this registration"}
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit}>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="first_name">First Name</Label>
              <Input
                id="first_name"
                value={formData.first_name}
                onChange={(e) => setFormData({ ...formData, first_name: e.target.value })}
                required
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="age">Age</Label>
                <Input
                  id="age"
                  type="number"
                  value={formData.age}
                  onChange={(e) => setFormData({ ...formData, age: e.target.value })}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="date_of_birth">Date of Birth</Label>
                <Input
                  id="date_of_birth"
                  type="date"
                  value={formData.date_of_birth}
                  onChange={(e) => setFormData({ ...formData, date_of_birth: e.target.value })}
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="person_cost">Person Cost ($)</Label>
              <Input
                id="person_cost"
                type="number"
                step="0.01"
                value={formData.person_cost}
                onChange={(e) => setFormData({ ...formData, person_cost: e.target.value })}
              />
            </div>

            <div className="flex items-center space-x-2">
              <Checkbox
                id="is_baptized"
                checked={formData.is_baptized}
                onCheckedChange={(checked) => setFormData({ ...formData, is_baptized: checked as boolean })}
              />
              <Label htmlFor="is_baptized" className="cursor-pointer">
                Is Baptized
              </Label>
            </div>
          </div>

          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)} disabled={loading}>
              Cancel
            </Button>
            <Button type="submit" disabled={loading}>
              {loading ? "Saving..." : member ? "Update" : "Add"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
