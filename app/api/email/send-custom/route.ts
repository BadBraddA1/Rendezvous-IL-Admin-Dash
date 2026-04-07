import { type NextRequest, NextResponse } from "next/server"
import { getDb } from "@/lib/db"
import { sendCustomEmail } from "@/lib/email"

export async function POST(request: NextRequest) {
  try {
    const { recipientType, registrationIds, subject, message } = await request.json()

    if (!subject || !message) {
      return NextResponse.json({ error: "Subject and message are required" }, { status: 400 })
    }

    const sql = getDb()
    let recipients: string[] = []

    if (recipientType === "all") {
      // Send to all registrations
      const registrations = await sql`
        SELECT email FROM registrations WHERE email IS NOT NULL AND email != ''
      `
      recipients = registrations.map((r: any) => r.email)
    } else if (recipientType === "selected" && registrationIds) {
      // Send to selected registrations
      const registrations = await sql`
        SELECT email FROM registrations 
        WHERE id = ANY(${registrationIds}) AND email IS NOT NULL AND email != ''
      `
      recipients = registrations.map((r: any) => r.email)
    } else {
      return NextResponse.json({ error: "Invalid recipient type" }, { status: 400 })
    }

    if (recipients.length === 0) {
      return NextResponse.json({ error: "No recipients found" }, { status: 400 })
    }

    // Send email to all recipients
    const result = await sendCustomEmail({
      to: recipients,
      subject,
      message,
    })

    if (result.success) {
      return NextResponse.json({
        message: `Email sent to ${recipients.length} recipient(s)`,
        emailId: result.id,
        recipientCount: recipients.length,
      })
    } else {
      return NextResponse.json({ error: result.error }, { status: 500 })
    }
  } catch (error) {
    console.error("Error sending custom email:", error)
    return NextResponse.json({ error: "Failed to send email" }, { status: 500 })
  }
}
