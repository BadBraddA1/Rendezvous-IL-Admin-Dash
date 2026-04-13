import { NextResponse } from "next/server"
import { getDb } from "@/lib/db"

async function ensureSettingsTable(sql: ReturnType<typeof getDb>) {
  await sql`
    CREATE TABLE IF NOT EXISTS app_settings (
      key TEXT PRIMARY KEY,
      value TEXT NOT NULL,
      updated_at TIMESTAMPTZ DEFAULT NOW()
    )
  `
  await sql`
    INSERT INTO app_settings (key, value)
    VALUES ('schedule_published', 'false')
    ON CONFLICT (key) DO NOTHING
  `
}

export async function GET() {
  try {
    const sql = getDb()
    await ensureSettingsTable(sql)
    // Return the scheduled volunteers if schedule is published
    const settings = await sql`SELECT value FROM app_settings WHERE key = 'schedule_published'`
    const published = settings[0]?.value === "true"

    if (!published) {
      return NextResponse.json({ published: false, schedule: [] })
    }

    const schedule = await sql`
      SELECT
        vs.volunteer_name,
        vs.volunteer_type,
        vs.assigned_date,
        vs.time_slot,
        vs.prayer_type,
        vs.notes,
        vs.schedule_status,
        lt.title AS claimed_lesson_title
      FROM volunteer_signups vs
      LEFT JOIN lesson_topics lt ON lt.id = vs.claimed_lesson_id
      WHERE vs.assigned_date IS NOT NULL AND vs.time_slot IS NOT NULL
      ORDER BY vs.assigned_date, vs.time_slot, vs.volunteer_type, vs.volunteer_name
    `
    return NextResponse.json({ published: true, schedule })
  } catch (error) {
    console.error("[v0] Error fetching public schedule:", error)
    return NextResponse.json({ published: false, schedule: [] })
  }
}
