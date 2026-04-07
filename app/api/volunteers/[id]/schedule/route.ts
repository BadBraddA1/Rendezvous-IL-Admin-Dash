import { type NextRequest, NextResponse } from "next/server"
import { getDb } from "@/lib/db"

export async function PATCH(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params
    const body = await request.json()
    const { assigned_date, time_slot, notes, prayer_position } = body

    const sql = getDb()

    // Ensure prayer_position column exists (self-bootstrapping migration)
    await sql`
      ALTER TABLE volunteer_signups
      ADD COLUMN IF NOT EXISTS prayer_position TEXT CHECK (prayer_position IN ('opening', 'closing'))
    `

    await sql`
      UPDATE volunteer_signups
      SET
        assigned_date = ${assigned_date || null},
        time_slot = ${time_slot || null},
        notes = ${notes || null},
        prayer_position = ${prayer_position || null}
      WHERE id = ${Number(id)}
    `

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error("Error updating volunteer schedule:", error)
    return NextResponse.json({ error: "Failed to update volunteer schedule" }, { status: 500 })
  }
}
