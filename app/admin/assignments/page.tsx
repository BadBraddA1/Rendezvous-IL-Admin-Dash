"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Badge } from "@/components/ui/badge"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { useToast } from "@/hooks/use-toast"
import { 
  ArrowLeftIcon, 
  Loader2Icon, 
  TrashIcon, 
  UploadIcon, 
  RefreshCwIcon,
  CheckCircle2Icon,
  XCircleIcon,
  CalendarIcon,
  UsersIcon
} from "lucide-react"
import Link from "next/link"

interface Assignment {
  id: number
  activity_name: string
  assigned_name: string
  assigned_date: string | null
  time_slot: string | null
  notes: string | null
  registration_id: number | null
  family_member_id: number | null
  family_last_name?: string
  matched_first_name?: string
}

export default function AssignmentsPage() {
  const [assignments, setAssignments] = useState<Assignment[]>([])
  const [loading, setLoading] = useState(true)
  const [importing, setImporting] = useState(false)
  const [rematching, setRematching] = useState(false)
  const [importText, setImportText] = useState("")
  const { toast } = useToast()

  const fetchAssignments = async () => {
    setLoading(true)
    try {
      const res = await fetch("/api/assignments")
      const data = await res.json()
      setAssignments(data)
    } catch {
      toast({ title: "Error", description: "Failed to load assignments", variant: "destructive" })
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchAssignments()
  }, [])

  const handleImport = async () => {
    if (!importText.trim()) {
      toast({ title: "No Data", description: "Please paste assignment data", variant: "destructive" })
      return
    }

    setImporting(true)
    try {
      // Parse the pasted text - expecting format like:
      // Activity Name | Person Name | Date | Time
      // or tab/comma separated
      const lines = importText.trim().split("\n").filter(line => line.trim())
      const assignments = []

      for (const line of lines) {
        // Try different delimiters
        let parts = line.includes("\t") ? line.split("\t") : line.split("|").map(p => p.trim())
        
        if (parts.length >= 2) {
          const activity_name = parts[0].trim()
          const assigned_name = parts[1].trim()
          const assigned_date = parts[2]?.trim() || null
          const time_slot = parts[3]?.trim() || null
          const notes = parts[4]?.trim() || null

          // Skip header rows
          if (activity_name.toLowerCase().includes("activity") && assigned_name.toLowerCase().includes("name")) {
            continue
          }

          assignments.push({ activity_name, assigned_name, assigned_date, time_slot, notes })
        }
      }

      if (assignments.length === 0) {
        toast({ title: "No Valid Data", description: "Could not parse any assignments from the text", variant: "destructive" })
        setImporting(false)
        return
      }

      const res = await fetch("/api/assignments", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ assignments })
      })

      const data = await res.json()
      
      if (!res.ok) {
        toast({ 
          title: "Import Failed", 
          description: data.error || "Unknown error occurred",
          variant: "destructive"
        })
        setImporting(false)
        return
      }
      
      toast({ 
        title: "Import Complete", 
        description: `Imported ${data.imported} assignments. ${data.matched} matched to registrations, ${data.unmatched} unmatched.`
      })
      
      setImportText("")
      fetchAssignments()
    } catch (err) {
      toast({ title: "Error", description: "Failed to import assignments", variant: "destructive" })
    } finally {
      setImporting(false)
    }
  }

  const handleRematch = async () => {
    setRematching(true)
    try {
      const res = await fetch("/api/assignments/rematch", { method: "POST" })
      const data = await res.json()
      
      toast({ 
        title: "Rematch Complete", 
        description: `Checked ${data.checked} unmatched assignments. Found ${data.newMatches} new matches.`
      })
      
      fetchAssignments()
    } catch {
      toast({ title: "Error", description: "Failed to rematch", variant: "destructive" })
    } finally {
      setRematching(false)
    }
  }

  const handleDelete = async (id: number) => {
    if (!confirm("Delete this assignment?")) return
    
    try {
      await fetch(`/api/assignments/${id}`, { method: "DELETE" })
      setAssignments(prev => prev.filter(a => a.id !== id))
      toast({ title: "Deleted", description: "Assignment removed" })
    } catch {
      toast({ title: "Error", description: "Failed to delete", variant: "destructive" })
    }
  }

  const handleClearAll = async () => {
    if (!confirm("Delete ALL assignments? This cannot be undone.")) return
    
    try {
      await fetch("/api/assignments", { method: "DELETE" })
      setAssignments([])
      toast({ title: "Cleared", description: "All assignments deleted" })
    } catch {
      toast({ title: "Error", description: "Failed to clear", variant: "destructive" })
    }
  }

  const matchedCount = assignments.filter(a => a.registration_id).length
  const unmatchedCount = assignments.length - matchedCount

  // Group by activity
  const byActivity = assignments.reduce((acc, a) => {
    if (!acc[a.activity_name]) acc[a.activity_name] = []
    acc[a.activity_name].push(a)
    return acc
  }, {} as Record<string, Assignment[]>)

  return (
    <div className="min-h-screen bg-background">
      <div className="max-w-6xl mx-auto px-4 py-6 space-y-6">
        {/* Header */}
        <div className="flex items-start justify-between gap-4 flex-wrap">
          <div className="flex items-center gap-3">
            <Link href="/admin">
              <Button variant="ghost" size="icon">
                <ArrowLeftIcon className="size-4" />
              </Button>
            </Link>
            <div className="p-2.5 rounded-lg bg-purple-100 border border-purple-200">
              <CalendarIcon className="size-5 text-purple-600" />
            </div>
            <div>
              <h1 className="text-2xl font-bold tracking-tight">Special Assignments</h1>
              <p className="text-sm text-muted-foreground">
                Activity leadership, sessions, games, etc.
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <Button variant="outline" onClick={handleRematch} disabled={rematching || unmatchedCount === 0}>
              {rematching ? <Loader2Icon className="size-4 mr-2 animate-spin" /> : <RefreshCwIcon className="size-4 mr-2" />}
              Rematch Names
            </Button>
            {assignments.length > 0 && (
              <Button variant="destructive" size="sm" onClick={handleClearAll}>
                <TrashIcon className="size-4 mr-1" />
                Clear All
              </Button>
            )}
          </div>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-3 gap-4">
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Total Assignments</p>
                  <p className="text-2xl font-bold">{assignments.length}</p>
                </div>
                <CalendarIcon className="size-8 text-muted-foreground" />
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Matched</p>
                  <p className="text-2xl font-bold text-green-600">{matchedCount}</p>
                </div>
                <CheckCircle2Icon className="size-8 text-green-600" />
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Unmatched</p>
                  <p className="text-2xl font-bold text-amber-600">{unmatchedCount}</p>
                </div>
                <XCircleIcon className="size-8 text-amber-600" />
              </div>
            </CardContent>
          </Card>
        </div>

        <Tabs defaultValue="list">
          <TabsList>
            <TabsTrigger value="list">Assignments List</TabsTrigger>
            <TabsTrigger value="import">Import Data</TabsTrigger>
          </TabsList>

          <TabsContent value="list" className="mt-4">
            {loading ? (
              <div className="flex items-center justify-center py-12">
                <Loader2Icon className="size-8 animate-spin text-muted-foreground" />
              </div>
            ) : assignments.length === 0 ? (
              <Card>
                <CardContent className="py-12 text-center">
                  <CalendarIcon className="size-12 mx-auto text-muted-foreground mb-4" />
                  <p className="text-muted-foreground">No assignments yet. Use the Import tab to add them.</p>
                </CardContent>
              </Card>
            ) : (
              <div className="space-y-6">
                {Object.entries(byActivity).map(([activity, items]) => (
                  <Card key={activity}>
                    <CardHeader className="pb-3">
                      <CardTitle className="text-base">{activity}</CardTitle>
                      <CardDescription>{items.length} assignment(s)</CardDescription>
                    </CardHeader>
                    <CardContent>
                      <Table>
                        <TableHeader>
                          <TableRow>
                            <TableHead>Name</TableHead>
                            <TableHead>Date</TableHead>
                            <TableHead>Time</TableHead>
                            <TableHead>Matched</TableHead>
                            <TableHead className="w-[80px]">Actions</TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {items.map((a) => (
                            <TableRow key={a.id}>
                              <TableCell className="font-medium">{a.assigned_name}</TableCell>
                              <TableCell>
                                {a.assigned_date ? new Date(a.assigned_date + "T12:00:00").toLocaleDateString("en-US", { weekday: "short", month: "short", day: "numeric" }) : "—"}
                              </TableCell>
                              <TableCell>{a.time_slot || "—"}</TableCell>
                              <TableCell>
                                {a.registration_id ? (
                                  <Badge className="bg-green-100 text-green-800 hover:bg-green-100">
                                    <CheckCircle2Icon className="size-3 mr-1" />
                                    {a.family_last_name}
                                  </Badge>
                                ) : (
                                  <Badge variant="outline" className="text-amber-600 border-amber-300">
                                    <XCircleIcon className="size-3 mr-1" />
                                    Not matched
                                  </Badge>
                                )}
                              </TableCell>
                              <TableCell>
                                <Button variant="ghost" size="sm" onClick={() => handleDelete(a.id)}>
                                  <TrashIcon className="size-3" />
                                </Button>
                              </TableCell>
                            </TableRow>
                          ))}
                        </TableBody>
                      </Table>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </TabsContent>

          <TabsContent value="import" className="mt-4">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <UploadIcon className="size-5" />
                  Import Assignments
                </CardTitle>
                <CardDescription>
                  Paste your assignment data. Format: Activity | Name | Date | Time (one per line)
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label>Paste Data</Label>
                  <Textarea
                    value={importText}
                    onChange={(e) => setImportText(e.target.value)}
                    placeholder={`Dodgeball | Abel Bradd | May 5 | 2:00 PM
Archery Instructor | Stephen Bradd | May 6 | 10:00 AM
Session 1 | Asa Bradd | May 5 | Morning`}
                    rows={12}
                    className="font-mono text-sm"
                  />
                  <p className="text-xs text-muted-foreground">
                    Supports pipe (|) or tab-separated values. Names like &quot;Abel Bradd&quot; will be auto-matched to registered family members.
                  </p>
                </div>
                <Button onClick={handleImport} disabled={importing || !importText.trim()}>
                  {importing ? (
                    <><Loader2Icon className="size-4 mr-2 animate-spin" />Importing...</>
                  ) : (
                    <><UploadIcon className="size-4 mr-2" />Import Assignments</>
                  )}
                </Button>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  )
}
