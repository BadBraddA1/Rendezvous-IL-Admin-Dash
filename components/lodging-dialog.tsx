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
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { useToast } from "@/hooks/use-toast"

interface LodgingDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  registrationId: number
  lodgingType?: string
  lodgingTotal?: number
  onSuccess: () => void
}

export function LodgingDialog({
  open,
  onOpenChange,
  registrationId,
  lodgingType,
  lodgingTotal,
  onSuccess,
}: LodgingDialogProps) {
  const [loading, setLoading] = useState(false)
  const [formData, setFormData] = useState({
    lodging_type: "",
    lodging_total: "",
  })
  const { toast } = useToast()

  useEffect(() => {
    setFormData({
      lodging_type: lodgingType || "",
      lodging_total: lodgingTotal?.toString() || "",
    })
  }, [lodgingType, lodgingTotal, open])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)

    try {
      const response = await fetch(`/api/registrations/${registrationId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          lodging_type: formData.lodging_type,
          lodging_total: Number.parseFloat(formData.lodging_total) || null,
        }),
      })

      if (response.ok) {
        toast({
          title: "Success",
          description: "Lodging information updated successfully",
        })
        onSuccess()
        onOpenChange(false)
      } else {
        throw new Error("Failed to update lodging")
      }
    } catch (error) {
      console.error("[v0] Error updating lodging:", error)
      toast({
        title: "Error",
        description: "Failed to update lodging information",
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
          <DialogTitle>Edit Lodging Information</DialogTitle>
          <DialogDescription>Update the lodging type and total cost</DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit}>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="lodging_type">Lodging Type</Label>
              <Select
                value={formData.lodging_type}
                onValueChange={(value) => setFormData({ ...formData, lodging_type: value })}
              >
                <SelectTrigger>
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

            <div className="space-y-2">
              <Label htmlFor="lodging_total">Lodging Total ($)</Label>
              <Input
                id="lodging_total"
                type="number"
                step="0.01"
                value={formData.lodging_total}
                onChange={(e) => setFormData({ ...formData, lodging_total: e.target.value })}
                placeholder="0.00"
              />
            </div>
          </div>

          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)} disabled={loading}>
              Cancel
            </Button>
            <Button type="submit" disabled={loading}>
              {loading ? "Saving..." : "Update"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
