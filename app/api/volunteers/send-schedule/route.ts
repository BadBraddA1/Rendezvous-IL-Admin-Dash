import { type NextRequest, NextResponse } from "next/server"
import { getDb } from "@/lib/db"
import { randomUUID } from "crypto"
import { renderVolunteerScheduleEmail, FROM_ADDRESS, sendBatch } from "@/lib/email"

function getBaseUrl(request: NextRequest): string {
  // Prefer the explicit env var if it's set to a real URL
  const envUrl = process.env.NEXT_PUBLIC_BASE_URL
  if (envUrl && envUrl !== "NA" && envUrl.startsWith("http")) return envUrl.replace(/\/$/, "")
  // Fall back to deriving from the incoming request
  const host = request.headers.get("host") || "localhost:3000"
  const protocol = host.startsWith("localhost") ? "http" : "https"
  return `${protocol}://${host}`
}

export async function POST(request: NextRequest) {
  try {
    const resend = sendBatch
    const baseUrl = getBaseUrl(request)
    const sql = getDb()
    const { volunteerIds } = await request.json().catch(() => ({ volunteerIds: null }))

    // Get volunteers that have a schedule assigned
    const volunteers = await sql`
      SELECT 
        vs.id,
        vs.volunteer_name,
        vs.volunteer_type,
        vs.assigned_date,
        vs.time_slot AS assigned_time_slot,
        vs.notes,
        r.email,
        r.family_last_name
      FROM volunteer_signups vs
      JOIN registrations r ON r.id = vs.registration_id
      WHERE vs.assigned_date IS NOT NULL
        AND vs.time_slot IS NOT NULL
        AND r.email IS NOT NULL
        ${volunteerIds ? sql`AND vs.id = ANY(${volunteerIds})` : sql``}
      ORDER BY vs.assigned_date, vs.time_slot
    `

    if (volunteers.length === 0) {
      return NextResponse.json({ error: "No scheduled volunteers found" }, { status: 400 })
    }

    // Build all tokens first, save them, then batch-send
    const payloads: { to: string; subject: string; html: string }[] = []
    for (const vol of volunteers) {
      const token = randomUUID()
      await sql`
        UPDATE volunteer_signups
        SET schedule_token = ${token}, schedule_email_sent_at = NOW()
        WHERE id = ${vol.id}
      `
      const rawDate = vol.assigned_date
      const dateStr = rawDate instanceof Date ? rawDate.toISOString().split("T")[0] : String(rawDate).substring(0, 10)
      const approveUrl = `${baseUrl}/volunteer/respond?token=${token}&action=approve`
      const declineUrl = `${baseUrl}/volunteer/respond?token=${token}&action=decline`
      const html = renderVolunteerScheduleEmail({
        firstName: vol.volunteer_name.split(" ")[0],
        lastName: vol.volunteer_name.split(" ").slice(1).join(" "),
        volunteerType: vol.volunteer_type,
        assignedDate: dateStr,
        assignedTimeSlot: vol.assigned_time_slot,
        notes: vol.notes,
        approveUrl,
        declineUrl,
      })
      payloads.push({ to: vol.email, subject: `Your Volunteer Assignment – ${vol.volunteer_type}`, html })
    }

    const results = await sendBatch(payloads)
    const sent = results.filter((r) => r.success).length
    const failed = results.filter((r) => !r.success).length

    return NextResponse.json({
      message: `Sent ${sent} schedule email${sent !== 1 ? "s" : ""}${failed > 0 ? `, ${failed} failed` : ""}`,
      sent,
      failed,
    })
  } catch (error: any) {
    console.error("[v0] Send schedule emails error:", error)
    return NextResponse.json({ error: error.message || "Failed to send emails" }, { status: 500 })
  }
}
