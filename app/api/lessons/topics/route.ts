import { type NextRequest, NextResponse } from "next/server"
import { getDb } from "@/lib/db"

// GET all topics with claim status joined from volunteer_signups
export async function GET() {
  const sql = getDb()
  const topics = await sql`
    SELECT
      t.*,
      vs.volunteer_name AS claimed_by_name,
      r.email           AS claimed_by_email
    FROM lesson_topics t
    LEFT JOIN volunteer_signups vs ON vs.id = t.claimed_by_volunteer_id
    LEFT JOIN registrations r ON r.id = vs.registration_id
    ORDER BY t.sort_order, t.id
  `
  return NextResponse.json(topics)
}

// POST create a new topic
export async function POST(request: NextRequest) {
  const sql = getDb()
  const { title, description, sort_order } = await request.json()
  if (!title?.trim()) return NextResponse.json({ error: "Title is required" }, { status: 400 })

  const result = await sql`
    INSERT INTO lesson_topics (title, description, sort_order)
    VALUES (${title.trim()}, ${description?.trim() || null}, ${sort_order ?? 0})
    RETURNING *
  `
  return NextResponse.json(result[0])
}
