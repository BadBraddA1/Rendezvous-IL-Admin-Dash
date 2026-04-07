import { type NextRequest, NextResponse } from "next/server"
import { getDb } from "@/lib/db"
import { sendBatch } from "@/lib/email"

function getBaseUrl(request: NextRequest): string {
  const envUrl = process.env.NEXT_PUBLIC_BASE_URL
  if (envUrl && envUrl !== "NA" && envUrl.startsWith("http")) return envUrl.replace(/\/$/, "")
  const host = request.headers.get("host") || "localhost:3000"
  const protocol = host.startsWith("localhost") ? "http" : "https"
  return `${protocol}://${host}`
}

// POST — send reminder emails to presenters who have an invite but haven't claimed yet
export async function POST(request: NextRequest) {
  const sql = getDb()
  const body = await request.json().catch(() => ({}))
  const { volunteerIds } = body
  const baseUrl = getBaseUrl(request)

  // If specific IDs are passed use those; otherwise send to all unclaimed who have received an invite
  const volunteers = volunteerIds?.length
    ? await sql`
        SELECT vs.id, vs.volunteer_name, vs.lesson_bid_token AS token, r.email
        FROM volunteer_signups vs
        JOIN registrations r ON r.id = vs.registration_id
        WHERE vs.id = ANY(${volunteerIds})
          AND vs.claimed_lesson_id IS NULL
          AND vs.lesson_bid_token IS NOT NULL
      `
    : await sql`
        SELECT vs.id, vs.volunteer_name, vs.lesson_bid_token AS token, r.email
        FROM volunteer_signups vs
        JOIN registrations r ON r.id = vs.registration_id
        WHERE vs.claimed_lesson_id IS NULL
          AND vs.lesson_bid_token IS NOT NULL
          AND vs.lesson_bid_sent_at IS NOT NULL
      `

  if (volunteers.length === 0) {
    return NextResponse.json({ error: "No eligible volunteers to remind" }, { status: 400 })
  }

  const resend = sendBatch
  let sent = 0
  let failed = 0

  const payloads = volunteers.map((vol: any) => {
    const pickUrl = `${baseUrl}/lessons/pick?token=${vol.token}`
    return {
      to: vol.email,
      subject: "Reminder: Claim Your Lesson Topic – Deadline April 8th",
      html: buildReminderHtml(vol.volunteer_name, pickUrl),
    }
  })

  const results = await sendBatch(payloads)
  sent = results.filter((r: any) => r.success).length
  failed = results.filter((r: any) => !r.success).length

  return NextResponse.json({
    message: `Reminder sent to ${sent} presenter${sent !== 1 ? "s" : ""}${failed > 0 ? `, ${failed} failed` : ""}`,
    sent,
    failed,
  })
}

function buildReminderHtml(name: string, pickUrl: string): string {
  return `<!DOCTYPE html>
<html lang="en">
<head><meta charset="UTF-8" /><meta name="viewport" content="width=device-width, initial-scale=1.0" /></head>
<body style="margin:0;padding:0;background:#f5f0eb;font-family:Georgia,serif;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background:#f5f0eb;padding:32px 16px;">
    <tr><td align="center">
      <table width="600" cellpadding="0" cellspacing="0" style="background:#fff;border-radius:12px;overflow:hidden;box-shadow:0 2px 8px rgba(0,0,0,0.08);">
        <tr><td style="background:#8B4513;padding:32px;text-align:center;">
          <h1 style="color:#fff;margin:0;font-size:28px;">Rendezvous 2026</h1>
          <p style="color:#f5c89a;margin:8px 0 0;font-size:14px;">May 4–8, 2026 · Lake Williamson Christian Center, Carlinville, IL</p>
        </td></tr>
        <tr><td style="background:#c0392b;padding:12px 32px;text-align:center;">
          <p style="color:#fff;margin:0;font-size:14px;font-weight:bold;letter-spacing:0.3px;">
            Reminder: Deadline is April 8th — time is running out!
          </p>
        </td></tr>
        <tr><td style="padding:32px;">
          <h2 style="color:#8B4513;margin:0 0 16px;">Lesson Topic Selection — Reminder</h2>
          <p style="color:#555;font-size:15px;line-height:1.6;">Dear <strong>${name}</strong>,</p>
          <p style="color:#555;font-size:15px;line-height:1.6;">
            We just wanted to follow up — we still need you to claim your lesson topic for Rendezvous 2026!
            Topics are first come, first served, and the deadline is <strong>April 8th</strong>.
          </p>
          <p style="color:#555;font-size:15px;line-height:1.6;">
            Please use your personal link below to pick your topic before time runs out.
          </p>
          <table width="100%" cellpadding="0" cellspacing="0" style="margin:28px 0;">
            <tr><td align="center">
              <a href="${pickUrl}" style="display:inline-block;background:#c0392b;color:#fff;text-decoration:none;padding:16px 36px;border-radius:10px;font-size:17px;font-weight:bold;font-family:Georgia,serif;letter-spacing:0.3px;">
                Claim My Lesson Topic Now
              </a>
            </td></tr>
          </table>
          <p style="color:#888;font-size:12px;line-height:1.6;border-top:1px solid #eee;padding-top:16px;">
            If the button above does not work, copy and paste this link:<br/>
            <span style="color:#8B4513;">${pickUrl}</span>
          </p>
          <p style="color:#999;font-size:11px;">This link is personal to you — please do not share it.</p>
        </td></tr>
        <tr><td style="background:#f5f0eb;padding:20px;text-align:center;">
          <p style="color:#888;font-size:12px;margin:0;">Rendezvous 2026 · Lake Williamson Christian Center · May 4–8, 2026</p>
        </td></tr>
      </table>
    </td></tr>
  </table>
</body></html>`
}
