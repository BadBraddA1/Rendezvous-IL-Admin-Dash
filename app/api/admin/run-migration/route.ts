import { NextResponse } from "next/server"
import { getDb } from "@/lib/db"

export async function POST() {
  const sql = getDb()
  
  try {
    // Add lesson details columns to volunteer_signups
    await sql`
      ALTER TABLE volunteer_signups 
      ADD COLUMN IF NOT EXISTS lesson_title TEXT,
      ADD COLUMN IF NOT EXISTS scripture_reading TEXT,
      ADD COLUMN IF NOT EXISTS lesson_details_submitted_at TIMESTAMPTZ
    `

    // Create event_settings table for feature toggles
    await sql`
      CREATE TABLE IF NOT EXISTS event_settings (
        key TEXT PRIMARY KEY,
        value TEXT NOT NULL,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `

    // Insert default adventure setting (disabled for this year)
    await sql`
      INSERT INTO event_settings (key, value) 
      VALUES ('adventure_enabled', 'false')
      ON CONFLICT (key) DO NOTHING
    `

    // Create special_assignments table for activity leadership roles
    await sql`
      CREATE TABLE IF NOT EXISTS special_assignments (
        id SERIAL PRIMARY KEY,
        activity_name TEXT NOT NULL,
        assigned_name TEXT NOT NULL,
        assigned_date DATE,
        time_slot TEXT,
        notes TEXT,
        registration_id INTEGER REFERENCES registrations(id),
        family_member_id INTEGER REFERENCES family_members(id),
        created_at TIMESTAMPTZ DEFAULT NOW(),
        updated_at TIMESTAMPTZ DEFAULT NOW()
      )
    `
    
    return NextResponse.json({ success: true, message: "Migration complete" })
  } catch (err: any) {
    console.log("[v0] Migration error:", err.message)
    return NextResponse.json({ error: err.message }, { status: 500 })
  }
}
