"use client"

import { useEffect, useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { LightbulbIcon, ArrowLeftIcon } from "lucide-react"
import Link from "next/link"

interface SessionSuggestion {
  id: number
  registration_id: number
  session_type: string
  suggestion: string
  family_last_name: string
  email: string
}

export default function SessionsPage() {
  const [suggestions, setSuggestions] = useState<SessionSuggestion[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const fetchSuggestions = async () => {
      try {
        const response = await fetch("/api/session-suggestions")
        const data = await response.json()
        setSuggestions(data)
      } catch (error) {
        console.error("[v0] Error fetching suggestions:", error)
      } finally {
        setLoading(false)
      }
    }

    fetchSuggestions()
  }, [])

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary" />
      </div>
    )
  }

  // Group by session type
  const groupedSuggestions = suggestions.reduce(
    (acc, sug) => {
      if (!acc[sug.session_type]) {
        acc[sug.session_type] = []
      }
      acc[sug.session_type].push(sug)
      return acc
    },
    {} as Record<string, SessionSuggestion[]>,
  )

  return (
    <div className="min-h-screen bg-muted/30 p-6">
      <div className="max-w-7xl mx-auto space-y-6">
        <div className="flex items-center gap-4">
          <Link href="/admin">
            <Button variant="ghost" size="sm">
              <ArrowLeftIcon className="mr-2 size-4" />
              Back to Dashboard
            </Button>
          </Link>
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Session Suggestions</h1>
            <p className="text-muted-foreground mt-1">View all session ideas and suggestions from families</p>
          </div>
        </div>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Total Suggestions</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{suggestions.length}</div>
          </CardContent>
        </Card>

        {Object.entries(groupedSuggestions).map(([type, sugs]) => (
          <Card key={type}>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <LightbulbIcon className="size-5" />
                {type}
              </CardTitle>
              <CardDescription>{sugs.length} suggestion(s)</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {sugs.map((sug) => (
                  <div key={sug.id} className="border rounded-lg p-4 space-y-2">
                    <div className="flex items-start justify-between">
                      <div className="font-medium">{sug.family_last_name} Family</div>
                      <Badge variant="outline">{sug.session_type}</Badge>
                    </div>
                    <div className="text-sm text-muted-foreground">{sug.email}</div>
                    <div className="text-sm mt-2">{sug.suggestion}</div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        ))}

        {suggestions.length === 0 && (
          <Card>
            <CardContent className="text-center py-8 text-muted-foreground">No session suggestions yet</CardContent>
          </Card>
        )}
      </div>
    </div>
  )
}
