import { type NextRequest, NextResponse } from "next/server"
import { buildCheckinEmailHtml, buildCustomEmailHtml } from "@/app/api/email/test/route"

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { emailType, message } = body

    const html = emailType === "checkin"
      ? buildCheckinEmailHtml()
      : buildCustomEmailHtml(message || "")

    return NextResponse.json({ html })
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 })
  }
}
