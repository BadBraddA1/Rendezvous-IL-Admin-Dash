import { NextResponse } from "next/server"
import { getDb } from "@/lib/db"

export async function GET() {
  try {
    const sql = getDb()

    // Ensure prayer_position column exists before querying it
    await sql`
      ALTER TABLE volunteer_signups
      ADD COLUMN IF NOT EXISTS prayer_position TEXT CHECK (prayer_position IN ('opening', 'closing'))
    `

    const volunteers = await sql`
      SELECT 
        vs.id,
        vs.registration_id,
        vs.volunteer_name,
        vs.volunteer_type,
        vs.prayer_position,
        vs.assigned_date,
        vs.time_slot,
        vs.notes,
        vs.created_at,
        vs.schedule_status,
        vs.schedule_email_sent_at,
        vs.responded_at,
        vs.claimed_lesson_id,
        vs.claimed_lesson_at,
        lt.title AS claimed_lesson_title,
        r.family_last_name,
        r.email,
        r.husband_phone,
        r.wife_phone
      FROM volunteer_signups vs
      JOIN registrations r ON vs.registration_id = r.id
      LEFT JOIN lesson_topics lt ON lt.id = vs.claimed_lesson_id
      ORDER BY vs.volunteer_type, r.family_last_name, vs.volunteer_name
    `

    return NextResponse.json(volunteers)
  } catch (error) {
    console.error("[v0] Error fetching volunteers:", error)
    return NextResponse.json({ error: "Failed to fetch volunteers" }, { status: 500 })
  }
}
