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

export async function PUT(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params
    const sql = getDb()
    const body = await request.json()
    const { first_name, age, date_of_birth, is_baptized, person_cost } = body

    const result = await sql`
      UPDATE family_members
      SET 
        first_name = ${first_name},
        age = ${age},
        date_of_birth = ${date_of_birth},
        is_baptized = ${is_baptized},
        person_cost = ${person_cost}
      WHERE id = ${id}
      RETURNING *
    `

    if (result.length === 0) {
      return NextResponse.json({ error: "Family member not found" }, { status: 404 })
    }

    // Auto-update lodging_total on the registration
    const registrationId = result[0].registration_id
    await sql`
      UPDATE registrations
      SET lodging_total = (
        SELECT COALESCE(SUM(COALESCE(person_cost, 0)), 0)
        FROM family_members
        WHERE registration_id = ${registrationId}
      ),
      updated_at = NOW()
      WHERE id = ${registrationId}
    `

    return NextResponse.json(serializeRow(result[0]))
  } catch (error) {
    console.error("[v0] Error updating family member:", error)
    return NextResponse.json({ error: "Failed to update family member" }, { status: 500 })
  }
}

export async function DELETE(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params
    const sql = getDb()

    // Get registration_id before deleting
    const member = await sql`
      SELECT registration_id FROM family_members WHERE id = ${id}
    `
    const registrationId = member[0]?.registration_id

    await sql`
      DELETE FROM family_members WHERE id = ${id}
    `

    // Auto-update lodging_total on the registration
    if (registrationId) {
      await sql`
        UPDATE registrations
        SET lodging_total = (
          SELECT COALESCE(SUM(COALESCE(person_cost, 0)), 0)
          FROM family_members
          WHERE registration_id = ${registrationId}
        ),
        updated_at = NOW()
        WHERE id = ${registrationId}
      `
    }

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error("[v0] Error deleting family member:", error)
    return NextResponse.json({ error: "Failed to delete family member" }, { status: 500 })
  }
}
