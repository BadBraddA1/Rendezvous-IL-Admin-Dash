import { NextResponse } from "next/server"
import { sql } from "@/lib/db"

export async function GET() {
  try {
    const rows = await sql`
      SELECT
        r.id,
        r.family_last_name,
        r.email,
        r.checkin_qr_code,
        COUNT(fm.id)::int AS family_member_count
      FROM registrations r
      LEFT JOIN family_members fm ON fm.registration_id = r.id
      WHERE r.checkin_qr_code IS NOT NULL
      GROUP BY r.id
      ORDER BY r.family_last_name ASC, r.id ASC
    `

    return NextResponse.json(rows)
  } catch (error) {
    console.error("[v0] Error fetching QR codes:", error)
    return NextResponse.json(
      { error: "Failed to fetch QR codes" },
      { status: 500 }
    )
  }
}
