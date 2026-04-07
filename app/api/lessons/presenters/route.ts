import { NextResponse } from "next/server"
import { getDb } from "@/lib/db"

// Returns all "Presenting a lesson" volunteers with their bid/claim status
// driven entirely from volunteer_signups — no lesson_bids table needed
export async function GET() {
  const sql = getDb()

  const rows = await sql`
    SELECT
      vs.id,
      vs.volunteer_name,
      vs.volunteer_type,
      vs.registration_id,
      r.family_last_name,
      r.email,
      vs.lesson_bid_token       AS token,
      vs.lesson_bid_sent_at     AS email_sent_at,
      vs.claimed_lesson_id,
      vs.claimed_lesson_at      AS submitted_at,
      lt.title                  AS claimed_topic_title
    FROM volunteer_signups vs
    JOIN registrations r ON r.id = vs.registration_id
    LEFT JOIN lesson_topics lt ON lt.id = vs.claimed_lesson_id
    WHERE LOWER(vs.volunteer_type) LIKE '%present%'
       OR LOWER(vs.volunteer_type) LIKE '%lesson%'
    ORDER BY r.family_last_name, vs.volunteer_name
  `
  return NextResponse.json(rows)
}
