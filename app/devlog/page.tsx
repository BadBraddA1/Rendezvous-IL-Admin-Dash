"use client"

import { useEffect, useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { GitPullRequestIcon, CheckCircleIcon, CircleDotIcon, ExternalLinkIcon, CalendarIcon, UserIcon } from "lucide-react"

interface PullRequest {
  id: number
  number: number
  title: string
  description: string | null
  status: "open" | "closed" | "merged"
  author: string
  authorAvatar: string
  createdAt: string
  updatedAt: string
  mergedAt: string | null
  url: string
  labels: Array<{ name: string; color: string }>
}

export default function DevlogPage() {
  const [pulls, setPulls] = useState<PullRequest[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [filter, setFilter] = useState<"all" | "merged" | "open">("all")

  useEffect(() => {
    const fetchPulls = async () => {
      try {
        const res = await fetch("/api/github/pulls")
        if (!res.ok) throw new Error("Failed to fetch")
        const data = await res.json()
        setPulls(data.pulls || [])
      } catch (err) {
        setError("Unable to load development updates")
        console.error(err)
      } finally {
        setLoading(false)
      }
    }
    fetchPulls()
  }, [])

  const filteredPulls = pulls.filter((pr) => {
    if (filter === "merged") return pr.status === "merged"
    if (filter === "open") return pr.status === "open"
    return true
  })

  const mergedCount = pulls.filter((pr) => pr.status === "merged").length
  const openCount = pulls.filter((pr) => pr.status === "open").length

  const formatDate = (dateString: string) => {
    const date = new Date(dateString)
    return date.toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
    })
  }

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "merged":
        return (
          <Badge className="bg-purple-100 text-purple-800 hover:bg-purple-100 border-0">
            <CheckCircleIcon className="size-3 mr-1" />
            Merged
          </Badge>
        )
      case "open":
        return (
          <Badge className="bg-green-100 text-green-800 hover:bg-green-100 border-0">
            <CircleDotIcon className="size-3 mr-1" />
            In Progress
          </Badge>
        )
      default:
        return (
          <Badge variant="secondary">
            {status}
          </Badge>
        )
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-amber-50 to-white flex items-center justify-center">
        <div className="text-center">
          <div className="size-12 mx-auto mb-4 animate-spin rounded-full border-4 border-amber-800 border-t-transparent" />
          <p className="text-muted-foreground">Loading development updates...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-amber-50 to-white">
      {/* Header */}
      <div className="bg-amber-800 text-white py-8 px-4">
        <div className="max-w-4xl mx-auto text-center">
          <h1 className="text-3xl md:text-4xl font-bold mb-2">Development Log</h1>
          <p className="text-amber-200">Track progress and updates for the Rendezvous Admin Dashboard</p>
        </div>
      </div>

      {/* Stats */}
      <div className="max-w-4xl mx-auto px-4 -mt-6">
        <div className="grid grid-cols-2 gap-4">
          <Card className="bg-white shadow-lg border-0">
            <CardContent className="p-6 text-center">
              <div className="text-4xl font-bold text-purple-700">{mergedCount}</div>
              <p className="text-sm text-muted-foreground mt-1">Completed Updates</p>
            </CardContent>
          </Card>
          <Card className="bg-white shadow-lg border-0">
            <CardContent className="p-6 text-center">
              <div className="text-4xl font-bold text-green-700">{openCount}</div>
              <p className="text-sm text-muted-foreground mt-1">In Progress</p>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Content */}
      <div className="max-w-4xl mx-auto px-4 py-8">
        {error ? (
          <Card>
            <CardContent className="p-12 text-center">
              <GitPullRequestIcon className="size-12 mx-auto mb-4 text-muted-foreground opacity-50" />
              <p className="text-muted-foreground">{error}</p>
            </CardContent>
          </Card>
        ) : (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <GitPullRequestIcon className="size-5" />
                Recent Updates
              </CardTitle>
              <CardDescription>
                All changes and improvements made to the system
              </CardDescription>
            </CardHeader>
            <CardContent>
              {/* Filter Tabs */}
              <Tabs value={filter} onValueChange={(v) => setFilter(v as typeof filter)} className="mb-6">
                <TabsList className="grid w-full grid-cols-3">
                  <TabsTrigger value="all">All ({pulls.length})</TabsTrigger>
                  <TabsTrigger value="merged">Completed ({mergedCount})</TabsTrigger>
                  <TabsTrigger value="open">In Progress ({openCount})</TabsTrigger>
                </TabsList>
              </Tabs>

              {/* PR List */}
              {filteredPulls.length === 0 ? (
                <div className="text-center py-12 text-muted-foreground">
                  <GitPullRequestIcon className="size-12 mx-auto mb-4 opacity-50" />
                  <p>No updates found</p>
                </div>
              ) : (
                <div className="space-y-4">
                  {filteredPulls.map((pr) => (
                    <div
                      key={pr.id}
                      className="p-4 rounded-lg border bg-card hover:bg-muted/50 transition-colors"
                    >
                      <div className="flex items-start justify-between gap-4">
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 flex-wrap mb-2">
                            {getStatusBadge(pr.status)}
                            <span className="text-xs text-muted-foreground">#{pr.number}</span>
                          </div>
                          <h3 className="font-semibold text-foreground mb-1 leading-snug">
                            {pr.title}
                          </h3>
                          {pr.description && (
                            <p className="text-sm text-muted-foreground line-clamp-2 mb-3">
                              {pr.description}
                            </p>
                          )}
                          <div className="flex items-center gap-4 text-xs text-muted-foreground">
                            <span className="flex items-center gap-1">
                              <UserIcon className="size-3" />
                              {pr.author}
                            </span>
                            <span className="flex items-center gap-1">
                              <CalendarIcon className="size-3" />
                              {pr.mergedAt ? `Merged ${formatDate(pr.mergedAt)}` : `Updated ${formatDate(pr.updatedAt)}`}
                            </span>
                          </div>
                        </div>
                        <Button
                          variant="ghost"
                          size="sm"
                          className="shrink-0"
                          asChild
                        >
                          <a href={pr.url} target="_blank" rel="noopener noreferrer">
                            <ExternalLinkIcon className="size-4" />
                            <span className="sr-only">View on GitHub</span>
                          </a>
                        </Button>
                      </div>
                      {pr.labels.length > 0 && (
                        <div className="flex gap-1 mt-3 flex-wrap">
                          {pr.labels.map((label) => (
                            <Badge
                              key={label.name}
                              variant="outline"
                              className="text-xs"
                              style={{
                                borderColor: `#${label.color}`,
                                color: `#${label.color}`,
                              }}
                            >
                              {label.name}
                            </Badge>
                          ))}
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        )}
      </div>

      {/* Footer */}
      <div className="text-center py-6 text-sm text-muted-foreground">
        <p>Data synced from GitHub</p>
      </div>
    </div>
  )
}
