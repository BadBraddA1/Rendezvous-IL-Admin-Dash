"use client"

import { useEffect, useState, useRef } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { CheckIcon, KeyIcon, SearchIcon, XIcon, UserIcon, AlertCircleIcon, ScanIcon } from "lucide-react"
import { useToast } from "@/hooks/use-toast"

interface CheckedInRegistration {
  id: number
  family_last_name: string
  email: string
  lodging_type: string | null
  room_keys: string[] | null
  keys_taken_count: number | null
  checked_in: boolean
  checked_in_at: string | null
  keys_returned: boolean | null
  keys_returned_at: string | null
  family_member_count: number
  checkin_qr_code: string | null
}

export default function CheckoutPage() {
  const [registrations, setRegistrations] = useState<CheckedInRegistration[]>([])
  const [loading, setLoading] = useState(true)
  const [searchQuery, setSearchQuery] = useState("")
  const [selectedFamily, setSelectedFamily] = useState<CheckedInRegistration | null>(null)
  const [processing, setProcessing] = useState(false)
  const { toast } = useToast()
  const searchRef = useRef<HTMLInputElement>(null)

  const fetchRegistrations = async () => {
    try {
      const response = await fetch("/api/registrations/checked-in")
      const data = await response.json()
      // Only get motel registrations with keys that haven't been returned yet
      const motelWithKeys = (Array.isArray(data) ? data : []).filter(
        (r: CheckedInRegistration) => 
          r.lodging_type?.toLowerCase().includes("motel") && 
          r.room_keys && 
          r.room_keys.length > 0
      )
      setRegistrations(motelWithKeys)
    } catch (error) {
      console.error("Error fetching registrations:", error)
      setRegistrations([])
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchRegistrations()
    searchRef.current?.focus()
  }, [])

  // Filter registrations by search query (family name or QR code)
  const filteredRegistrations = registrations.filter(r => {
    if (!searchQuery.trim()) return true
    const query = searchQuery.toLowerCase().trim()
    return (
      r.family_last_name.toLowerCase().includes(query) ||
      r.checkin_qr_code?.toLowerCase().includes(query) ||
      r.room_keys?.some(key => key.toLowerCase().includes(query))
    )
  })

  // Outstanding keys only
  const outstandingKeys = filteredRegistrations.filter(r => !r.keys_returned)
  const returnedKeys = filteredRegistrations.filter(r => r.keys_returned)

  const handleSelectFamily = (reg: CheckedInRegistration) => {
    setSelectedFamily(reg)
    setSearchQuery("")
  }

  const handleMarkReturned = async () => {
    if (!selectedFamily) return
    setProcessing(true)
    try {
      const response = await fetch(`/api/registrations/${selectedFamily.id}/keys-returned`, {
        method: "POST",
      })

      if (response.ok) {
        toast({
          title: "Keys Returned",
          description: `${selectedFamily.family_last_name} family keys marked as returned`,
        })
        setSelectedFamily(null)
        fetchRegistrations()
      } else {
        throw new Error("Failed to mark keys returned")
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to process checkout",
        variant: "destructive",
      })
    } finally {
      setProcessing(false)
    }
  }

  const handleUndoReturn = async (id: number) => {
    try {
      const response = await fetch(`/api/registrations/${id}/keys-returned`, {
        method: "DELETE",
      })

      if (response.ok) {
        toast({
          title: "Undo Successful",
          description: "Key return has been undone",
        })
        fetchRegistrations()
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to undo return",
        variant: "destructive",
      })
    }
  }

  const formatTime = (dateString: string | null) => {
    if (!dateString) return "-"
    const date = new Date(dateString)
    return date.toLocaleString("en-US", {
      month: "short",
      day: "numeric",
      hour: "numeric",
      minute: "2-digit",
      hour12: true,
    })
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-muted/30 flex items-center justify-center">
        <div className="size-8 animate-spin rounded-full border-4 border-primary border-t-transparent" />
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-muted/30 p-4 md:p-6">
      <div className="max-w-4xl mx-auto space-y-6">
        {/* Header */}
        <div className="text-center">
          <h1 className="text-2xl font-bold tracking-tight">Key Checkout Station</h1>
          <p className="text-sm text-muted-foreground mt-1">
            Search by family name or room key number
          </p>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-2 gap-4">
          <Card className="border-amber-200 bg-amber-50/50">
            <CardContent className="pt-6">
              <div className="flex items-center justify-center gap-3">
                <KeyIcon className="size-6 text-amber-600" />
                <div className="text-center">
                  <p className="text-3xl font-bold text-amber-700">{outstandingKeys.length}</p>
                  <p className="text-sm text-muted-foreground">Keys Outstanding</p>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card className="border-green-200 bg-green-50/50">
            <CardContent className="pt-6">
              <div className="flex items-center justify-center gap-3">
                <CheckIcon className="size-6 text-green-600" />
                <div className="text-center">
                  <p className="text-3xl font-bold text-green-700">{returnedKeys.length}</p>
                  <p className="text-sm text-muted-foreground">Keys Returned</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Selected Family Card */}
        {selectedFamily && (
          <Card className="border-2 border-primary">
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <CardTitle className="text-xl">{selectedFamily.family_last_name} Family</CardTitle>
                <Button variant="ghost" size="icon" onClick={() => setSelectedFamily(null)}>
                  <XIcon className="size-4" />
                </Button>
              </div>
              <CardDescription className="flex items-center gap-1">
                <UserIcon className="size-3" />
                {selectedFamily.family_member_count} members
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {/* Room Keys Display */}
              <div className="p-4 bg-muted rounded-lg">
                <div className="flex items-center justify-between mb-2">
                  <p className="text-sm font-medium">Room Keys to Return:</p>
                  <Badge variant="outline" className="bg-amber-100 text-amber-800 border-amber-300">
                    {selectedFamily.keys_taken_count || 2} key{(selectedFamily.keys_taken_count || 2) !== 1 ? 's' : ''} per room
                  </Badge>
                </div>
                <div className="flex flex-wrap gap-2">
                  {selectedFamily.room_keys?.map((key, idx) => (
                    <div key={idx} className="flex flex-col items-center">
                      <Badge variant="secondary" className="text-lg font-mono px-4 py-2">
                        {key}
                      </Badge>
                      <span className="text-xs text-muted-foreground mt-1">
                        {selectedFamily.keys_taken_count || 2} key{(selectedFamily.keys_taken_count || 2) !== 1 ? 's' : ''}
                      </span>
                    </div>
                  ))}
                </div>
                {/* Total keys calculation */}
                <div className="mt-3 pt-3 border-t border-muted-foreground/20 text-center">
                  <p className="text-sm text-muted-foreground">
                    Total keys to collect: <span className="font-bold text-foreground">{(selectedFamily.room_keys?.length || 0) * (selectedFamily.keys_taken_count || 2)}</span>
                  </p>
                </div>
              </div>

              {/* Status */}
              {selectedFamily.keys_returned ? (
                <div className="p-4 bg-green-500/10 rounded-lg text-center">
                  <CheckIcon className="size-8 mx-auto mb-2 text-green-600" />
                  <p className="font-medium text-green-700">Keys Already Returned</p>
                  <p className="text-sm text-muted-foreground">{formatTime(selectedFamily.keys_returned_at)}</p>
                </div>
              ) : (
                <Button 
                  onClick={handleMarkReturned} 
                  disabled={processing}
                  className="w-full h-14 text-lg"
                  size="lg"
                >
                  {processing ? (
                    <>
                      <div className="mr-2 size-5 animate-spin rounded-full border-2 border-background border-t-transparent" />
                      Processing...
                    </>
                  ) : (
                    <>
                      <CheckIcon className="mr-2 size-5" />
                      Mark Keys Returned
                    </>
                  )}
                </Button>
              )}
            </CardContent>
          </Card>
        )}

        {/* Search Box */}
        {!selectedFamily && (
          <Card>
            <CardContent className="pt-6">
              <div className="relative">
                <SearchIcon className="absolute left-3 top-1/2 -translate-y-1/2 size-5 text-muted-foreground" />
                <Input
                  ref={searchRef}
                  placeholder="Search by family name or room key..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-10 h-14 text-lg"
                  autoFocus
                />
              </div>
            </CardContent>
          </Card>
        )}

        {/* Outstanding Keys List */}
        {!selectedFamily && outstandingKeys.length > 0 && (
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="flex items-center gap-2 text-lg">
                <AlertCircleIcon className="size-5 text-amber-500" />
                Outstanding Keys
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                {outstandingKeys.map((reg) => (
                  <button
                    key={reg.id}
                    onClick={() => handleSelectFamily(reg)}
                    className="w-full p-4 rounded-lg border hover:bg-muted/50 transition-colors text-left flex items-center justify-between"
                  >
                    <div>
                      <p className="font-medium">{reg.family_last_name}</p>
                      <div className="flex gap-1 mt-1">
                        {reg.room_keys?.map((key, idx) => (
                          <Badge key={idx} variant="outline" className="font-mono text-xs">
                            {key}
                          </Badge>
                        ))}
                      </div>
                    </div>
                    <KeyIcon className="size-5 text-amber-500" />
                  </button>
                ))}
              </div>
            </CardContent>
          </Card>
        )}

        {/* Returned Keys List (Collapsed) */}
        {!selectedFamily && returnedKeys.length > 0 && (
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="flex items-center gap-2 text-lg">
                <CheckIcon className="size-5 text-green-500" />
                Returned Keys
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                {returnedKeys.map((reg) => (
                  <div
                    key={reg.id}
                    className="p-4 rounded-lg border bg-muted/30 flex items-center justify-between"
                  >
                    <div>
                      <p className="font-medium text-muted-foreground">{reg.family_last_name}</p>
                      <div className="flex gap-1 mt-1">
                        {reg.room_keys?.map((key, idx) => (
                          <Badge key={idx} variant="outline" className="font-mono text-xs opacity-60">
                            {key}
                          </Badge>
                        ))}
                      </div>
                      <p className="text-xs text-muted-foreground mt-1">
                        Returned {formatTime(reg.keys_returned_at)}
                      </p>
                    </div>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleUndoReturn(reg.id)}
                    >
                      Undo
                    </Button>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        )}

        {/* Empty State */}
        {!selectedFamily && outstandingKeys.length === 0 && returnedKeys.length === 0 && (
          <Card>
            <CardContent className="py-12 text-center">
              <CheckIcon className="size-12 mx-auto mb-4 text-green-500 opacity-50" />
              <p className="text-lg font-medium">All Keys Returned</p>
              <p className="text-sm text-muted-foreground">No outstanding room keys</p>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  )
}
