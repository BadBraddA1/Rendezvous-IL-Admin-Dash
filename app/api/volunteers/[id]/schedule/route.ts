import { type NextRequest, NextResponse } from "next/server"
import { getDb } from "@/lib/db"

export async function PATCH(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params
    const body = await request.json()
    const { assigned_date, time_slot, prayer_type, notes } = body

    const sql = await getDb()

    await sql`
      UPDATE volunteer_signups
      SET 
        assigned_date = ${assigned_date || null},
        time_slot = ${time_slot || null},
        prayer_type = ${prayer_type || null},
        notes = ${notes || null}
      WHERE id = ${Number(id)}
    `

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error("Error updating volunteer schedule:", error)
    return NextResponse.json({ error: "Failed to update volunteer schedule" }, { status: 500 })
  }
}
