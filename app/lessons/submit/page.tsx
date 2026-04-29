"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Loader2, CheckCircle2, BookOpen, Send } from "lucide-react"
import { useSearchParams } from "next/navigation"

interface SpeakerData {
  name: string
  topicTitle: string
  lessonTitle?: string
  scriptureReading?: string
}

export default function SubmitLessonPage() {
  const searchParams = useSearchParams()
  const token = searchParams.get("token")
  
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [speaker, setSpeaker] = useState<SpeakerData | null>(null)
  const [lessonTitle, setLessonTitle] = useState("")
  const [scriptureReading, setScriptureReading] = useState("")
  const [submitting, setSubmitting] = useState(false)
  const [submitted, setSubmitted] = useState(false)

  useEffect(() => {
    if (!token) {
      setError("No token provided. Please use the link from your email.")
      setLoading(false)
      return
    }

    fetch(`/api/lessons/submit?token=${token}`)
      .then(res => res.json())
      .then(data => {
        if (data.error) {
          setError(data.error)
        } else {
          setSpeaker(data)
          setLessonTitle(data.lessonTitle || "")
          setScriptureReading(data.scriptureReading || "")
        }
      })
      .catch(() => setError("Failed to load your information"))
      .finally(() => setLoading(false))
  }, [token])

  const handleSubmit = async () => {
    if (!lessonTitle.trim()) {
      alert("Please enter your lesson title")
      return
    }
    
    setSubmitting(true)
    try {
      const res = await fetch("/api/lessons/submit", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ token, lessonTitle, scriptureReading }),
      })
      const data = await res.json()
      if (res.ok) {
        setSubmitted(true)
      } else {
        alert(data.error || "Failed to submit")
      }
    } catch {
      alert("Failed to submit. Please try again.")
    } finally {
      setSubmitting(false)
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <Loader2 className="size-8 animate-spin text-amber-700" />
      </div>
    )
  }

  if (error) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center p-4">
        <Card className="max-w-md w-full">
          <CardHeader className="text-center">
            <CardTitle className="text-red-600">Error</CardTitle>
            <CardDescription>{error}</CardDescription>
          </CardHeader>
          <CardContent className="text-center">
            <p className="text-sm text-muted-foreground">
              If you need help, text Stephen at <a href="sms:+16185812180" className="text-amber-700 underline">(618) 581-2180</a>
            </p>
          </CardContent>
        </Card>
      </div>
    )
  }

  if (submitted) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center p-4">
        <Card className="max-w-md w-full">
          <CardHeader className="text-center">
            <div className="mx-auto mb-4 size-16 rounded-full bg-green-100 flex items-center justify-center">
              <CheckCircle2 className="size-8 text-green-600" />
            </div>
            <CardTitle className="text-green-700">Submitted!</CardTitle>
            <CardDescription>
              Your lesson details have been saved. Thank you, {speaker?.name}!
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="bg-amber-50 border border-amber-200 rounded-lg p-4">
              <p className="text-sm text-amber-800">
                <strong>Topic:</strong> {speaker?.topicTitle}
              </p>
              <p className="text-sm text-amber-800 mt-1">
                <strong>Your Title:</strong> {lessonTitle}
              </p>
              {scriptureReading && (
                <p className="text-sm text-amber-800 mt-1">
                  <strong>Scripture:</strong> {scriptureReading}
                </p>
              )}
            </div>
            <p className="text-sm text-center text-muted-foreground">
              You can close this page. See you at Rendezvous 2026!
            </p>
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-background py-8 px-4">
      <div className="max-w-lg mx-auto space-y-6">
        {/* Header */}
        <div className="text-center">
          <h1 className="text-3xl font-bold text-amber-900">Rendezvous 2026</h1>
          <p className="text-muted-foreground">Submit Your Lesson Details</p>
        </div>

        {/* Topic Card */}
        <Card className="border-amber-200 bg-amber-50/50">
          <CardHeader className="pb-2">
            <CardDescription>Your Assigned Topic</CardDescription>
            <CardTitle className="text-amber-900 flex items-center gap-2">
              <BookOpen className="size-5" />
              {speaker?.topicTitle}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground">
              Hello <strong>{speaker?.name}</strong>! Please provide the details below for the program.
            </p>
          </CardContent>
        </Card>

        {/* Form */}
        <Card>
          <CardHeader>
            <CardTitle>Lesson Information</CardTitle>
            <CardDescription>
              This will be displayed in the Rendezvous program
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="lessonTitle">
                Lesson Title <span className="text-red-500">*</span>
              </Label>
              <Input
                id="lessonTitle"
                value={lessonTitle}
                onChange={(e) => setLessonTitle(e.target.value)}
                placeholder="e.g., Walking by Faith in Uncertain Times"
              />
              <p className="text-xs text-muted-foreground">
                The specific title you want displayed in the program
              </p>
            </div>

            <div className="space-y-2">
              <Label htmlFor="scriptureReading">Scripture Reading</Label>
              <Textarea
                id="scriptureReading"
                value={scriptureReading}
                onChange={(e) => setScriptureReading(e.target.value)}
                placeholder="e.g., Hebrews 11:1-6"
                rows={2}
              />
              <p className="text-xs text-muted-foreground">
                The passage you would like read before your lesson (optional)
              </p>
            </div>

            <Button
              onClick={handleSubmit}
              disabled={submitting || !lessonTitle.trim()}
              className="w-full bg-amber-700 hover:bg-amber-800"
            >
              {submitting ? (
                <><Loader2 className="size-4 mr-2 animate-spin" />Submitting...</>
              ) : (
                <><Send className="size-4 mr-2" />Submit Lesson Details</>
              )}
            </Button>
          </CardContent>
        </Card>

        {/* Contact */}
        <p className="text-center text-sm text-muted-foreground">
          Questions? Text Stephen at{" "}
          <a href="sms:+16185812180" className="text-amber-700 underline">(618) 581-2180</a>
        </p>
      </div>
    </div>
  )
}
