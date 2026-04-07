import { NextResponse } from "next/server"
import { getDb } from "@/lib/db"

export async function GET() {
  try {
    const sql = getDb()
    const suggestions = await sql`
      SELECT 
        ss.*,
        r.family_last_name,
        r.email
      FROM session_suggestions ss
      JOIN registrations r ON ss.registration_id = r.id
      ORDER BY ss.session_type, r.family_last_name
    `

    return NextResponse.json(suggestions)
  } catch (error) {
    console.error("[v0] Error fetching session suggestions:", error)
    return NextResponse.json({ error: "Failed to fetch session suggestions" }, { status: 500 })
  }
}
