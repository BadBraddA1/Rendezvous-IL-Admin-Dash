"use client"

import { useState, useEffect, useRef } from "react"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"

interface PaymentStatusDialogProps {
  registration: {
    id: number
    family_last_name: string
    payment_status: string
  }
  open: boolean
  onOpenChange: (open: boolean) => void
  onUpdate: () => void
}

export function PaymentStatusDialog({ registration, open, onOpenChange, onUpdate }: PaymentStatusDialogProps) {
  const [paymentStatus, setPaymentStatus] = useState(registration.payment_status || "pending")
  const [isUpdating, setIsUpdating] = useState(false)
  const prevOpenRef = useRef(false)

  useEffect(() => {
    if (open && !prevOpenRef.current) {
      setPaymentStatus(registration.payment_status || "pending")
    }
    prevOpenRef.current = open
  }, [open, registration.payment_status])

  const handleUpdate = async () => {
    setIsUpdating(true)
    try {
      const response = await fetch(`/api/registrations/${registration.id}/payment`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ payment_status: paymentStatus }),
      })

      if (response.ok) {
        onUpdate()
        onOpenChange(false)
      } else {
        console.error("Failed to update payment status:", response.status)
        alert("Failed to update payment status")
      }
    } catch (error) {
      console.error("Error updating payment:", error)
      alert("Failed to update payment status")
    } finally {
      setIsUpdating(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Update Payment Status</DialogTitle>
          <DialogDescription>Update payment status for {registration.family_last_name} family</DialogDescription>
        </DialogHeader>
        <div className="space-y-4 py-4">
          <div className="space-y-2">
            <Label htmlFor="payment-status">Payment Status</Label>
            <Select value={paymentStatus} onValueChange={setPaymentStatus}>
              <SelectTrigger id="payment-status">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="paid">Paid</SelectItem>
                <SelectItem value="pending">Pending</SelectItem>
                <SelectItem value="partial">Partial</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>
        <div className="flex justify-end gap-2">
          <Button variant="outline" onClick={() => onOpenChange(false)} disabled={isUpdating}>
            Cancel
          </Button>
          <Button onClick={handleUpdate} disabled={isUpdating}>
            {isUpdating ? "Updating..." : "Update"}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  )
}
