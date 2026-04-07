import { type NextRequest, NextResponse } from "next/server"
import { getDb } from "@/lib/db"

// GET — load volunteer data + all topics with their claimed status, by lesson_bid_token
export async function GET(request: NextRequest) {
  const sql = getDb()
  const token = request.nextUrl.searchParams.get("token")
  if (!token) return NextResponse.json({ error: "Missing token" }, { status: 400 })

  const vs = await sql`
    SELECT
      vs.id,
      vs.volunteer_name,
      vs.claimed_lesson_id,
      vs.claimed_lesson_at AS submitted_at
    FROM volunteer_signups vs
    WHERE vs.lesson_bid_token = ${token}
  `
  if (vs.length === 0) return NextResponse.json({ error: "Invalid link" }, { status: 404 })
  const volunteer = vs[0]

  const topics = await sql`
    SELECT
      t.id,
      t.title,
      t.description,
      t.claimed_by_volunteer_id,
      -- show the name of whoever claimed it (from volunteer_signups)
      claimer.volunteer_name AS claimed_by_name
    FROM lesson_topics t
    LEFT JOIN volunteer_signups claimer ON claimer.id = t.claimed_by_volunteer_id
    ORDER BY t.sort_order
  `

  return NextResponse.json({
    id: volunteer.id,
    invitee_name: volunteer.volunteer_name,
    claimed_topic_id: volunteer.claimed_lesson_id,
    submitted_at: volunteer.submitted_at,
    topics,
  })
}

// POST — atomically claim exactly one topic (first-come-first-served)
export async function POST(request: NextRequest) {
  const sql = getDb()
  const token = request.nextUrl.searchParams.get("token")
  if (!token) return NextResponse.json({ error: "Missing token" }, { status: 400 })

  const { topic_id } = await request.json()
  if (!topic_id) return NextResponse.json({ error: "Please select a topic" }, { status: 400 })

  // Look up the volunteer signup by token
  const vs = await sql`
    SELECT id, volunteer_name, claimed_lesson_id FROM volunteer_signups WHERE lesson_bid_token = ${token}
  `
  if (vs.length === 0) return NextResponse.json({ error: "Invalid link" }, { status: 404 })
  const volunteer = vs[0]

  if (volunteer.claimed_lesson_id) {
    return NextResponse.json({ error: "You have already claimed a topic." }, { status: 409 })
  }

  // Atomically claim the topic — only succeeds if not yet claimed
  const claimed = await sql`
    UPDATE lesson_topics
    SET claimed_by_volunteer_id = ${volunteer.id}, claimed_at = NOW()
    WHERE id = ${topic_id} AND claimed_by_volunteer_id IS NULL
    RETURNING id, title
  `

  if (claimed.length === 0) {
    return NextResponse.json({ error: "Sorry — that topic was just claimed by someone else. Please choose another." }, { status: 409 })
  }

  // Write claimed_lesson_id back to volunteer_signups
  await sql`
    UPDATE volunteer_signups
    SET claimed_lesson_id = ${topic_id}, claimed_lesson_at = NOW()
    WHERE id = ${volunteer.id}
  `

  return NextResponse.json({ success: true, name: volunteer.volunteer_name, topic: claimed[0].title })
}
