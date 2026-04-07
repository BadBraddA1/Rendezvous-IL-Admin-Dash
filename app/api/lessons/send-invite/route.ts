import { type NextRequest, NextResponse } from "next/server"
import { getDb } from "@/lib/db"
import { FROM_ADDRESS, sendBatch } from "@/lib/email"

function getBaseUrl(request: NextRequest): string {
  const envUrl = process.env.NEXT_PUBLIC_BASE_URL
  if (envUrl && envUrl !== "NA" && envUrl.startsWith("http")) return envUrl.replace(/\/$/, "")
  const host = request.headers.get("host") || "localhost:3000"
  const protocol = host.startsWith("localhost") ? "http" : "https"
  return `${protocol}://${host}`
}

// POST — send lesson bid invite emails to selected volunteer_signup IDs
export async function POST(request: NextRequest) {
  const sql = getDb()
  const { volunteerIds } = await request.json()
  const baseUrl = getBaseUrl(request)

  // Fetch the volunteers to send to — must have a token and not yet claimed
  const volunteers = await sql`
    SELECT vs.id, vs.volunteer_name, vs.lesson_bid_token AS token, r.email
    FROM volunteer_signups vs
    JOIN registrations r ON r.id = vs.registration_id
    WHERE vs.id = ANY(${volunteerIds})
      AND vs.claimed_lesson_id IS NULL
      AND vs.lesson_bid_token IS NOT NULL
  `

  if (volunteers.length === 0) {
    return NextResponse.json({ error: "No eligible volunteers found" }, { status: 400 })
  }

  const topicCount = await sql`SELECT COUNT(*) as count FROM lesson_topics`
  const count = Number(topicCount[0]?.count ?? 0)

  const payloads = volunteers.map((vol: any) => {
    const pickUrl = `${baseUrl}/lessons/pick?token=${vol.token}`
    return {
      to: vol.email,
      subject: "Claim Your Lesson Topic – Rendezvous 2026",
      html: buildInviteHtml(vol.volunteer_name, count, pickUrl),
    }
  })

  const results = await sendBatch(payloads)

  // Mark sent_at for successful sends
  for (let idx = 0; idx < volunteers.length; idx++) {
    if (results[idx]?.success) {
      await sql`UPDATE volunteer_signups SET lesson_bid_sent_at = NOW() WHERE id = ${volunteers[idx].id}`
    }
  }

  const sent = results.filter((r: any) => r.success).length
  const failed = results.filter((r: any) => !r.success).length

  return NextResponse.json({
    message: `Sent ${sent} invite${sent !== 1 ? "s" : ""}${failed > 0 ? `, ${failed} failed` : ""}`,
    sent,
    failed,
  })
}

function buildInviteHtml(name: string, count: number, pickUrl: string): string {
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
        <tr><td style="padding:32px;">
          <h2 style="color:#8B4513;margin:0 0 16px;">Lesson Topic Selection</h2>
          <p style="color:#555;font-size:15px;line-height:1.6;">Dear <strong>${name}</strong>,</p>
          <p style="color:#555;font-size:15px;line-height:1.6;">
            You signed up to present a lesson at Rendezvous 2026! There are <strong>${count} lesson topics</strong> available.
            Use your personal link below to claim the topic you want — first come, first served!
          </p>
          <p style="color:#555;font-size:15px;line-height:1.6;">
            We aim for about 20 minutes total of instructional time during each devotional. 4 of you will have the entire
            20 minutes to develop your lesson as you see fit. The other 8 will each have 10 minutes (i.e., 2 of you will
            present back-to-back during one devotional).
          </p>
          <p style="color:#555;font-size:15px;line-height:1.6;">
            I will share more details on this after the chapters have all been claimed and a schedule has been set.
          </p>
          <p style="color:#c0392b;font-size:15px;font-weight:bold;line-height:1.6;">Please reply by April 8th.</p>
          <table width="100%" cellpadding="0" cellspacing="0" style="margin:28px 0;">
            <tr><td align="center">
              <a href="${pickUrl}" style="display:inline-block;background:#92400e;color:#fff;text-decoration:none;padding:16px 36px;border-radius:10px;font-size:17px;font-weight:bold;font-family:Georgia,serif;letter-spacing:0.3px;">
                Claim My Lesson Topic
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
