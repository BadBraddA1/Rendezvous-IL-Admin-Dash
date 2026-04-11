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
        r.climbing_tower_total,
        r.lodging_type,
        (SELECT first_name FROM family_members WHERE registration_id = r.id ORDER BY age DESC NULLS LAST, id LIMIT 1) as first_person_name,
        COUNT(fm.id) as family_member_count
      FROM registrations r
      LEFT JOIN family_members fm ON r.id = fm.registration_id
      WHERE r.climbing_tower_total > 0
      GROUP BY r.id
      ORDER BY r.family_last_name ASC
    `

    const total_revenue = result.reduce((sum: number, r: any) => sum + Number(r.climbing_tower_total || 0), 0)

    return NextResponse.json({ registrations: result, total_revenue })
  } catch (error) {
    console.error("[v0] Error fetching adventure registrations:", error)
    return NextResponse.json({ error: "Failed to fetch adventure registrations" }, { status: 500 })
  }
}
