import { type NextRequest, NextResponse } from "next/server"
import { getDb } from "@/lib/db"

export async function POST(request: NextRequest) {
  try {
    const sql = getDb()
    const { token, action } = await request.json()

    if (!token || !["approve", "decline"].includes(action)) {
      return NextResponse.json({ error: "Invalid request" }, { status: 400 })
    }

    const volunteers = await sql`
      SELECT vs.id, vs.volunteer_name, vs.volunteer_type, vs.assigned_date, vs.time_slot
      FROM volunteer_signups vs
      WHERE vs.schedule_token = ${token}
    `

    if (volunteers.length === 0) {
      return NextResponse.json({ error: "Invalid or expired token" }, { status: 404 })
    }

    const vol = volunteers[0]

    await sql`
      UPDATE volunteer_signups
      SET 
        schedule_status = ${action === "approve" ? "approved" : "declined"},
        responded_at = NOW()
      WHERE schedule_token = ${token}
    `

    return NextResponse.json({
      success: true,
      action,
      firstName: vol.volunteer_name.split(" ")[0],
      volunteerType: vol.volunteer_type,
      assignedDate: vol.assigned_date,
      assignedTimeSlot: vol.time_slot,
    })
  } catch (error: any) {
    console.error("[v0] Respond error:", error)
    return NextResponse.json({ error: error.message || "Failed to process response" }, { status: 500 })
  }
}
