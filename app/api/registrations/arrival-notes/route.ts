import { getDb } from "@/lib/db"
import { NextResponse } from "next/server"

export async function GET() {
  try {
    const sql = getDb()
    const result = await sql`
      SELECT
        r.id,
        r.family_last_name,
        r.email,
        r.husband_phone,
        r.wife_phone,
        r.arrival_notes,
        r.lodging_type,
        (SELECT first_name FROM family_members WHERE registration_id = r.id ORDER BY age DESC NULLS LAST, id LIMIT 1) as first_person_name,
        COUNT(fm.id) as family_member_count
      FROM registrations r
      LEFT JOIN family_members fm ON r.id = fm.registration_id
      WHERE r.arrival_notes IS NOT NULL AND r.arrival_notes != ''
      GROUP BY r.id
      ORDER BY r.family_last_name ASC
    `
    return NextResponse.json(result)
  } catch (error) {
    console.error("[v0] Error fetching arrival notes:", error)
    return NextResponse.json({ error: "Failed to fetch arrival notes" }, { status: 500 })
  }
}
