import { type NextRequest, NextResponse } from "next/server"
import { getDb } from "@/lib/db"

function serializeRow(row: any) {
  const serialized: any = {}
  for (const [key, value] of Object.entries(row)) {
    if (value instanceof Date) {
      serialized[key] = value.toISOString()
    } else if (typeof value === "bigint") {
      serialized[key] = Number(value)
    } else {
      serialized[key] = value
    }
  }
  return serialized
}

export async function GET(request: NextRequest, { params }: { params: Promise<{ code: string }> }) {
  try {
    const sql = getDb()
    const { code } = await params
    const cleanCode = code?.trim().toUpperCase()

    if (!cleanCode) {
      return NextResponse.json({ error: "Invalid QR code" }, { status: 400 })
    }

    // Lookup registration by QR code - case insensitive
    const registrations = await sql`
      SELECT 
        r.*,
        (SELECT COUNT(*) FROM family_members fm WHERE fm.registration_id = r.id) as family_member_count
      FROM registrations r
      WHERE UPPER(r.checkin_qr_code) = ${cleanCode}
    `

    if (registrations.length === 0) {
      return NextResponse.json({ error: "Registration not found" }, { status: 404 })
    }

    const registration = registrations[0]

    // Get family members
    const familyMembers = await sql`
      SELECT id, first_name, last_name, age, is_baptized
      FROM family_members
      WHERE registration_id = ${registration.id}
      ORDER BY age DESC
    `

    return NextResponse.json({
      ...serializeRow(registration),
      family_members: familyMembers.map(serializeRow),
    })
  } catch (error) {
    console.error("[v0] Error looking up QR code:", error)
    return NextResponse.json({ error: "Failed to lookup registration" }, { status: 500 })
  }
}
