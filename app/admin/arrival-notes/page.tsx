"use client"

import { useEffect, useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { ClockIcon, ArrowLeftIcon, UsersIcon, PhoneIcon } from "lucide-react"
import Link from "next/link"

interface ArrivalNote {
  id: number
  family_last_name: string
  email: string
  husband_phone: string | null
  wife_phone: string | null
  arrival_notes: string
  lodging_type: string | null
  first_person_name: string | null
  family_member_count: number
}

export default function ArrivalNotesPage() {
  const [notes, setNotes] = useState<ArrivalNote[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    fetch("/api/registrations/arrival-notes")
      .then((r) => r.json())
      .then((data) => {
        if (Array.isArray(data)) setNotes(data)
        else setError("Failed to load data")
      })
      .catch(() => setError("Failed to load arrival notes"))
      .finally(() => setLoading(false))
  }, [])

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <div className="border-b bg-gradient-to-r from-orange-50 to-amber-50">
        <div className="max-w-5xl mx-auto px-4 py-6">
          <div className="flex items-center gap-3 mb-2">
            <Link href="/admin">
              <Button variant="ghost" size="sm" className="gap-1.5 text-muted-foreground">
                <ArrowLeftIcon className="size-4" />
                Back to Dashboard
              </Button>
            </Link>
          </div>
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-lg bg-orange-100 border border-orange-200">
              <ClockIcon className="size-5 text-orange-600" />
            </div>
            <div>
              <h1 className="text-2xl font-bold tracking-tight">Arrival Notes</h1>
              <p className="text-sm text-muted-foreground">
                Families with late arrival or early departure information
              </p>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-5xl mx-auto px-4 py-6 space-y-4">
        {loading && (
          <div className="text-center py-16 text-muted-foreground">Loading arrival notes...</div>
        )}

        {error && (
          <div className="text-center py-16 text-red-500">{error}</div>
        )}

        {!loading && !error && notes.length === 0 && (
          <div className="text-center py-16 text-muted-foreground">
            No families have submitted arrival notes.
          </div>
        )}

        {!loading && !error && notes.length > 0 && (
          <>
            <div className="text-sm text-muted-foreground font-medium">
              {notes.length} {notes.length === 1 ? "family" : "families"} with arrival notes
            </div>

            {notes.map((entry) => (
              <Card key={entry.id} className="border-orange-100">
                <CardHeader className="pb-3">
                  <div className="flex items-start justify-between gap-4">
                    <div>
                      <CardTitle className="text-base">
                        {entry.family_last_name} Family
                        {entry.first_person_name && (
                          <span className="font-normal text-muted-foreground ml-1.5">
                            — {entry.first_person_name}
                          </span>
                        )}
                      </CardTitle>
                      <CardDescription className="mt-1 flex items-center gap-3 flex-wrap">
                        <span className="flex items-center gap-1">
                          <UsersIcon className="size-3.5" />
                          {entry.family_member_count} member{Number(entry.family_member_count) !== 1 ? "s" : ""}
                        </span>
                        {(entry.husband_phone || entry.wife_phone) && (
                          <span className="flex items-center gap-1">
                            <PhoneIcon className="size-3.5" />
                            {entry.husband_phone || entry.wife_phone}
                          </span>
                        )}
                      </CardDescription>
                    </div>
                    <div className="flex items-center gap-2 shrink-0">
                      {entry.lodging_type && (
                        <Badge variant="outline" className="text-xs">
                          {entry.lodging_type}
                        </Badge>
                      )}
                      <Badge variant="outline" className="text-xs border-orange-300 text-orange-700 bg-orange-50">
                        Has Note
                      </Badge>
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="rounded-md border border-orange-100 bg-orange-50/60 px-4 py-3">
                    <p className="text-sm text-foreground leading-relaxed whitespace-pre-wrap">
                      {entry.arrival_notes}
                    </p>
                  </div>
                </CardContent>
              </Card>
            ))}
          </>
        )}
      </div>
    </div>
  )
}
