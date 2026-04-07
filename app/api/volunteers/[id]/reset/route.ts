import { type NextRequest, NextResponse } from "next/server"
import { getDb } from "@/lib/db"

export async function POST(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const sql = getDb()

    await sql`
      UPDATE volunteer_signups
      SET
        assigned_date        = NULL,
        time_slot            = NULL,
        notes                = NULL,
        schedule_token       = NULL,
        schedule_status      = NULL,
        schedule_email_sent_at = NULL,
        responded_at         = NULL
      WHERE id = ${Number(id)}
    `

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error("Reset volunteer error:", error)
    return NextResponse.json({ error: "Failed to reset volunteer" }, { status: 500 })
  }
}
