"use client"

import { useEffect, useState, useRef } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { CheckIcon, AlertCircleIcon, DollarSignIcon, ScanIcon, XIcon, CameraIcon, KeyboardIcon, HomeIcon, UserIcon, PlusIcon, TrashIcon, KeyIcon, LockIcon, HandCoinsIcon, ShirtIcon } from "lucide-react"
import { Checkbox } from "@/components/ui/checkbox"
import { useToast } from "@/hooks/use-toast"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"

interface FamilyMember {
  id: number
  first_name: string
  last_name: string
  age: number | null
  is_baptized: boolean | null
}

interface TshirtOrder {
  id: number
  size: string
  color: string
  quantity: number
  price: number | null
}

interface Registration {
  id: number
  family_last_name: string
  email: string
  payment_status: string | null
  registration_fee: number | null
  lodging_total: number | null
  tshirt_total: number | null
  climbing_tower_total: number | null
  scholarship_donation: number | null
  scholarship_requested: boolean | null
  scholarship_amount_paid: number | null
  lodging_type: string | null
  full_payment_paid: boolean | null
  family_member_count?: number
  checked_in: boolean | null
  checkin_qr_code: string | null
  room_keys: string[] | null
  pre_assigned_keys: string[] | null
  family_members?: FamilyMember[]
  tshirt_orders?: TshirtOrder[]
  tshirts_distributed?: boolean | null
}

export default function CheckInPage() {
  const [scannedRegistration, setScannedRegistration] = useState<Registration | null>(null)
  const [qrInput, setQrInput] = useState("")
  const [loading, setLoading] = useState(false)
  const [scanMode, setScanMode] = useState<"camera" | "manual">("camera")
  const [cameraActive, setCameraActive] = useState(false)
  const [cameraError, setCameraError] = useState<string | null>(null)
  const [cameraStarting, setCameraStarting] = useState(false)
  const [roomKeys, setRoomKeys] = useState<string[]>([])
  const [keysTakenCount, setKeysTakenCount] = useState<number>(2)
  const [isAdmin, setIsAdmin] = useState<boolean>(false)
  const [scholarshipDialogOpen, setScholarshipDialogOpen] = useState(false)
  const [scholarshipAmount, setScholarshipAmount] = useState("")
  const [scholarshipNote, setScholarshipNote] = useState("")
  const [savingScholarship, setSavingScholarship] = useState(false)
  const [savingTshirtsDistributed, setSavingTshirtsDistributed] = useState(false)
  const { toast } = useToast()
  const inputRef = useRef<HTMLInputElement>(null)
  const html5QrCodeRef = useRef<any>(null)
  const scannerContainerRef = useRef<HTMLDivElement>(null)
  const isMountedRef = useRef(true)

  // Track component mount state
  useEffect(() => {
    isMountedRef.current = true
    return () => {
      isMountedRef.current = false
    }
  }, [])

  // Detect whether the user is authenticated as an admin (controls whether
  // payment can be collected for scholarship-requested families)
  useEffect(() => {
    fetch("/api/admin/auth-status")
      .then((res) => res.json())
      .then((data) => {
        if (isMountedRef.current) setIsAdmin(!!data.isAdmin)
      })
      .catch(() => {
        if (isMountedRef.current) setIsAdmin(false)
      })
  }, [])

  // Start/stop camera based on scanMode and scannedRegistration
  useEffect(() => {
    let cancelled = false

    const initCamera = async () => {
      if (scanMode === "camera" && !scannedRegistration && !cancelled) {
        await startCamera()
      } else if (!cancelled) {
        await stopCamera()
      }
    }

    initCamera()

    return () => {
      cancelled = true
      // Fire and forget - don't await in cleanup
      stopCamera().catch(() => {})
    }
  }, [scanMode, scannedRegistration])

  // Auto-focus the manual input field
  useEffect(() => {
    if (scanMode === "manual" && !scannedRegistration) {
      inputRef.current?.focus()
    }
  }, [scanMode, scannedRegistration])

  const startCamera = async () => {
    // Prevent multiple simultaneous start attempts
    if (cameraStarting || cameraActive) return
    
    setCameraStarting(true)
    setCameraError(null)
    
    // Wait for the container to be available and DOM to settle
    await new Promise(resolve => setTimeout(resolve, 300))
    
    // Check if component is still mounted and in camera mode
    if (!isMountedRef.current || scanMode !== "camera" || scannedRegistration) {
      setCameraStarting(false)
      return
    }

    try {
      // Dynamically import html5-qrcode (client-side only)
      const { Html5Qrcode } = await import("html5-qrcode")
      
      // Stop any existing instance first
      if (html5QrCodeRef.current) {
        try {
          const state = html5QrCodeRef.current.getState()
          if (state === 2) { // SCANNING state
            await html5QrCodeRef.current.stop()
          }
        } catch (e) {
          // Ignore errors when stopping
        }
        html5QrCodeRef.current = null
      }

      // Check again if still valid to start
      if (!isMountedRef.current || scanMode !== "camera" || scannedRegistration) {
        setCameraStarting(false)
        return
      }

      // Check if the qr-reader element exists
      const readerElement = document.getElementById("qr-reader")
      if (!readerElement) {
        setCameraStarting(false)
        setCameraError("Scanner element not found. Please refresh the page.")
        return
      }

      const html5QrCode = new Html5Qrcode("qr-reader")
      html5QrCodeRef.current = html5QrCode

      await html5QrCode.start(
        { facingMode: "environment" },
        {
          fps: 10,
          qrbox: { width: 250, height: 250 },
          aspectRatio: 1.0,
        },
        (decodedText) => {
          // Success callback - QR code scanned
          if (isMountedRef.current) {
            handleQRScan(decodedText)
          }
        },
        () => {
          // Error callback - ignore scan errors, they happen constantly
        }
      )
      
      if (isMountedRef.current) {
        setCameraActive(true)
      }
    } catch (error: any) {
      // Only show error if it's not an abort error (which happens during cleanup)
      if (error.name !== "AbortError" && isMountedRef.current) {
        console.error("[v0] Camera error:", error)
        setCameraError(
          error.message?.includes("Permission") 
            ? "Camera permission denied. Please allow camera access in your browser settings."
            : "Failed to access camera. Please try manual entry or refresh the page."
        )
      }
      setCameraActive(false)
    } finally {
      if (isMountedRef.current) {
        setCameraStarting(false)
      }
    }
  }

  const stopCamera = async () => {
    if (html5QrCodeRef.current) {
      try {
        const state = html5QrCodeRef.current.getState?.()
        if (state === 2) { // SCANNING state
          await html5QrCodeRef.current.stop().catch(() => {
            // Suppress AbortError and other stop errors
          })
        }
      } catch (e: any) {
        // Ignore all errors when stopping - especially AbortError
        if (e?.name !== "AbortError") {
          console.log("[v0] Camera stop error (ignored):", e?.name)
        }
      }
      html5QrCodeRef.current = null
    }
    if (isMountedRef.current) {
      setCameraActive(false)
      setCameraStarting(false)
    }
  }

  const handleQRScan = async (code: string) => {
    // Clean the code - trim whitespace and uppercase
    const cleanCode = code.trim().toUpperCase().replace(/[^A-Z0-9]/g, "")
    
    if (!cleanCode) {
      toast({
        title: "Invalid Code",
        description: "Please enter a valid check-in code",
        variant: "destructive",
      })
      return
    }

    // Stop camera while processing
    await stopCamera()
    
    setLoading(true)
    try {
      const response = await fetch(`/api/registrations/qr/${cleanCode}`)

      if (!response.ok) {
        if (response.status === 404) {
          toast({
            title: "Not Found",
            description: "No registration found with this code. Check the code and try again.",
            variant: "destructive",
          })
          if (scanMode === "camera") {
            setTimeout(() => startCamera(), 1500)
          }
        } else {
          const err = await response.json().catch(() => ({}))
          throw new Error(err.error || "Failed to lookup registration")
        }
        return
      }

      const data = await response.json()
      setScannedRegistration(data)
      // Use pre-assigned keys if available, otherwise use existing room_keys
      const keysToUse = data.pre_assigned_keys?.length > 0 
        ? data.pre_assigned_keys 
        : (data.room_keys || [])
      setRoomKeys(keysToUse)
      setQrInput("")
    } catch (error: any) {
      console.error("[v0] Error scanning QR:", error)
      toast({
        title: "Error",
        description: error.message || "Failed to look up code. Please try again.",
        variant: "destructive",
      })
      if (scanMode === "camera") {
        setTimeout(() => startCamera(), 1500)
      }
    } finally {
      setLoading(false)
    }
  }

  const handleCheckIn = async () => {
    if (!scannedRegistration) return

    // For motel lodging, require at least one room key
    const isMotel = scannedRegistration.lodging_type?.toLowerCase().includes("motel")
    if (isMotel && roomKeys.filter(k => k.trim()).length === 0) {
      toast({
        title: "Room Key Required",
        description: "Please enter at least one room key number for motel check-in",
        variant: "destructive",
      })
      return
    }

    try {
      const response = await fetch(`/api/registrations/${scannedRegistration.id}/checkin`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ 
          room_keys: isMotel ? roomKeys.filter(k => k.trim()) : null,
          keys_taken_count: isMotel ? keysTakenCount : null
        }),
      })

      if (response.ok) {
        toast({
          title: "Success",
          description: `${scannedRegistration.family_last_name} family checked in successfully`,
        })
        setScannedRegistration(null)
        setRoomKeys([])
        setKeysTakenCount(2)
      }
    } catch (error) {
      console.error("[v0] Error checking in:", error)
      toast({
        title: "Error",
        description: "Failed to check in",
        variant: "destructive",
      })
    }
  }

  const handlePaymentReceived = async () => {
    if (!scannedRegistration) return

    try {
      const response = await fetch(`/api/registrations/${scannedRegistration.id}/payment`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ payment_status: "paid" }),
      })

      const data = await response.json()

      if (response.ok) {
        toast({
          title: "Success",
          description: "Payment marked as received",
        })
        setScannedRegistration({
          ...scannedRegistration,
          payment_status: data.registration?.payment_status ?? "paid",
          full_payment_paid: data.registration?.full_payment_paid ?? true,
        })
      } else {
        toast({
          title: "Error",
          description: data.error || "Failed to update payment",
          variant: "destructive",
        })
      }
    } catch (error) {
      console.error("Error updating payment:", error)
      toast({
        title: "Error",
        description: "Failed to update payment",
        variant: "destructive",
      })
    }
  }

  const handleRecordScholarshipPayment = async () => {
    if (!scannedRegistration) return
    const amount = parseFloat(scholarshipAmount)
    if (!Number.isFinite(amount) || amount <= 0) {
      toast({
        title: "Invalid amount",
        description: "Enter a positive dollar amount.",
        variant: "destructive",
      })
      return
    }

    setSavingScholarship(true)
    try {
      const response = await fetch(
        `/api/registrations/${scannedRegistration.id}/scholarship-payment`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ amount, note: scholarshipNote || undefined }),
        },
      )
      const data = await response.json()

      if (!response.ok) {
        toast({
          title: "Error",
          description: data.error || "Failed to record scholarship payment",
          variant: "destructive",
        })
        return
      }

      toast({
        title: "Scholarship payment recorded",
        description: data.fullyCovered
          ? `$${amount.toFixed(2)} collected. Balance fully paid - scholarship cleared.`
          : `$${amount.toFixed(2)} collected and deducted from scholarship.`,
      })

      setScannedRegistration({
        ...scannedRegistration,
        payment_status: data.registration?.payment_status ?? "partial",
        full_payment_paid: data.registration?.full_payment_paid ?? false,
        scholarship_requested: data.registration?.scholarship_requested ?? false,
        scholarship_amount_paid: Number(data.registration?.scholarship_amount_paid ?? 0),
      })
      setScholarshipDialogOpen(false)
      setScholarshipAmount("")
      setScholarshipNote("")
    } catch (error) {
      console.error("Error recording scholarship payment:", error)
      toast({
        title: "Error",
        description: "Failed to record scholarship payment",
        variant: "destructive",
      })
    } finally {
      setSavingScholarship(false)
    }
  }

  const handleToggleTshirtsDistributed = async (checked: boolean) => {
    if (!scannedRegistration) return
    setSavingTshirtsDistributed(true)
    try {
      const response = await fetch(
        `/api/registrations/${scannedRegistration.id}/tshirts-distributed`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ distributed: checked }),
        },
      )
      if (!response.ok) {
        const data = await response.json().catch(() => ({}))
        throw new Error(data.error || "Failed to update")
      }
      setScannedRegistration({ ...scannedRegistration, tshirts_distributed: checked })
      toast({
        title: checked ? "T-shirts marked as given" : "T-shirts marked as not yet given",
      })
    } catch (error: any) {
      toast({
        title: "Error",
        description: error?.message ?? "Failed to update t-shirt status",
        variant: "destructive",
      })
    } finally {
      setSavingTshirtsDistributed(false)
    }
  }

  const needsPayment = (registration: Registration) => {
    return registration.payment_status !== "paid"
  }

  const getPaymentBadge = (status: string | null) => {
    const variants: Record<string, { variant: any; label: string }> = {
      paid: { variant: "default", label: "Paid" },
      pending: { variant: "destructive", label: "Payment Due" },
      partial: { variant: "secondary", label: "Partial Payment" },
    }
    const config = variants[status || "pending"] || variants.pending
    return (
      <Badge variant={config.variant} className="gap-1">
        <AlertCircleIcon className="size-3" />
        {config.label}
      </Badge>
    )
  }

  const handleReset = () => {
    setScannedRegistration(null)
    setQrInput("")
  }

  return (
    <div className="min-h-screen bg-muted/30 p-4 md:p-6">
      <div className="max-w-2xl mx-auto space-y-6">
        {/* Minimal Header - No navigation */}
        <div className="text-center">
          <h1 className="text-2xl font-bold tracking-tight">Check-In Station</h1>
          <p className="text-sm text-muted-foreground mt-1">Scan QR code or enter code manually</p>
        </div>

        {/* QR Scanner Card */}
        {!scannedRegistration && (
          <Card className="border-2 border-dashed">
            <CardHeader className="text-center">
              <div className="mx-auto mb-4 size-16 rounded-full bg-primary/10 flex items-center justify-center">
                <ScanIcon className="size-8 text-primary" />
              </div>
              <CardTitle>Scan QR Code</CardTitle>
              <CardDescription>
                {scanMode === "camera" 
                  ? "Point your camera at the QR code to scan" 
                  : "Enter the 10-digit check-in code manually"}
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {/* Mode Toggle */}
                <div className="flex gap-2">
                  <Button
                    variant={scanMode === "camera" ? "default" : "outline"}
                    onClick={() => setScanMode("camera")}
                    className="flex-1"
                  >
                    <CameraIcon className="mr-2 size-4" />
                    Camera
                  </Button>
                  <Button
                    variant={scanMode === "manual" ? "default" : "outline"}
                    onClick={() => setScanMode("manual")}
                    className="flex-1"
                  >
                    <KeyboardIcon className="mr-2 size-4" />
                    Manual
                  </Button>
                </div>

                {/* Camera Scanner */}
                {scanMode === "camera" && (
                  <div className="space-y-4">
                    {cameraError ? (
                      <div className="p-4 bg-destructive/10 rounded-lg text-center">
                        <AlertCircleIcon className="size-8 mx-auto mb-2 text-destructive" />
                        <p className="text-sm text-destructive">{cameraError}</p>
                        <Button
                          variant="outline"
                          size="sm"
                          className="mt-3"
                          onClick={() => startCamera()}
                        >
                          Try Again
                        </Button>
                      </div>
                    ) : (
                      <div className="relative">
                        <div 
                          id="qr-reader" 
                          ref={scannerContainerRef}
                          className="w-full overflow-hidden rounded-lg"
                          style={{ minHeight: "300px" }}
                        />
                        {(cameraStarting || (!cameraActive && !loading)) && (
                          <div className="absolute inset-0 flex items-center justify-center bg-muted rounded-lg">
                            <div className="text-center">
                              <div className="size-8 mx-auto mb-2 animate-spin rounded-full border-4 border-primary border-t-transparent" />
                              <p className="text-sm text-muted-foreground">Starting camera...</p>
                              <p className="text-xs text-muted-foreground mt-1">Please allow camera access if prompted</p>
                            </div>
                          </div>
                        )}
                      </div>
                    )}
                    {loading && (
                      <div className="p-4 bg-primary/10 rounded-lg text-center">
                        <div className="size-6 mx-auto mb-2 animate-spin rounded-full border-2 border-primary border-t-transparent" />
                        <p className="text-sm">Looking up registration...</p>
                      </div>
                    )}
                  </div>
                )}

                {/* Manual Entry */}
                {scanMode === "manual" && (
                  <>
                    <div className="relative">
                      <Input
                        ref={inputRef}
                        type="text"
                        placeholder="Enter 10-digit code..."
                        value={qrInput}
                        onChange={(e) => setQrInput(e.target.value.toUpperCase())}
                        onKeyDown={(e) => {
                          if (e.key === "Enter" && qrInput.length === 10) {
                            handleQRScan(qrInput)
                          }
                        }}
                        maxLength={10}
                        className="text-center text-2xl tracking-widest font-mono h-14"
                        disabled={loading}
                        autoFocus
                      />
                    </div>
                    <Button
                      onClick={() => handleQRScan(qrInput)}
                      disabled={qrInput.trim().length === 0 || loading}
                      className="w-full h-12"
                      size="lg"
                    >
                      {loading ? (
                        <>
                          <div className="mr-2 size-4 animate-spin rounded-full border-2 border-background border-t-transparent" />
                          Looking up...
                        </>
                      ) : (
                        <>
                          <ScanIcon className="mr-2 size-4" />
                          Lookup Registration
                        </>
                      )}
                    </Button>
                  </>
                )}
              </div>
            </CardContent>
          </Card>
        )}

        {/* Registration Details Card */}
        {scannedRegistration && (
          <Card className="border-2 border-primary">
            <CardHeader>
              <div className="flex items-start justify-between">
                <div className="space-y-1">
                  <CardTitle className="text-2xl">{scannedRegistration.family_last_name} Family</CardTitle>
                  <CardDescription>{scannedRegistration.email}</CardDescription>
                </div>
                <Button variant="ghost" size="icon" onClick={handleReset}>
                  <XIcon className="size-4" />
                </Button>
              </div>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* Status Badges */}
              <div className="flex flex-wrap gap-2">
                <Badge variant="outline" className="text-sm">
                  {scannedRegistration.family_member_count || 0} family members
                </Badge>
                {scannedRegistration.lodging_type && (
                  <Badge variant="secondary" className="gap-1">
                    <HomeIcon className="size-3" />
                    {scannedRegistration.lodging_type}
                  </Badge>
                )}
                {scannedRegistration.checked_in && (
                  <Badge variant="default" className="gap-1">
                    <CheckIcon className="size-3" />
                    Already Checked In
                  </Badge>
                )}
              </div>

              {/* Family Members */}
              {scannedRegistration.family_members && scannedRegistration.family_members.length > 0 && (
                <div className="p-4 bg-muted/50 rounded-lg">
                  <h4 className="font-medium text-sm mb-3 flex items-center gap-2">
                    <UserIcon className="size-4" />
                    Family Members
                  </h4>
                  <div className="grid gap-2">
                    {scannedRegistration.family_members.map((member) => (
                      <div key={member.id} className="flex items-center justify-between text-sm">
                        <span>{member.first_name} {member.last_name}</span>
<span className="text-muted-foreground">
                                          {member.age ? (Number(member.age) >= 18 ? "Adult" : `Age ${member.age}`) : ""}
                                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Amount Owed */}
              {(() => {
                const regFee = Number(scannedRegistration.registration_fee || 0)
                const lodging = Number(scannedRegistration.lodging_total || 0)
                const tshirts = Number(scannedRegistration.tshirt_total || 0)
                const adventure = Number(scannedRegistration.climbing_tower_total || 0)
                const donation = Number(scannedRegistration.scholarship_donation || 0)
                const fullTotal = regFee + lodging + tshirts + adventure + donation
                const scholarshipPaid = Number(scannedRegistration.scholarship_amount_paid || 0)
                const isPaid = scannedRegistration.payment_status === "paid"
                const isPartial = scannedRegistration.payment_status === "partial"

                // Calculate amount due based on payment status:
                // - paid: $0 due
                // - scholarship-partial (any scholarship_amount_paid): full total minus what was collected
                // - legacy partial (reg fee already collected online): lodging + extras only
                // - pending: full amount due
                const amountDue = isPaid
                  ? 0
                  : scholarshipPaid > 0
                    ? Math.max(fullTotal - scholarshipPaid, 0)
                    : isPartial
                      ? lodging + tshirts + adventure + donation
                      : fullTotal

                return (
                  <div className={`p-4 rounded-lg ${isPaid ? "bg-green-500/10" : isPartial ? "bg-orange-500/10" : "bg-amber-500/10"}`}>
                    <div className="flex items-center justify-between mb-3">
                      <h4 className="font-medium text-sm flex items-center gap-2">
                        <DollarSignIcon className="size-4" />
                        {isPaid ? "Payment Complete" : isPartial ? "Remaining Balance Due" : "Amount Due at Check-In"}
                      </h4>
                      {getPaymentBadge(scannedRegistration.payment_status)}
                    </div>
                    <div className="space-y-1 text-sm">
                      {scannedRegistration.scholarship_requested && (
                        <div className="flex items-center gap-2 px-3 py-2 mb-2 bg-purple-50 border border-purple-200 rounded-lg">
                          <span className="text-purple-700 font-semibold text-xs">Scholarship Requested</span>
                          <span className="text-purple-600 text-xs">Handle with discretion.</span>
                        </div>
                      )}
                      {scannedRegistration.scholarship_requested && !isAdmin && !isPaid && (
                        <div className="flex items-start gap-2 px-3 py-2 mb-2 bg-amber-50 border border-amber-200 rounded-lg">
                          <LockIcon className="size-4 text-amber-700 mt-0.5 shrink-0" />
                          <div className="text-xs text-amber-800">
                            <span className="font-semibold block">You can check this family in, but you are not authorized to collect payment.</span>
                            <span className="text-amber-700">Please direct them to an admin to settle their balance.</span>
                          </div>
                        </div>
                      )}
                      {Number(scannedRegistration.scholarship_amount_paid || 0) > 0 && (
                        <div className="flex items-center gap-2 px-3 py-2 mb-2 bg-green-50 border border-green-200 rounded-lg">
                          <HandCoinsIcon className="size-4 text-green-700 shrink-0" />
                          <span className="text-green-700 text-xs">
                            ${Number(scannedRegistration.scholarship_amount_paid || 0).toFixed(2)} already collected toward scholarship
                          </span>
                        </div>
                      )}
                      {isPartial && regFee > 0 && (
                        <div className="flex items-center gap-2 px-3 py-2 mb-2 bg-green-50 border border-green-200 rounded-lg">
                          <CheckIcon className="size-4 text-green-600" />
                          <span className="text-green-700 text-xs">Registration fee (${regFee.toFixed(2)}) already collected</span>
                        </div>
                      )}
                      {!isPartial && regFee > 0 && (
                        <div className="flex justify-between">
                          <span className="text-muted-foreground">Registration Fee</span>
                          <span>${regFee.toFixed(2)}</span>
                        </div>
                      )}
                      {lodging > 0 && (
                        <div className="flex justify-between">
                          <span className="text-muted-foreground">Lodging ({scannedRegistration.lodging_type})</span>
                          <span>${lodging.toFixed(2)}</span>
                        </div>
                      )}
                      {tshirts > 0 && (
                        <div className="flex justify-between">
                          <span className="text-muted-foreground">T-Shirts</span>
                          <span>${tshirts.toFixed(2)}</span>
                        </div>
                      )}
                      {adventure > 0 && (
                        <div className="flex justify-between">
                          <span className="text-muted-foreground">Adventure Activities</span>
                          <span>${adventure.toFixed(2)}</span>
                        </div>
                      )}
                      {donation > 0 && (
                        <div className="flex justify-between">
                          <span className="text-muted-foreground">Scholarship Donation</span>
                          <span>${donation.toFixed(2)}</span>
                        </div>
                      )}
                      <div className="flex justify-between pt-2 border-t font-semibold text-base">
                        <span>{isPartial ? "Amount to Collect" : "Total"}</span>
                        <span className={isPaid ? "text-green-600" : isPartial ? "text-orange-600" : "text-amber-600"}>
                          ${amountDue.toFixed(2)}
                        </span>
                      </div>
                    </div>
                    {!isPaid && !(scannedRegistration.scholarship_requested && !isAdmin) && (
                      <Button onClick={handlePaymentReceived} className="w-full mt-4 gap-2" variant="outline">
                        <DollarSignIcon className="size-4" />
                        Mark Payment Received (${amountDue.toFixed(2)})
                      </Button>
                    )}
                    {!isPaid && scannedRegistration.scholarship_requested && isAdmin && (
                      <Button
                        onClick={() => {
                          setScholarshipAmount("")
                          setScholarshipNote("")
                          setScholarshipDialogOpen(true)
                        }}
                        className="w-full mt-2 gap-2"
                        variant="secondary"
                      >
                        <HandCoinsIcon className="size-4" />
                        Collect Partial Payment (Reduce Scholarship)
                      </Button>
                    )}
                  </div>
                )
              })()}

              {/* T-Shirts: show ordered shirts and a checkbox to mark them as given */}
              {scannedRegistration.tshirt_orders && scannedRegistration.tshirt_orders.length > 0 && (
                <div
                  className={`p-4 rounded-lg ${
                    scannedRegistration.tshirts_distributed
                      ? "bg-green-50 border border-green-200"
                      : "bg-amber-50 border border-amber-200"
                  }`}
                >
                  <div className="flex items-center justify-between mb-3">
                    <h4 className="font-medium text-sm flex items-center gap-2">
                      <ShirtIcon
                        className={`size-4 ${
                          scannedRegistration.tshirts_distributed ? "text-green-700" : "text-amber-700"
                        }`}
                      />
                      T-Shirts Ordered
                    </h4>
                    {scannedRegistration.tshirts_distributed ? (
                      <Badge className="bg-green-600 hover:bg-green-600">Given</Badge>
                    ) : (
                      <Badge variant="outline" className="border-amber-400 text-amber-800">
                        Not yet given
                      </Badge>
                    )}
                  </div>

                  <ul className="space-y-1.5 mb-3">
                    {scannedRegistration.tshirt_orders.map((order) => (
                      <li
                        key={order.id}
                        className="flex items-center justify-between bg-white border border-slate-200 rounded px-3 py-2 text-sm"
                      >
                        <span className="font-medium">
                          {order.quantity > 1 && (
                            <span className="text-muted-foreground mr-1">{order.quantity}×</span>
                          )}
                          {order.size}
                        </span>
                        <span className="text-muted-foreground capitalize">{order.color}</span>
                      </li>
                    ))}
                  </ul>

                  <label className="flex items-center gap-2 cursor-pointer select-none">
                    <Checkbox
                      checked={!!scannedRegistration.tshirts_distributed}
                      disabled={savingTshirtsDistributed}
                      onCheckedChange={(checked) => handleToggleTshirtsDistributed(checked === true)}
                    />
                    <span className="text-sm font-medium">
                      {scannedRegistration.tshirts_distributed
                        ? "Shirts given to family"
                        : "Mark shirts as given to family"}
                    </span>
                  </label>
                </div>
              )}

              {/* Room Keys - Only show for Motel lodging */}
              {scannedRegistration.lodging_type?.toLowerCase().includes("motel") && (
                <div className="p-4 bg-blue-500/10 rounded-lg">
                  <div className="flex items-center justify-between mb-3">
                    <h4 className="font-medium text-sm flex items-center gap-2">
                      <KeyIcon className="size-4" />
                      Room Key Numbers
                    </h4>
                    {scannedRegistration.pre_assigned_keys && scannedRegistration.pre_assigned_keys.length > 0 && (
                      <Badge variant="outline" className="bg-blue-100 text-blue-700 border-blue-300">
                        Pre-Assigned
                      </Badge>
                    )}
                  </div>
                  {scannedRegistration.pre_assigned_keys && scannedRegistration.pre_assigned_keys.length > 0 && (
                    <div className="flex items-center gap-2 px-3 py-2 mb-3 bg-blue-50 border border-blue-200 rounded-lg">
                      <CheckIcon className="size-4 text-blue-600" />
                      <span className="text-blue-700 text-xs">Keys pre-assigned: {scannedRegistration.pre_assigned_keys.join(", ")}</span>
                    </div>
                  )}
                  <div className="space-y-2">
                    {roomKeys.map((key, index) => (
                      <div key={index} className="flex gap-2">
                        <Input
                          placeholder={`Room ${index + 1} key number...`}
                          value={key}
                          onChange={(e) => {
                            const newKeys = [...roomKeys]
                            newKeys[index] = e.target.value
                            setRoomKeys(newKeys)
                          }}
                          className="flex-1"
                        />
                        {roomKeys.length > 1 && (
                          <Button
                            variant="outline"
                            size="icon"
                            onClick={() => {
                              setRoomKeys(roomKeys.filter((_, i) => i !== index))
                            }}
                          >
                            <TrashIcon className="size-4" />
                          </Button>
                        )}
                      </div>
                    ))}
                    {roomKeys.length === 0 && (
                      <Input
                        placeholder="Room key number..."
                        value=""
                        onChange={(e) => setRoomKeys([e.target.value])}
                      />
                    )}
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setRoomKeys([...roomKeys, ""])}
                      className="w-full mt-2"
                    >
                      <PlusIcon className="size-4 mr-2" />
                      Add Another Room Key
                    </Button>
                  </div>
                  
                  {/* Keys Taken Count */}
                  <div className="mt-4 pt-4 border-t border-blue-200">
                    <h5 className="text-sm font-medium mb-2">How many keys taken per room?</h5>
                    <div className="flex gap-2">
                      <Button
                        variant={keysTakenCount === 1 ? "default" : "outline"}
                        size="sm"
                        onClick={() => setKeysTakenCount(1)}
                        className="flex-1"
                      >
                        1 Key
                      </Button>
                      <Button
                        variant={keysTakenCount === 2 ? "default" : "outline"}
                        size="sm"
                        onClick={() => setKeysTakenCount(2)}
                        className="flex-1"
                      >
                        2 Keys
                      </Button>
                    </div>
                    <p className="text-xs text-muted-foreground mt-2">
                      This helps track how many keys to collect at checkout
                    </p>
                  </div>
                </div>
              )}

              {/* Check-In Button */}
              <Button
                onClick={handleCheckIn}
                disabled={scannedRegistration.checked_in || false}
                className="w-full h-14 text-lg"
                size="lg"
              >
                {scannedRegistration.checked_in ? (
                  <>
                    <CheckIcon className="mr-2 size-5" />
                    Already Checked In
                  </>
                ) : (
                  <>
                    <CheckIcon className="mr-2 size-5" />
                    Complete Check-In
                  </>
                )}
              </Button>

              {/* Scan Another */}
              <Button variant="outline" onClick={handleReset} className="w-full bg-transparent">
                Scan Another QR Code
              </Button>
            </CardContent>
          </Card>
        )}
      </div>

      <Dialog open={scholarshipDialogOpen} onOpenChange={setScholarshipDialogOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <HandCoinsIcon className="size-4 text-purple-600" />
              Collect Partial Payment
            </DialogTitle>
            <DialogDescription>
              {scannedRegistration ? (
                <>
                  Record an amount the <strong>{scannedRegistration.family_last_name} family</strong> is paying.
                  This will be deducted from their scholarship balance.
                </>
              ) : null}
            </DialogDescription>
          </DialogHeader>

          {scannedRegistration && (() => {
            const regFee = Number(scannedRegistration.registration_fee || 0)
            const lodging = Number(scannedRegistration.lodging_total || 0)
            const tshirts = Number(scannedRegistration.tshirt_total || 0)
            const adventure = Number(scannedRegistration.climbing_tower_total || 0)
            const donation = Number(scannedRegistration.scholarship_donation || 0)
            const fullTotal = regFee + lodging + tshirts + adventure + donation
            const alreadyPaid = Number(scannedRegistration.scholarship_amount_paid || 0)
            const remaining = Math.max(fullTotal - alreadyPaid, 0)
            const parsed = parseFloat(scholarshipAmount)
            const newRemaining = Number.isFinite(parsed) && parsed > 0
              ? Math.max(remaining - parsed, 0)
              : remaining

            return (
              <div className="space-y-4 py-2">
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-1.5">
                    <Label className="text-muted-foreground text-xs">Full Balance</Label>
                    <div className="flex h-10 w-full rounded-md border border-input bg-muted px-3 py-2 text-sm text-muted-foreground items-center">
                      ${fullTotal.toFixed(2)}
                    </div>
                  </div>
                  <div className="space-y-1.5">
                    <Label className="text-muted-foreground text-xs">Already Collected</Label>
                    <div className="flex h-10 w-full rounded-md border border-input bg-muted px-3 py-2 text-sm text-muted-foreground items-center">
                      ${alreadyPaid.toFixed(2)}
                    </div>
                  </div>
                </div>

                <div className="space-y-1.5">
                  <Label htmlFor="scholarship-amount">Amount Collecting Now</Label>
                  <div className="relative">
                    <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground text-sm">$</span>
                    <Input
                      id="scholarship-amount"
                      type="number"
                      min="0"
                      step="0.01"
                      value={scholarshipAmount}
                      onChange={(e) => setScholarshipAmount(e.target.value)}
                      className="pl-6"
                      placeholder="0.00"
                      autoFocus
                    />
                  </div>
                </div>

                <div className="space-y-1.5">
                  <Label htmlFor="scholarship-note">
                    Note <span className="text-muted-foreground">(optional)</span>
                  </Label>
                  <Input
                    id="scholarship-note"
                    value={scholarshipNote}
                    onChange={(e) => setScholarshipNote(e.target.value)}
                    placeholder="e.g. cash, check #1234..."
                  />
                </div>

                <div className="rounded-md bg-purple-50 border border-purple-200 px-3 py-2 text-xs space-y-1">
                  <div className="flex justify-between text-purple-800">
                    <span>Remaining scholarship after this payment</span>
                    <span className="font-semibold">${newRemaining.toFixed(2)}</span>
                  </div>
                  {Number.isFinite(parsed) && parsed >= remaining && remaining > 0 && (
                    <div className="text-green-700 font-medium">
                      This covers the full balance - scholarship will be cleared.
                    </div>
                  )}
                </div>
              </div>
            )
          })()}

          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setScholarshipDialogOpen(false)}
              disabled={savingScholarship}
            >
              Cancel
            </Button>
            <Button onClick={handleRecordScholarshipPayment} disabled={savingScholarship}>
              {savingScholarship ? "Saving..." : "Record Payment"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
