import { type NextRequest, NextResponse } from "next/server"
import { sendSMS, checkInfobipConfig } from "@/lib/sms"

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { phone, message, dryRun } = body

    // For dry-run API status checks
    if (dryRun) {
      const status = checkInfobipConfig()
      if (status.configured) {
        return NextResponse.json({ status: "configured" })
      } else {
        return NextResponse.json({ error: status.error }, { status: 500 })
      }
    }

    if (!phone) {
      return NextResponse.json({ error: "Phone number is required" }, { status: 400 })
    }

    if (!message) {
      return NextResponse.json({ error: "Message is required" }, { status: 400 })
    }

    const result = await sendSMS(phone, `[TEST] ${message}`)

    if (result.success) {
      return NextResponse.json({
        success: true,
        message: `Test SMS sent to ${phone}`,
        messageId: result.messageId,
      })
    } else {
      return NextResponse.json({ error: result.error }, { status: 500 })
    }
  } catch (err: any) {
    return NextResponse.json({ error: err.message || "Failed to send SMS" }, { status: 500 })
  }
}
