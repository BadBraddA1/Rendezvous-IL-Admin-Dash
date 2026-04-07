import { type NextRequest, NextResponse } from "next/server"
import { getDb } from "@/lib/db"

// GET all bids — joined to volunteer_signups for live name/email
export async function GET() {
  const sql = getDb()
  const bids = await sql`
    SELECT
      b.*,
      r.family_last_name,
      t.title AS claimed_topic_title,
      vs.volunteer_name  AS vs_name,
      r.email            AS vs_email
    FROM lesson_bids b
    LEFT JOIN registrations r ON r.id = b.registration_id
    LEFT JOIN lesson_topics t ON t.id = b.claimed_topic_id
    LEFT JOIN volunteer_signups vs ON vs.id = b.volunteer_signup_id
    ORDER BY b.created_at DESC
  `
  return NextResponse.json(bids)
}

// POST — create a bid invite from a volunteer_signup_id
export async function POST(request: NextRequest) {
  const sql = getDb()
  const { volunteer_signup_id } = await request.json()

  if (!volunteer_signup_id) {
    return NextResponse.json({ error: "volunteer_signup_id is required" }, { status: 400 })
  }

  // Pull name / email / registration_id from volunteer_signups
  const vs = await sql`
    SELECT vs.id, vs.volunteer_name, r.email, vs.registration_id
    FROM volunteer_signups vs
    JOIN registrations r ON r.id = vs.registration_id
    WHERE vs.id = ${volunteer_signup_id}
  `
  if (vs.length === 0) {
    return NextResponse.json({ error: "Volunteer signup not found" }, { status: 404 })
  }
  const v = vs[0]

  // Prevent duplicate invite
  const existing = await sql`
    SELECT id FROM lesson_bids WHERE volunteer_signup_id = ${volunteer_signup_id}
  `
  if (existing.length > 0) {
    return NextResponse.json({ error: "This person has already been added" }, { status: 409 })
  }

  const result = await sql`
    INSERT INTO lesson_bids (volunteer_signup_id, registration_id, invitee_name, invitee_email)
    VALUES (${volunteer_signup_id}, ${v.registration_id}, ${v.volunteer_name}, ${v.email})
    RETURNING *
  `
  return NextResponse.json(result[0])
}
