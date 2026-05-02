"use client"

import { useEffect, useState } from "react"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { useToast } from "@/hooks/use-toast"
import { PencilIcon, TrashIcon, PlusIcon, Mail, WrenchIcon, QrCodeIcon, EyeIcon, CheckIcon } from "lucide-react"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { FamilyMemberDialog } from "./family-member-dialog"
import { LodgingDialog } from "./lodging-dialog"
import { FixFeeDialog } from "./fix-fee-dialog"
import { TshirtDialog } from "./tshirt-dialog"
import { cn } from "@/lib/utils"

interface RegistrationDetailsDialogProps {
  registrationId: number
  onClose: () => void
}

export function RegistrationDetailsDialog({ registrationId, onClose }: RegistrationDetailsDialogProps) {
  const [data, setData] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [familyMemberDialog, setFamilyMemberDialog] = useState<{ open: boolean; member?: any }>({ open: false })
  const [lodgingDialog, setLodgingDialog] = useState(false)
  const [fixFeeDialog, setFixFeeDialog] = useState(false)
  const [tshirtDialog, setTshirtDialog] = useState(false)
  const [sendingEmail, setSendingEmail] = useState(false)
  const [sendingCheckinEmail, setSendingCheckinEmail] = useState(false)
  const [volunteerDialog, setVolunteerDialog] = useState<{ open: boolean; volunteer?: any }>({ open: false })
  const [volunteerForm, setVolunteerForm] = useState({ volunteer_name: "", volunteer_type: "" })
  const [savingVolunteer, setSavingVolunteer] = useState(false)
  const [editMode, setEditMode] = useState(false)
  const [adventureEnabled, setAdventureEnabled] = useState<boolean | null>(null)
  const { toast } = useToast()

  // Fetch adventure setting
  useEffect(() => {
    fetch("/api/settings/adventure")
      .then((r) => r.json())
      .then((data) => setAdventureEnabled(data.enabled))
      .catch(() => setAdventureEnabled(false))
  }, [])

  const fetchDetails = async () => {
    try {
      const response = await fetch(`/api/registrations/${registrationId}`)
      if (response.ok) {
        const result = await response.json()
        setData(result)
      } else {
        throw new Error("Failed to fetch registration details")
      }
    } catch (error) {
      console.error("[v0] Error fetching registration details:", error)
      toast({
        title: "Error",
        description: "Failed to load registration details",
        variant: "destructive",
      })
      onClose()
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    if (registrationId) {
      fetchDetails()
    }
  }, [registrationId])

  const handleDeleteFamilyMember = async (memberId: number) => {
    if (!confirm("Are you sure you want to delete this family member?")) return

    try {
      const response = await fetch(`/api/family-members/${memberId}`, {
        method: "DELETE",
      })

      if (response.ok) {
        toast({
          title: "Success",
          description: "Family member deleted successfully",
        })
        fetchDetails()
      }
    } catch (error) {
      console.error("[v0] Error deleting family member:", error)
      toast({
        title: "Error",
        description: "Failed to delete family member",
        variant: "destructive",
      })
    }
  }

  const handleResendConfirmation = async () => {
    setSendingEmail(true)
    try {
      const response = await fetch("/api/email/resend-confirmation", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ registrationId }),
      })

      const result = await response.json()

      if (response.ok) {
        toast({
          title: "Success",
          description: "Confirmation email sent successfully",
        })
      } else {
        toast({
          title: "Error",
          description: result.error || "Failed to send email",
          variant: "destructive",
        })
      }
    } catch (error) {
      console.error("[v0] Error sending email:", error)
      toast({
        title: "Error",
        description: "Failed to send confirmation email",
        variant: "destructive",
      })
    } finally {
      setSendingEmail(false)
    }
  }

  const handleSendCheckinEmail = async () => {
    setSendingCheckinEmail(true)
    try {
      const response = await fetch("/api/email/send-checkin", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ registrationId }),
      })

      const result = await response.json()

      if (response.ok && result.successCount > 0) {
        toast({
          title: "Success",
          description: "Check-in email with QR code sent successfully",
        })
      } else {
        toast({
          title: "Error",
          description: result.error || result.results?.[0]?.error || "Failed to send check-in email",
          variant: "destructive",
        })
      }
    } catch (error) {
      console.error("[v0] Error sending check-in email:", error)
      toast({
        title: "Error",
        description: "Failed to send check-in email",
        variant: "destructive",
      })
    } finally {
      setSendingCheckinEmail(false)
    }
  }

  const handleDeleteVolunteer = async (volunteerId: number) => {
    if (!confirm("Remove this volunteer signup?")) return
    try {
      const response = await fetch(`/api/registrations/${registrationId}/volunteers/${volunteerId}`, {
        method: "DELETE",
      })
      if (response.ok) {
        toast({ title: "Removed", description: "Volunteer signup removed" })
        fetchDetails()
      } else {
        throw new Error()
      }
    } catch {
      toast({ title: "Error", description: "Failed to remove volunteer signup", variant: "destructive" })
    }
  }

  const handleSaveVolunteer = async () => {
    if (!volunteerForm.volunteer_name.trim() || !volunteerForm.volunteer_type) {
      toast({ title: "Missing fields", description: "Please fill in name and type", variant: "destructive" })
      return
    }
    setSavingVolunteer(true)
    try {
      const isEdit = !!volunteerDialog.volunteer
      const url = isEdit
        ? `/api/registrations/${registrationId}/volunteers/${volunteerDialog.volunteer.id}`
        : `/api/registrations/${registrationId}/volunteers`
      const response = await fetch(url, {
        method: isEdit ? "PUT" : "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(volunteerForm),
      })
      if (response.ok) {
        toast({ title: "Saved", description: `Volunteer signup ${isEdit ? "updated" : "added"}` })
        setVolunteerDialog({ open: false })
        fetchDetails()
      } else {
        throw new Error()
      }
    } catch {
      toast({ title: "Error", description: "Failed to save volunteer signup", variant: "destructive" })
    } finally {
      setSavingVolunteer(false)
    }
  }

  const openVolunteerDialog = (volunteer?: any) => {
    setVolunteerForm(
      volunteer
        ? { volunteer_name: volunteer.volunteer_name, volunteer_type: volunteer.volunteer_type }
        : { volunteer_name: "", volunteer_type: "" }
    )
    setVolunteerDialog({ open: true, volunteer })
  }

  if (loading) {
    return (
      <Dialog open={true} onOpenChange={onClose}>
        <DialogContent className="max-w-6xl w-[95vw] h-[95vh] flex flex-col p-0 gap-0 overflow-hidden">
          <DialogHeader className="px-6 pt-6 pb-4 border-b shrink-0">
            <DialogTitle>Loading...</DialogTitle>
            <DialogDescription>Fetching registration details</DialogDescription>
          </DialogHeader>
          <div className="flex items-center justify-center py-8">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" />
          </div>
        </DialogContent>
      </Dialog>
    )
  }

  if (!data) return null

  // Calculate live totals from family members
  const calculatedLodgingTotal = data.family_members?.reduce(
    (sum: number, member: any) => sum + (Number(member.person_cost) || 0),
    0
  ) || 0

  return (
    <>
      <Dialog open={true} onOpenChange={onClose}>
        <DialogContent className="max-w-6xl w-[95vw] h-[95vh] flex flex-col p-0 gap-0 overflow-hidden">
          <DialogHeader className="px-6 pt-6 pb-4 border-b shrink-0">
            <div className="flex items-start justify-between gap-4">
              <DialogTitle className="text-xl">{data.family_last_name} Family</DialogTitle>
              {/* View / Edit toggle */}
              <div className="flex items-center gap-1 rounded-lg border p-1 bg-muted/40 shrink-0">
                <button
                  onClick={() => setEditMode(false)}
                  className={cn(
                    "flex items-center gap-1.5 rounded-md px-3 py-1.5 text-sm font-medium transition-all",
                    !editMode
                      ? "bg-background shadow-sm text-foreground"
                      : "text-muted-foreground hover:text-foreground"
                  )}
                >
                  <EyeIcon className="size-3.5" />
                  View
                </button>
                <button
                  onClick={() => setEditMode(true)}
                  className={cn(
                    "flex items-center gap-1.5 rounded-md px-3 py-1.5 text-sm font-medium transition-all",
                    editMode
                      ? "bg-background shadow-sm text-foreground"
                      : "text-muted-foreground hover:text-foreground"
                  )}
                >
                  <PencilIcon className="size-3.5" />
                  Edit
                </button>
              </div>
            </div>
            {/* Action buttons — only shown in edit mode */}
            {editMode && (
              <div className="flex items-center gap-2 pt-2 border-t mt-2">
                <span className="text-xs text-muted-foreground mr-auto">Edit mode: all controls unlocked</span>
                <Button size="sm" variant="outline" onClick={handleSendCheckinEmail} disabled={sendingCheckinEmail}>
                  <QrCodeIcon className="size-3 mr-1" />
                  {sendingCheckinEmail ? "Sending..." : "Send Check-In QR"}
                </Button>
                <Button size="sm" variant="outline" onClick={handleResendConfirmation} disabled={sendingEmail}>
                  <Mail className="size-3 mr-1" />
                  {sendingEmail ? "Sending..." : "Resend Confirmation"}
                </Button>
              </div>
            )}
          </DialogHeader>

          <div className="flex-1 overflow-y-auto px-6 py-6">
            <div className="space-y-6">
            {/* Basic Info */}
            <Card>
              <CardHeader>
                <CardTitle>Contact Information</CardTitle>
              </CardHeader>
              <CardContent className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Email</p>
                  <p>{data.email}</p>
                </div>
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Husband Phone</p>
                  <p>{data.husband_phone || "N/A"}</p>
                </div>
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Wife Phone</p>
                  <p>{data.wife_phone || "N/A"}</p>
                </div>
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Home Congregation</p>
                  <p>{data.home_congregation || "N/A"}</p>
                </div>
                <div className="col-span-2">
                  <p className="text-sm font-medium text-muted-foreground">Address</p>
                  <p>
                    {data.address || "N/A"}
                    {data.city && `, ${data.city}`}
                    {data.state && `, ${data.state}`}
                    {data.zip && ` ${data.zip}`}
                  </p>
                </div>
              </CardContent>
            </Card>

            {/* Lodging Card with Edit Button */}
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle>Lodging Information</CardTitle>
                    <CardDescription>Accommodation details and costs</CardDescription>
                  </div>
                  {editMode && (
                    <Button size="sm" variant="outline" onClick={() => setLodgingDialog(true)}>
                      <PencilIcon className="size-3 mr-1" />
                      Edit
                    </Button>
                  )}
                </div>
              </CardHeader>
              <CardContent className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Lodging Type</p>
                  <Badge variant="outline">{data.lodging_type || "Not specified"}</Badge>
                </div>
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Lodging Total (Calculated)</p>
                  <p className="text-lg font-semibold">${calculatedLodgingTotal.toFixed(2)}</p>
                  {data.lodging_total !== undefined && Math.abs(Number(data.lodging_total) - calculatedLodgingTotal) > 0.01 && (
                    <div className="flex items-center gap-2 mt-1">
                      <p className="text-xs text-amber-600">
                        Stored: ${Number(data.lodging_total).toFixed(2)}
                      </p>
                      <Button 
                        size="sm" 
                        variant="outline" 
                        className="h-6 text-xs px-2"
                        onClick={async () => {
                          try {
                            const res = await fetch(`/api/registrations/${registrationId}`, {
                              method: "PATCH",
                              headers: { "Content-Type": "application/json" },
                              body: JSON.stringify({ lodging_total: calculatedLodgingTotal }),
                            })
                            if (res.ok) {
                              toast({ title: "Updated", description: "Lodging total synced with calculated value" })
                              fetchDetails()
                            }
                          } catch {
                            toast({ title: "Error", description: "Failed to update", variant: "destructive" })
                          }
                        }}
                      >
                        Accept Calculated
                      </Button>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>

            {data.family_members && (
              <Card>
                <CardHeader>
                  <div className="flex items-center justify-between">
                  <div>
                    <CardTitle>Family Members</CardTitle>
                    <CardDescription>{data.family_members.length} member(s)</CardDescription>
                  </div>
                  {editMode && (
                    <Button size="sm" onClick={() => setFamilyMemberDialog({ open: true })}>
                      <PlusIcon className="size-3 mr-1" />
                      Add Member
                    </Button>
                  )}
                  </div>
                </CardHeader>
                <CardContent>
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Name</TableHead>
                        <TableHead>Age</TableHead>
                        <TableHead>Date of Birth</TableHead>
                        <TableHead>Baptized</TableHead>
                        <TableHead>Cost</TableHead>
                        <TableHead className="text-right">Actions</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {data.family_members.length === 0 ? (
                        <TableRow>
                          <TableCell colSpan={6} className="text-center py-4 text-muted-foreground">
                            No family members added yet
                          </TableCell>
                        </TableRow>
                      ) : (
                        data.family_members.map((member: any) => (
                          <TableRow key={member.id}>
                            <TableCell>{member.first_name}</TableCell>
                            <TableCell>{Number(member.age) >= 18 ? "Adult" : member.age}</TableCell>
                            <TableCell>
                              {member.date_of_birth ? new Date(member.date_of_birth).toLocaleDateString() : "N/A"}
                            </TableCell>
                            <TableCell>
                              <Badge variant={member.is_baptized ? "default" : "secondary"}>
                                {member.is_baptized ? "Yes" : "No"}
                              </Badge>
                            </TableCell>
                            <TableCell>${Number(member.person_cost || 0).toFixed(2)}</TableCell>
                            <TableCell className="text-right">
                              {editMode && (
                                <div className="flex justify-end gap-2">
                                  <Button
                                    variant="ghost"
                                    size="sm"
                                    onClick={() => setFamilyMemberDialog({ open: true, member })}
                                  >
                                    <PencilIcon className="size-3" />
                                  </Button>
                                  <Button variant="ghost" size="sm" onClick={() => handleDeleteFamilyMember(member.id)}>
                                    <TrashIcon className="size-3" />
                                  </Button>
                                </div>
                              )}
                            </TableCell>
                          </TableRow>
                        ))
                      )}
                      {/* Total row */}
                      {data.family_members.length > 0 && (
                        <TableRow className="bg-muted/50 font-semibold">
                          <TableCell colSpan={4} className="text-right">Total:</TableCell>
                          <TableCell>${calculatedLodgingTotal.toFixed(2)}</TableCell>
                          <TableCell />
                        </TableRow>
                      )}
                    </TableBody>
                  </Table>
                </CardContent>
              </Card>
            )}

            {/* Health Info */}
            {data.health_info && data.health_info.length > 0 && (
              <Card>
                <CardHeader>
                  <CardTitle>Health Information</CardTitle>
                  <CardDescription>{data.health_info.length} record(s)</CardDescription>
                </CardHeader>
                <CardContent>
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Name</TableHead>
                        <TableHead>Condition</TableHead>
                        <TableHead>Medication On Hand</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {data.health_info.map((info: any) => (
                        <TableRow key={info.id}>
                          <TableCell>{info.full_name}</TableCell>
                          <TableCell>{info.condition}</TableCell>
                          <TableCell>
                            <Badge variant={info.medication_on_hand ? "default" : "secondary"}>
                              {info.medication_on_hand ? "Yes" : "No"}
                            </Badge>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </CardContent>
              </Card>
            )}

            {/* T-Shirt Orders — always show so admin can add even if empty */}
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle>T-Shirt Orders</CardTitle>
                    <CardDescription>
                      {data.tshirt_orders?.length
                        ? `${data.tshirt_orders.length} order(s) · $${Number(data.tshirt_total || 0).toFixed(2)} total`
                        : "No orders yet"}
                    </CardDescription>
                  </div>
                  <Button size="sm" variant="outline" onClick={() => setTshirtDialog(true)}>
                    <PencilIcon className="size-3 mr-1" />
                    {data.tshirt_orders?.length ? "Edit" : "Add"}
                  </Button>
                </div>
              </CardHeader>
              {data.tshirt_orders && data.tshirt_orders.length > 0 && (
                <CardContent>
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Size</TableHead>
                        <TableHead>Color</TableHead>
                        <TableHead>Quantity</TableHead>
                        <TableHead>Price</TableHead>
                        <TableHead>Subtotal</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {data.tshirt_orders.map((order: any) => (
                        <TableRow key={order.id}>
                          <TableCell>{order.size}</TableCell>
                          <TableCell>{order.color}</TableCell>
                          <TableCell>{order.quantity}</TableCell>
                          <TableCell>${Number(order.price).toFixed(2)}</TableCell>
                          <TableCell className="font-semibold">${(Number(order.price) * Number(order.quantity)).toFixed(2)}</TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </CardContent>
              )}
            </Card>

            {/* Volunteers */}
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle>Volunteer Signups</CardTitle>
                    <CardDescription>{(data.volunteers || []).length} volunteer(s)</CardDescription>
                  </div>
                  {editMode && (
                    <Button size="sm" onClick={() => openVolunteerDialog()}>
                      <PlusIcon className="size-3 mr-1" />
                      Add Volunteer
                    </Button>
                  )}
                </div>
              </CardHeader>
              <CardContent>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Name</TableHead>
                      <TableHead>Volunteer Type</TableHead>
                      <TableHead className="text-right">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {(data.volunteers || []).length === 0 ? (
                      <TableRow>
                        <TableCell colSpan={3} className="text-center py-4 text-muted-foreground">
                          No volunteer signups
                        </TableCell>
                      </TableRow>
                    ) : (
                      data.volunteers.map((volunteer: any) => (
                        <TableRow key={volunteer.id}>
                          <TableCell>{volunteer.volunteer_name}</TableCell>
                          <TableCell>
                            <Badge variant="outline">{volunteer.volunteer_type}</Badge>
                          </TableCell>
                          <TableCell className="text-right">
                            {editMode && (
                              <div className="flex justify-end gap-2">
                                <Button variant="ghost" size="sm" onClick={() => openVolunteerDialog(volunteer)}>
                                  <PencilIcon className="size-3" />
                                </Button>
                                <Button variant="ghost" size="sm" onClick={() => handleDeleteVolunteer(volunteer.id)}>
                                  <TrashIcon className="size-3" />
                                </Button>
                              </div>
                            )}
                          </TableCell>
                        </TableRow>
                      ))
                    )}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>

            {/* Session Suggestions */}
            {data.session_suggestions && data.session_suggestions.length > 0 && (
              <Card>
                <CardHeader>
                  <CardTitle>Session Suggestions</CardTitle>
                  <CardDescription>{data.session_suggestions.length} suggestion(s)</CardDescription>
                </CardHeader>
                <CardContent className="space-y-3">
                  {data.session_suggestions.map((suggestion: any) => (
                    <div key={suggestion.id} className="border-l-2 border-primary pl-4">
                      <p className="text-sm font-medium">{suggestion.session_type}</p>
                      <p className="text-sm text-muted-foreground">{suggestion.suggestion}</p>
                    </div>
                  ))}
                </CardContent>
              </Card>
            )}

            {/* Payment Info */}
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle>Payment Information</CardTitle>
                  {editMode && (
                    <Button size="sm" variant="outline" onClick={() => setFixFeeDialog(true)}>
                      <WrenchIcon className="size-3 mr-1" />
                      Fix Fee
                    </Button>
                  )}
                </div>
              </CardHeader>
              <CardContent className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Payment Status</p>
                  <Badge variant={data.payment_status === "paid" ? "default" : "secondary"}>
                    {data.payment_status || "pending"}
                  </Badge>
                </div>
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Registration Fee</p>
                  <p>${data.registration_fee || 0}</p>
                </div>
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Lodging Total</p>
                  <p>${data.lodging_total || 0}</p>
                </div>
                <div>
                  <p className="text-sm font-medium text-muted-foreground">T-Shirt Total</p>
                  <p>${data.tshirt_total || 0}</p>
                </div>
                {/* Adventure Cost - show if they have any adventure charges */}
                {Number(data.climbing_tower_total || 0) > 0 && (
                  <div>
                    <p className="text-sm font-medium text-muted-foreground">
                      Adventure Activities
                      {adventureEnabled === false && (
                        <span className="ml-1 text-xs text-amber-600">(Disabled - not in total)</span>
                      )}
                    </p>
                    <p className={adventureEnabled === false ? "text-muted-foreground line-through" : ""}>
                      ${Number(data.climbing_tower_total || 0).toFixed(2)}
                    </p>
                  </div>
                )}
                {data.scholarship_donation > 0 && (
                  <div>
                    <p className="text-sm font-medium text-muted-foreground">Scholarship Donation</p>
                    <p>${data.scholarship_donation}</p>
                  </div>
                )}
                {data.scholarship_requested && (
                  <div className="col-span-2">
                    <div className="flex items-center gap-2 px-3 py-2 bg-purple-50 border border-purple-200 rounded-lg">
                      <span className="text-purple-700 text-sm font-semibold">Scholarship Requested</span>
                      <span className="text-purple-600 text-xs">This family has requested financial assistance.</span>
                    </div>
                  </div>
                )}
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Total Owed</p>
                  <p className="text-lg font-semibold text-primary">
                    ${(
                      Number(data.registration_fee || 0) + 
                      Number(data.lodging_total || 0) + 
                      Number(data.tshirt_total || 0) + 
                      Number(data.scholarship_donation || 0) +
                      (adventureEnabled ? Number(data.climbing_tower_total || 0) : 0)
                    ).toFixed(2)}
                  </p>
                </div>
                {data.payment_notes && (
                  <div className="col-span-2">
                    <p className="text-sm font-medium text-muted-foreground">Payment Notes</p>
                    <p className="text-sm">{data.payment_notes}</p>
                  </div>
                )}
              </CardContent>
            </Card>
            </div>{/* end space-y-6 */}
          </div>{/* end scrollable area */}
        </DialogContent>
      </Dialog>

      <FamilyMemberDialog
        open={familyMemberDialog.open}
        onOpenChange={(open) => setFamilyMemberDialog({ open })}
        registrationId={registrationId}
        member={familyMemberDialog.member}
        onSuccess={fetchDetails}
      />

      <LodgingDialog
        open={lodgingDialog}
        onOpenChange={setLodgingDialog}
        registrationId={registrationId}
        lodgingType={data?.lodging_type}
        lodgingTotal={data?.lodging_total}
        onSuccess={fetchDetails}
      />

      <FixFeeDialog
        open={fixFeeDialog}
        onOpenChange={setFixFeeDialog}
        registrationId={registrationId}
        familyName={data?.family_last_name || ""}
        currentFee={Number(data?.registration_fee || 0)}
        onSuccess={fetchDetails}
      />

      <TshirtDialog
        open={tshirtDialog}
        onOpenChange={setTshirtDialog}
        registrationId={registrationId}
        familyName={data?.family_last_name || ""}
        orders={data?.tshirt_orders || []}
        onSuccess={fetchDetails}
      />

      {/* Volunteer Add/Edit Dialog */}
      <Dialog open={volunteerDialog.open} onOpenChange={(open) => setVolunteerDialog({ open })}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>{volunteerDialog.volunteer ? "Edit" : "Add"} Volunteer Signup</DialogTitle>
            <DialogDescription>
              {volunteerDialog.volunteer ? "Update this volunteer entry" : "Add a new volunteer signup to this registration"}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <div className="space-y-2">
              <Label htmlFor="vol_name">Volunteer Name</Label>
              <Input
                id="vol_name"
                value={volunteerForm.volunteer_name}
                onChange={(e) => setVolunteerForm({ ...volunteerForm, volunteer_name: e.target.value })}
                placeholder="Full name"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="vol_type">Volunteer Type</Label>
              <Select
                value={volunteerForm.volunteer_type}
                onValueChange={(val) => setVolunteerForm({ ...volunteerForm, volunteer_type: val })}
              >
                <SelectTrigger id="vol_type">
                  <SelectValue placeholder="Select a type..." />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Leading singing">Leading singing</SelectItem>
                  <SelectItem value="Leading prayer">Leading prayer</SelectItem>
                  <SelectItem value="Reading scripture">Reading scripture</SelectItem>
                  <SelectItem value="Presenting a lesson">Presenting a lesson</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          <div className="flex justify-end gap-2 pt-2">
            <Button variant="outline" onClick={() => setVolunteerDialog({ open: false })} disabled={savingVolunteer}>
              Cancel
            </Button>
            <Button onClick={handleSaveVolunteer} disabled={savingVolunteer}>
              {savingVolunteer ? "Saving..." : volunteerDialog.volunteer ? "Update" : "Add"}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </>
  )
}
