"use client"

import { useEffect, useState } from "react"
import { useSearchParams } from "next/navigation"
import { CheckCircleIcon, XCircleIcon, Loader2Icon, CalendarIcon, ClockIcon } from "lucide-react"
import { Suspense } from "react"

interface ResponseResult {
  success: boolean
  action?: "approve" | "decline"
  firstName?: string
  volunteerType?: string
  assignedDate?: string
  assignedTimeSlot?: string
  error?: string
}

function RespondContent() {
  const searchParams = useSearchParams()
  const token = searchParams.get("token")
  const action = searchParams.get("action") as "approve" | "decline" | null

  const [result, setResult] = useState<ResponseResult | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!token || !action) {
      setResult({ success: false, error: "Invalid link. Please use the link from your email." })
      setLoading(false)
      return
    }

    fetch("/api/volunteers/respond", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ token, action }),
    })
      .then((r) => r.json())
      .then((data) => setResult(data))
      .catch(() => setResult({ success: false, error: "Something went wrong. Please try again." }))
      .finally(() => setLoading(false))
  }, [token, action])

  const isApprove = action === "approve"

  const dateLabel = result?.assignedDate
    ? (() => {
        const raw = result.assignedDate!
        const datePart = raw instanceof Date
          ? (raw as unknown as Date).toISOString().substring(0, 10)
          : String(raw).substring(0, 10)
        return new Date(datePart + "T12:00:00").toLocaleDateString("en-US", {
          weekday: "long", month: "long", day: "numeric", year: "numeric",
        })
      })()
    : null

  return (
    <div className="min-h-screen bg-[#f5f0eb] flex items-center justify-center p-6">
      <div className="w-full max-w-md">
        {/* Header */}
        <div className="text-center mb-8">
          <h1 className="text-2xl font-bold text-[#8B4513]">Rendezvous 2026</h1>
          <p className="text-sm text-[#8B4513]/70 mt-1">May 4–8, 2026 · Carlinville, IL</p>
        </div>

        <div className="bg-white rounded-2xl shadow-md overflow-hidden">
          {loading ? (
            <div className="p-12 flex flex-col items-center gap-4">
              <Loader2Icon className="size-10 text-[#8B4513] animate-spin" />
              <p className="text-muted-foreground text-sm">Processing your response...</p>
            </div>
          ) : result?.success ? (
            <>
              {/* Colored top bar */}
              <div className={`h-2 w-full ${isApprove ? "bg-green-500" : "bg-red-500"}`} />

              <div className="p-8 text-center">
                {isApprove ? (
                  <CheckCircleIcon className="size-16 text-green-500 mx-auto mb-4" />
                ) : (
                  <XCircleIcon className="size-16 text-red-500 mx-auto mb-4" />
                )}

                <h2 className="text-xl font-bold text-foreground mb-2">
                  {isApprove ? "Assignment Accepted!" : "Assignment Declined"}
                </h2>
                <p className="text-muted-foreground text-sm mb-6">
                  {isApprove
                    ? `Thank you, ${result.firstName}! We have recorded your acceptance.`
                    : `Thank you for letting us know, ${result.firstName}. We'll find someone else for this slot.`}
                </p>

                {/* Assignment summary */}
                <div className="bg-[#fef9f0] border border-[#f5c89a] rounded-xl p-4 text-left space-y-3">
                  <div>
                    <p className="text-xs text-muted-foreground uppercase tracking-wide mb-1">Role</p>
                    <p className="font-semibold text-foreground">{result.volunteerType}</p>
                  </div>
                  {dateLabel && (
                    <div className="flex items-center gap-2 text-sm text-foreground">
                      <CalendarIcon className="size-4 text-[#8B4513]" />
                      {dateLabel}
                    </div>
                  )}
                  {result.assignedTimeSlot && (
                    <div className="flex items-center gap-2 text-sm text-foreground">
                      <ClockIcon className="size-4 text-[#8B4513]" />
                      {result.assignedTimeSlot}
                    </div>
                  )}
                </div>

                {isApprove && (
                  <p className="text-xs text-muted-foreground mt-4">
                    Please plan to be ready a few minutes before your assigned session. If you need to change this assignment, please contact Stephen - (217)935-5058
                  </p>
                )}
              </div>
            </>
          ) : (
            <>
              <div className="h-2 w-full bg-amber-500" />
              <div className="p-8 text-center">
                <XCircleIcon className="size-16 text-amber-500 mx-auto mb-4" />
                <h2 className="text-xl font-bold text-foreground mb-2">Something Went Wrong</h2>
                <p className="text-muted-foreground text-sm">
                  {result?.error || "This link may be invalid or has already been used."}
                </p>
              </div>
            </>
          )}
        </div>

        <p className="text-center text-xs text-[#8B4513]/50 mt-6">
          Rendezvous 2026 · Lake Williamson Christian Center
        </p>
      </div>
    </div>
  )
}

export default function VolunteerRespondPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-[#f5f0eb] flex items-center justify-center">
        <Loader2Icon className="size-10 text-[#8B4513] animate-spin" />
      </div>
    }>
      <RespondContent />
    </Suspense>
  )
}
