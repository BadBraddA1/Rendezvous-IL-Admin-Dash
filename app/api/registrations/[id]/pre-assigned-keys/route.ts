import { NextResponse } from "next/server"
import { getDb } from "@/lib/db"

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const body = await request.json()
    const { pre_assigned_keys } = body

    const sql = getDb()

    // Update the pre_assigned_keys field
    const result = await sql`
      UPDATE registrations
      SET pre_assigned_keys = ${pre_assigned_keys || []}
      WHERE id = ${id}
      RETURNING id, family_last_name, pre_assigned_keys
    `

    if (result.length === 0) {
      return NextResponse.json({ error: "Registration not found" }, { status: 404 })
    }

    return NextResponse.json(result[0])
  } catch (error) {
    console.error("Error updating pre-assigned keys:", error)
    return NextResponse.json({ error: "Failed to update pre-assigned keys" }, { status: 500 })
  }
}

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const sql = getDb()

    const result = await sql`
      SELECT id, family_last_name, pre_assigned_keys, room_keys
      FROM registrations
      WHERE id = ${id}
    `

    if (result.length === 0) {
      return NextResponse.json({ error: "Registration not found" }, { status: 404 })
    }

    return NextResponse.json(result[0])
  } catch (error) {
    console.error("Error fetching pre-assigned keys:", error)
    return NextResponse.json({ error: "Failed to fetch pre-assigned keys" }, { status: 500 })
  }
}
