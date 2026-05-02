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

export async function POST(request: NextRequest) {
  try {
    const sql = getDb()
    const body = await request.json()
    const { registration_id, first_name, age, date_of_birth, is_baptized, person_cost } = body

    const result = await sql`
      INSERT INTO family_members (
        registration_id, first_name, age, date_of_birth, is_baptized, person_cost
      )
      VALUES (
        ${registration_id}, ${first_name}, ${age}, ${date_of_birth}, ${is_baptized}, ${person_cost}
      )
      RETURNING *
    `

    // Auto-update lodging_total on the registration
    await sql`
      UPDATE registrations
      SET lodging_total = (
        SELECT COALESCE(SUM(COALESCE(person_cost, 0)), 0)
        FROM family_members
        WHERE registration_id = ${registration_id}
      ),
      updated_at = NOW()
      WHERE id = ${registration_id}
    `

    return NextResponse.json(serializeRow(result[0]))
  } catch (error) {
    console.error("[v0] Error creating family member:", error)
    return NextResponse.json({ error: "Failed to create family member" }, { status: 500 })
  }
}
