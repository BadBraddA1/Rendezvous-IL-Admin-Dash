"use client"

import { useEffect, useState } from "react"
import { useSearchParams } from "next/navigation"
import { CheckIcon, LockIcon, UserIcon } from "lucide-react"
import { Button } from "@/components/ui/button"
import { cn } from "@/lib/utils"
import { Suspense } from "react"

interface Topic {
  id: number
  title: string
  description: string | null
  claimed_by_volunteer_id: number | null
  claimed_by_name: string | null
}

interface BidData {
  id: number
  invitee_name: string
  invitee_email: string
  claimed_topic_id: number | null
  submitted_at: string | null
  topics: Topic[]
}

function PickForm() {
  const searchParams = useSearchParams()
  const token = searchParams.get("token")

  const [data, setData] = useState<BidData | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState("")
  const [selected, setSelected] = useState<number | null>(null)
  const [submitting, setSubmitting] = useState(false)
  const [submitted, setSubmitted] = useState(false)
  const [claimedTitle, setClaimedTitle] = useState("")

  useEffect(() => {
    if (!token) { setError("Invalid link — no token found."); setLoading(false); return }
    fetch(`/api/lessons/pick?token=${token}`)
      .then((r) => r.json())
      .then((d) => {
        if (d.error) { setError(d.error); return }
        setData(d)
        if (d.submitted_at && d.claimed_topic_id) {
          setSubmitted(true)
          setSelected(d.claimed_topic_id)
          const t = d.topics.find((x: Topic) => x.id === d.claimed_topic_id)
          if (t) setClaimedTitle(t.title)
        }
      })
      .catch(() => setError("Failed to load. Please try again."))
      .finally(() => setLoading(false))
  }, [token])

  const handleClaim = async () => {
    if (!selected || submitting || submitted) return
    setSubmitting(true)
    setError("")
    try {
      const res = await fetch(`/api/lessons/pick?token=${token}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ topic_id: selected }),
      })
      const json = await res.json()
      if (!res.ok) {
        setError(json.error || "Claim failed")
        // Refresh topics to show updated availability
        const refresh = await fetch(`/api/lessons/pick?token=${token}`)
        const fresh = await refresh.json()
        if (!fresh.error) setData(fresh)
        setSelected(null)
        return
      }
      setSubmitted(true)
      setClaimedTitle(json.topic)
    } catch {
      setError("Something went wrong. Please try again.")
    } finally {
      setSubmitting(false)
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#f5f0e8]">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-amber-800" />
      </div>
    )
  }

  if (error && !data) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#f5f0e8] p-4">
        <div className="bg-white rounded-2xl shadow-md p-8 max-w-sm w-full text-center space-y-3">
          <div className="flex items-center justify-center w-12 h-12 rounded-full bg-red-100 mx-auto">
            <LockIcon className="size-5 text-red-500" />
          </div>
          <h2 className="text-lg font-semibold">Link Error</h2>
          <p className="text-sm text-muted-foreground">{error}</p>
        </div>
      </div>
    )
  }

  if (!data) return null

  const availableCount = data.topics.filter((t) => !t.claimed_by_volunteer_id).length

  return (
    <div className="min-h-screen bg-[#f5f0e8]">
      {/* Header */}
      <div className="bg-white border-b border-stone-200 sticky top-0 z-10">
        <div className="max-w-2xl mx-auto px-4 py-4 flex items-center justify-between">
          <div>
            <p className="text-xs text-amber-700 font-semibold uppercase tracking-wider">Rendezvous 2026</p>
            <h1 className="text-base font-bold leading-tight">Lesson Presenter Selection</h1>
          </div>
          {!submitted && (
            <div className="flex items-center gap-1.5 bg-stone-100 border border-stone-200 rounded-full px-3 py-1">
              <span className="text-xs font-semibold text-stone-700">{availableCount}</span>
              <span className="text-xs text-stone-500">available</span>
            </div>
          )}
        </div>
      </div>

      <div className="max-w-2xl mx-auto px-4 py-6 space-y-5">

        {/* Success state */}
        {submitted ? (
          <div className="bg-green-50 border border-green-200 rounded-2xl p-6 text-center space-y-3">
            <div className="flex items-center justify-center w-14 h-14 rounded-full bg-green-100 mx-auto">
              <CheckIcon className="size-7 text-green-600" />
            </div>
            <h2 className="text-lg font-bold text-green-900">Topic Claimed!</h2>
            <p className="text-sm text-green-700">
              <strong>{data.invitee_name}</strong>, you have claimed:
            </p>
            <div className="bg-white border border-green-200 rounded-xl px-4 py-3 text-sm font-semibold text-green-900">
              {claimedTitle}
            </div>
            <p className="text-xs text-green-600">
              The coordinator will be in touch with your assigned day and session.
            </p>
          </div>
        ) : (
          <div className="bg-white rounded-2xl p-5 border border-stone-200 shadow-sm space-y-1">
            <p className="text-sm font-semibold">Hi, {data.invitee_name}!</p>
            <p className="text-sm text-muted-foreground leading-relaxed">
              Select the lesson topic you would like to present and tap <strong>Claim It</strong>. Topics are claimed on a first-come, first-served basis — once claimed, they are locked.
            </p>
          </div>
        )}

        {/* Error banner (conflict) */}
        {error && data && (
          <div className="bg-red-50 border border-red-200 rounded-xl px-4 py-3 text-sm text-red-800">
            {error}
          </div>
        )}

        {/* Topic list */}
        {!submitted && (
          <div className="space-y-2.5">
            {data.topics.map((topic) => {
              const isClaimed = !!topic.claimed_by_volunteer_id
              const isSelected = selected === topic.id
              const isMine = data.claimed_topic_id === topic.id

              return (
                <button
                  key={topic.id}
                  onClick={() => !isClaimed && !submitted && setSelected(isSelected ? null : topic.id)}
                  disabled={isClaimed || submitted}
                  className={cn(
                    "w-full text-left rounded-2xl border-2 p-4 transition-all",
                    isClaimed
                      ? "border-stone-200 bg-stone-50 opacity-60 cursor-not-allowed"
                      : isSelected
                        ? "border-amber-500 bg-amber-50 shadow-md"
                        : "border-stone-200 bg-white hover:border-amber-300 hover:shadow-sm cursor-pointer"
                  )}
                >
                  <div className="flex items-start gap-3">
                    {/* Status indicator */}
                    <div className={cn(
                      "flex items-center justify-center rounded-full shrink-0 w-7 h-7 mt-0.5",
                      isClaimed
                        ? "bg-stone-200"
                        : isSelected
                          ? "bg-amber-600"
                          : "bg-stone-100"
                    )}>
                      {isClaimed
                        ? <LockIcon className="size-3.5 text-stone-500" />
                        : isSelected
                          ? <CheckIcon className="size-3.5 text-white" />
                          : <span className="text-xs font-semibold text-stone-400" />
                      }
                    </div>

                    <div className="flex-1 min-w-0">
                      <p className={cn(
                        "font-semibold text-sm leading-snug",
                        isClaimed ? "text-stone-400" : isSelected ? "text-amber-900" : "text-foreground"
                      )}>
                        {topic.title}
                      </p>
                      {topic.description && !isClaimed && (
                        <p className="text-xs text-muted-foreground mt-1 leading-relaxed">{topic.description}</p>
                      )}
                      {isClaimed && (
                        <div className="flex items-center gap-1 mt-1">
                          <UserIcon className="size-3 text-stone-400" />
                          <span className="text-xs text-stone-400">
                            Claimed by {topic.claimed_by_name ?? "someone"}
                          </span>
                        </div>
                      )}
                    </div>

                    {isClaimed && (
                      <span className="shrink-0 text-[10px] font-bold uppercase tracking-wide text-stone-400 bg-stone-100 px-2 py-1 rounded-full">
                        Taken
                      </span>
                    )}
                  </div>
                </button>
              )
            })}
          </div>
        )}

        {/* Claim button */}
        {!submitted && (
          <div className="sticky bottom-4">
            <div className="bg-white/90 backdrop-blur rounded-2xl border border-stone-200 shadow-lg p-4 space-y-2">
              {!selected && (
                <p className="text-xs text-center text-muted-foreground">Tap a topic above to select it</p>
              )}
              {selected && (
                <p className="text-xs text-center text-amber-700 font-medium">
                  "{data.topics.find(t => t.id === selected)?.title}" — tap to confirm
                </p>
              )}
              <Button
                className="w-full bg-amber-700 hover:bg-amber-800 text-white font-semibold"
                size="lg"
                disabled={!selected || submitting}
                onClick={handleClaim}
              >
                {submitting ? "Claiming..." : "Claim It"}
              </Button>
            </div>
          </div>
        )}

        <p className="text-center text-xs text-muted-foreground pb-8">
          Rendezvous 2026 · Lake Williamson Christian Center
        </p>
      </div>
    </div>
  )
}

export default function LessonPickPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen flex items-center justify-center bg-[#f5f0e8]">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-amber-800" />
      </div>
    }>
      <PickForm />
    </Suspense>
  )
}
