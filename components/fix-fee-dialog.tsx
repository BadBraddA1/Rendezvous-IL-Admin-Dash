"use client"

import { useState } from "react"
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { useToast } from "@/hooks/use-toast"
import { AlertTriangle, Mail } from "lucide-react"

interface FixFeeDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  registrationId: number
  familyName: string
  currentFee: number
  onSuccess: () => void
}

export function FixFeeDialog({
  open,
  onOpenChange,
  registrationId,
  familyName,
  currentFee,
  onSuccess,
}: FixFeeDialogProps) {
  const [newFee, setNewFee] = useState(String(currentFee))
  const [reason, setReason] = useState("")
  const [saving, setSaving] = useState(false)
  const { toast } = useToast()

  const handleSubmit = async () => {
    const parsedNew = parseFloat(newFee)

    if (isNaN(parsedNew) || parsedNew < 0) {
      toast({ title: "Invalid fee", description: "Please enter a valid dollar amount.", variant: "destructive" })
      return
    }

    if (parsedNew === currentFee) {
      toast({ title: "No change", description: "The new fee is the same as the current fee.", variant: "destructive" })
      return
    }

    setSaving(true)
    try {
      const response = await fetch(`/api/registrations/${registrationId}/fix-fee`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ newFee: parsedNew, oldFee: currentFee, reason }),
      })

      const result = await response.json()

      if (response.ok) {
        toast({
          title: "Fee updated",
          description: result.emailSent
            ? `Registration fee updated to $${parsedNew.toFixed(2)} and a notification email has been sent.`
            : `Registration fee updated to $${parsedNew.toFixed(2)}. Note: Email could not be sent - verify your domain at resend.com/domains to enable email notifications.`,
        })
        onOpenChange(false)
        onSuccess()
      } else {
        toast({ title: "Error", description: result.error || "Failed to update fee", variant: "destructive" })
      }
    } catch (error) {
      toast({ title: "Error", description: "Failed to update registration fee", variant: "destructive" })
    } finally {
      setSaving(false)
    }
  }

  const diff = parseFloat(newFee) - currentFee

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <AlertTriangle className="size-4 text-amber-500" />
            Fix Registration Fee
          </DialogTitle>
          <DialogDescription>
            Update the registration fee for the <strong>{familyName} family</strong>. An email notification will automatically be sent to them.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-2">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <Label className="text-muted-foreground text-xs">Current Fee</Label>
              <div className="flex h-10 w-full rounded-md border border-input bg-muted px-3 py-2 text-sm text-muted-foreground items-center">
                ${Number(currentFee).toFixed(2)}
              </div>
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="new-fee">New Fee</Label>
              <div className="relative">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground text-sm">$</span>
                <Input
                  id="new-fee"
                  type="number"
                  min="0"
                  step="0.01"
                  value={newFee}
                  onChange={(e) => setNewFee(e.target.value)}
                  className="pl-6"
                  placeholder="0.00"
                />
              </div>
            </div>
          </div>

          {!isNaN(diff) && diff !== 0 && (
            <div className={`text-sm rounded-md px-3 py-2 font-medium ${diff < 0 ? "bg-green-50 text-green-700 border border-green-200" : "bg-amber-50 text-amber-700 border border-amber-200"}`}>
              {diff < 0
                ? `Decrease of $${Math.abs(diff).toFixed(2)}`
                : `Increase of $${diff.toFixed(2)}`}
            </div>
          )}

          <div className="space-y-1.5">
            <Label htmlFor="reason">Reason for Change <span className="text-muted-foreground">(optional)</span></Label>
            <Textarea
              id="reason"
              placeholder="e.g. Incorrect fee applied at registration, scholarship adjustment..."
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              rows={3}
              className="resize-none"
            />
          </div>

          <div className="flex items-center gap-2 text-xs text-muted-foreground bg-muted rounded-md px-3 py-2">
            <Mail className="size-3 shrink-0" />
            <span>An email will be sent to the family showing the old fee, new fee, and updated total owed.</span>
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)} disabled={saving}>
            Cancel
          </Button>
          <Button onClick={handleSubmit} disabled={saving}>
            {saving ? "Updating..." : "Update Fee & Send Email"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
