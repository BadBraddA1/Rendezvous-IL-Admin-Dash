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
    
    return NextResponse.json({ success: true, message: "Migration complete" })
  } catch (err: any) {
    console.log("[v0] Migration error:", err.message)
    return NextResponse.json({ error: err.message }, { status: 500 })
  }
}
