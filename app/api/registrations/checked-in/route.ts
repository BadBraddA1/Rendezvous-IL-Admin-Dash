import { NextResponse } from "next/server"
import { getDb } from "@/lib/db"

function serializeRow(row: any) {
  return Object.fromEntries(
    Object.entries(row).map(([key, value]) => [
      key,
      typeof value === "bigint" ? Number(value) : value,
    ])
  )
}

export async function GET() {
  try {
    const sql = getDb()

    // Get all checked-in registrations with motel lodging
    const registrations = await sql`
      SELECT 
        r.id,
        r.family_last_name,
        r.father_signature,
        r.email,
        r.lodging_type,
        r.room_keys,
        r.checked_in,
        r.checked_in_at,
        r.keys_returned,
        r.keys_returned_at,
        r.payment_status,
        (SELECT COUNT(*) FROM family_members fm WHERE fm.registration_id = r.id) as family_member_count
      FROM registrations r
      WHERE r.checked_in = TRUE
      ORDER BY r.checked_in_at DESC
    `

    return NextResponse.json(registrations.map(serializeRow))
  } catch (error: any) {
    console.error("Error fetching checked-in registrations:", error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}
