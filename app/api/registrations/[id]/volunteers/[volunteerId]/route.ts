import { NextResponse } from "next/server"
import { getDb } from "@/lib/db"

export async function PUT(request: Request, { params }: { params: Promise<{ id: string; volunteerId: string }> }) {
  try {
    const sql = getDb()
    const { id, volunteerId } = await params
    const body = await request.json()
    const { volunteer_name, volunteer_type } = body

    if (!volunteer_name || !volunteer_type) {
      return NextResponse.json({ error: "volunteer_name and volunteer_type are required" }, { status: 400 })
    }

    const result = await sql`
      UPDATE volunteer_signups
      SET volunteer_name = ${volunteer_name}, volunteer_type = ${volunteer_type}
      WHERE id = ${volunteerId} AND registration_id = ${id}
      RETURNING *
    `

    if (result.length === 0) {
      return NextResponse.json({ error: "Volunteer signup not found" }, { status: 404 })
    }

    return NextResponse.json(result[0])
  } catch (error) {
    console.error("[v0] Error updating volunteer signup:", error)
    return NextResponse.json({ error: "Failed to update volunteer signup" }, { status: 500 })
  }
}

export async function DELETE(request: Request, { params }: { params: Promise<{ id: string; volunteerId: string }> }) {
  try {
    const sql = getDb()
    const { id, volunteerId } = await params

    const result = await sql`
      DELETE FROM volunteer_signups
      WHERE id = ${volunteerId} AND registration_id = ${id}
      RETURNING *
    `

    if (result.length === 0) {
      return NextResponse.json({ error: "Volunteer signup not found" }, { status: 404 })
    }

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error("[v0] Error deleting volunteer signup:", error)
    return NextResponse.json({ error: "Failed to delete volunteer signup" }, { status: 500 })
  }
}
