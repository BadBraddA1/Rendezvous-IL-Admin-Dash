import { NextResponse } from "next/server"

interface GitHubPR {
  id: number
  number: number
  title: string
  body: string | null
  state: string
  merged_at: string | null
  created_at: string
  updated_at: string
  html_url: string
  user: {
    login: string
    avatar_url: string
  }
  labels: Array<{
    name: string
    color: string
  }>
}

export async function GET() {
  const token = process.env.GITHUB_TOKEN
  
  if (!token) {
    return NextResponse.json({ error: "GitHub token not configured" }, { status: 500 })
  }

  const owner = "BadBraddA1"
  const repo = "Rendezvous-IL-Admin-Dash"

  try {
    // Fetch both open and closed PRs
    const [openRes, closedRes] = await Promise.all([
      fetch(`https://api.github.com/repos/${owner}/${repo}/pulls?state=open&per_page=50&sort=updated&direction=desc`, {
        headers: {
          Authorization: `Bearer ${token}`,
          Accept: "application/vnd.github.v3+json",
        },
        next: { revalidate: 60 }, // Cache for 60 seconds
      }),
      fetch(`https://api.github.com/repos/${owner}/${repo}/pulls?state=closed&per_page=50&sort=updated&direction=desc`, {
        headers: {
          Authorization: `Bearer ${token}`,
          Accept: "application/vnd.github.v3+json",
        },
        next: { revalidate: 60 },
      }),
    ])

    if (!openRes.ok || !closedRes.ok) {
      const error = await openRes.json().catch(() => ({}))
      console.error("[v0] GitHub API error:", error)
      return NextResponse.json({ error: "Failed to fetch pull requests" }, { status: 500 })
    }

    const openPRs: GitHubPR[] = await openRes.json()
    const closedPRs: GitHubPR[] = await closedRes.json()

    // Combine and format PRs
    const allPRs = [...openPRs, ...closedPRs].map((pr) => ({
      id: pr.id,
      number: pr.number,
      title: pr.title,
      description: pr.body ? pr.body.slice(0, 500) + (pr.body.length > 500 ? "..." : "") : null,
      status: pr.merged_at ? "merged" : pr.state,
      author: pr.user.login,
      authorAvatar: pr.user.avatar_url,
      createdAt: pr.created_at,
      updatedAt: pr.updated_at,
      mergedAt: pr.merged_at,
      url: pr.html_url,
      labels: pr.labels.map((l) => ({ name: l.name, color: l.color })),
    }))

    // Sort by most recent activity
    allPRs.sort((a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime())

    return NextResponse.json({ pulls: allPRs })
  } catch (error) {
    console.error("[v0] Error fetching GitHub PRs:", error)
    return NextResponse.json({ error: "Failed to fetch pull requests" }, { status: 500 })
  }
}
