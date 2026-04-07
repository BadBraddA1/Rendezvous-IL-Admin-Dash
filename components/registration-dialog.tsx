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
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { useToast } from "@/hooks/use-toast"

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
  payment_status: string | null
  lodging_type: string | null
  emergency_contact_name: string | null
  emergency_contact_phone: string | null
  emergency_contact_relationship: string | null
  payment_notes: string | null
}

interface RegistrationDialogProps {
  open: boolean
  onOpenChange: (open: boolean | undefined) => void
  registration?: Registration | null
}

export function RegistrationDialog({ open, onOpenChange, registration }: RegistrationDialogProps) {
  const { toast } = useToast()
  const [loading, setLoading] = useState(false)

  const [formData, setFormData] = useState({
    family_last_name: "",
    email: "",
    husband_phone: "",
    wife_phone: "",
    address: "",
    city: "",
    state: "",
    zip: "",
    home_congregation: "",
    payment_status: "pending",
    lodging_type: "",
    emergency_contact_name: "",
    emergency_contact_phone: "",
    emergency_contact_relationship: "",
    payment_notes: "",
  })

  useEffect(() => {
    if (registration) {
      setFormData({
        family_last_name: registration.family_last_name || "",
        email: registration.email || "",
        husband_phone: registration.husband_phone || "",
        wife_phone: registration.wife_phone || "",
        address: registration.address || "",
        city: registration.city || "",
        state: registration.state || "",
        zip: registration.zip || "",
        home_congregation: registration.home_congregation || "",
        payment_status: registration.payment_status || "pending",
        lodging_type: registration.lodging_type || "",
        emergency_contact_name: registration.emergency_contact_name || "",
        emergency_contact_phone: registration.emergency_contact_phone || "",
        emergency_contact_relationship: registration.emergency_contact_relationship || "",
        payment_notes: registration.payment_notes || "",
      })
    } else {
      setFormData({
        family_last_name: "",
        email: "",
        husband_phone: "",
        wife_phone: "",
        address: "",
        city: "",
        state: "",
        zip: "",
        home_congregation: "",
        payment_status: "pending",
        lodging_type: "",
        emergency_contact_name: "",
        emergency_contact_phone: "",
        emergency_contact_relationship: "",
        payment_notes: "",
      })
    }
  }, [registration, open])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)

    try {
      const url = registration ? `/api/registrations/${registration.id}` : "/api/registrations"
      const method = registration ? "PATCH" : "POST"

      const response = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData),
      })

      if (response.ok) {
        toast({
          title: "Success",
          description: `Registration ${registration ? "updated" : "created"} successfully`,
        })
        onOpenChange(true)
      } else {
        throw new Error("Failed to save registration")
      }
    } catch (error) {
      console.error("[v0] Error saving registration:", error)
      toast({
        title: "Error",
        description: `Failed to ${registration ? "update" : "create"} registration`,
        variant: "destructive",
      })
    } finally {
      setLoading(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={() => onOpenChange(undefined)}>
      <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{registration ? "Edit Registration" : "New Registration"}</DialogTitle>
          <DialogDescription>
            {registration
              ? "Update the registration details below."
              : "Fill in the details to create a new event registration."}
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Basic Information */}
          <div className="space-y-4">
            <h3 className="text-lg font-semibold">Basic Information</h3>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="family_last_name">Family Last Name *</Label>
                <Input
                  id="family_last_name"
                  value={formData.family_last_name}
                  onChange={(e) => setFormData({ ...formData, family_last_name: e.target.value })}
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="email">Email *</Label>
                <Input
                  id="email"
                  type="email"
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  required
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="husband_phone">Husband Phone</Label>
                <Input
                  id="husband_phone"
                  type="tel"
                  value={formData.husband_phone}
                  onChange={(e) => setFormData({ ...formData, husband_phone: e.target.value })}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="wife_phone">Wife Phone</Label>
                <Input
                  id="wife_phone"
                  type="tel"
                  value={formData.wife_phone}
                  onChange={(e) => setFormData({ ...formData, wife_phone: e.target.value })}
                />
              </div>
            </div>
          </div>

          {/* Address */}
          <div className="space-y-4">
            <h3 className="text-lg font-semibold">Address</h3>
            <div className="space-y-2">
              <Label htmlFor="address">Street Address</Label>
              <Input
                id="address"
                value={formData.address}
                onChange={(e) => setFormData({ ...formData, address: e.target.value })}
              />
            </div>

            <div className="grid grid-cols-3 gap-4">
              <div className="space-y-2">
                <Label htmlFor="city">City</Label>
                <Input
                  id="city"
                  value={formData.city}
                  onChange={(e) => setFormData({ ...formData, city: e.target.value })}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="state">State</Label>
                <Input
                  id="state"
                  value={formData.state}
                  onChange={(e) => setFormData({ ...formData, state: e.target.value })}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="zip">ZIP Code</Label>
                <Input
                  id="zip"
                  value={formData.zip}
                  onChange={(e) => setFormData({ ...formData, zip: e.target.value })}
                />
              </div>
            </div>
          </div>

          {/* Event Details */}
          <div className="space-y-4">
            <h3 className="text-lg font-semibold">Event Details</h3>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="home_congregation">Home Congregation</Label>
                <Input
                  id="home_congregation"
                  value={formData.home_congregation}
                  onChange={(e) => setFormData({ ...formData, home_congregation: e.target.value })}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="lodging_type">Lodging Type</Label>
                <Select
                  value={formData.lodging_type}
                  onValueChange={(value) => setFormData({ ...formData, lodging_type: value })}
                >
                  <SelectTrigger id="lodging_type">
                    <SelectValue placeholder="Select lodging type" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="motel_2queen_1bunk">Motel: 2 Queen Beds + 1 Bunk Bed</SelectItem>
                    <SelectItem value="motel_1queen_2bunk">Motel: 1 Queen Bed + 2 Bunk Beds</SelectItem>
                    <SelectItem value="rv">RV Site ($30/night × 4 nights = $120)</SelectItem>
                    <SelectItem value="tent">Tent Camping ($20/night × 4 nights = $80)</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          </div>

          {/* Emergency Contact */}
          <div className="space-y-4">
            <h3 className="text-lg font-semibold">Emergency Contact</h3>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="emergency_contact_name">Contact Name</Label>
                <Input
                  id="emergency_contact_name"
                  value={formData.emergency_contact_name}
                  onChange={(e) => setFormData({ ...formData, emergency_contact_name: e.target.value })}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="emergency_contact_phone">Contact Phone</Label>
                <Input
                  id="emergency_contact_phone"
                  type="tel"
                  value={formData.emergency_contact_phone}
                  onChange={(e) => setFormData({ ...formData, emergency_contact_phone: e.target.value })}
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="emergency_contact_relationship">Relationship</Label>
              <Input
                id="emergency_contact_relationship"
                value={formData.emergency_contact_relationship}
                onChange={(e) => setFormData({ ...formData, emergency_contact_relationship: e.target.value })}
              />
            </div>
          </div>

          {/* Payment */}
          <div className="space-y-4">
            <h3 className="text-lg font-semibold">Payment</h3>
            <div className="space-y-2">
              <Label htmlFor="payment_status">Payment Status *</Label>
              <Select
                value={formData.payment_status}
                onValueChange={(value) => setFormData({ ...formData, payment_status: value })}
              >
                <SelectTrigger id="payment_status">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="pending">Pending</SelectItem>
                  <SelectItem value="partial">Partial</SelectItem>
                  <SelectItem value="paid">Paid</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="payment_notes">Payment Notes</Label>
              <Textarea
                id="payment_notes"
                value={formData.payment_notes}
                onChange={(e) => setFormData({ ...formData, payment_notes: e.target.value })}
                rows={3}
              />
            </div>
          </div>

          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(undefined)}>
              Cancel
            </Button>
            <Button type="submit" disabled={loading}>
              {loading ? "Saving..." : registration ? "Update" : "Create"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
