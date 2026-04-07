import { NextResponse } from "next/server"
import { getDb } from "@/lib/db"

export async function GET() {
  try {
    const sql = getDb()
    const healthInfo = await sql`
      SELECT 
        hi.*,
        r.family_last_name,
        r.email,
        r.husband_phone,
        r.wife_phone
      FROM health_info hi
      JOIN registrations r ON hi.registration_id = r.id
      ORDER BY r.family_last_name, hi.full_name
    `

    return NextResponse.json(healthInfo)
  } catch (error) {
    console.error("[v0] Error fetching health info:", error)
    return NextResponse.json({ error: "Failed to fetch health information" }, { status: 500 })
  }
}
