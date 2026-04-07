"use client"

import { useEffect, useState, useRef } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { CheckIcon, AlertCircleIcon, DollarSignIcon, ScanIcon, XIcon, CameraIcon, KeyboardIcon, HomeIcon, UserIcon, PlusIcon, TrashIcon, KeyIcon } from "lucide-react"
import { useToast } from "@/hooks/use-toast"
import { Input } from "@/components/ui/input"

interface FamilyMember {
  id: number
  first_name: string
  last_name: string
  age: number | null
  is_baptized: boolean | null
}

interface Registration {
  id: number
  family_last_name: string
  email: string
  payment_status: string | null
  registration_fee: number | null
  lodging_total: number | null
  tshirt_total: number | null
  scholarship_donation: number | null
  scholarship_requested: boolean | null
  lodging_type: string | null
  full_payment_paid: boolean | null
  family_member_count?: number
  checked_in: boolean | null
  checkin_qr_code: string | null
  room_keys: string[] | null
  family_members?: FamilyMember[]
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
      setRoomKeys(data.room_keys || [])
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
          room_keys: isMotel ? roomKeys.filter(k => k.trim()) : null 
        }),
      })

      if (response.ok) {
        toast({
          title: "Success",
          description: `${scannedRegistration.family_last_name} family checked in successfully`,
        })
        setScannedRegistration(null)
        setRoomKeys([])
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
                          {member.age ? `Age ${member.age}` : ""}
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
                const donation = Number(scannedRegistration.scholarship_donation || 0)
                const total = regFee + lodging + tshirts + donation
                const isPaid = scannedRegistration.payment_status === "paid"

                return (
                  <div className={`p-4 rounded-lg ${isPaid ? "bg-green-500/10" : "bg-amber-500/10"}`}>
                    <div className="flex items-center justify-between mb-3">
                      <h4 className="font-medium text-sm flex items-center gap-2">
                        <DollarSignIcon className="size-4" />
                        {isPaid ? "Payment Complete" : "Amount Due at Check-In"}
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
                      {regFee > 0 && (
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
                      {donation > 0 && (
                        <div className="flex justify-between">
                          <span className="text-muted-foreground">Scholarship Donation</span>
                          <span>${donation.toFixed(2)}</span>
                        </div>
                      )}
                      <div className="flex justify-between pt-2 border-t font-semibold text-base">
                        <span>Total</span>
                        <span className={isPaid ? "text-green-600" : "text-amber-600"}>${total.toFixed(2)}</span>
                      </div>
                    </div>
                    {!isPaid && (
                      <Button onClick={handlePaymentReceived} className="w-full mt-4 gap-2" variant="outline">
                        <DollarSignIcon className="size-4" />
                        Mark Payment Received
                      </Button>
                    )}
                  </div>
                )
              })()}

              {/* Room Keys - Only show for Motel lodging */}
              {scannedRegistration.lodging_type?.toLowerCase().includes("motel") && (
                <div className="p-4 bg-blue-500/10 rounded-lg">
                  <h4 className="font-medium text-sm mb-3 flex items-center gap-2">
                    <KeyIcon className="size-4" />
                    Room Key Numbers
                  </h4>
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
    </div>
  )
}
