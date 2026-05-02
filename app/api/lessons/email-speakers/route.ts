import { type NextRequest, NextResponse } from "next/server"
import { getDb } from "@/lib/db"
import { sendBatch } from "@/lib/email"

function getBaseUrl(request: NextRequest): string {
  const envUrl = process.env.NEXT_PUBLIC_BASE_URL
  if (envUrl) return envUrl.replace(/\/$/, "")
  const host = request.headers.get("host") || "localhost:3000"
  const protocol = host.includes("localhost") ? "http" : "https"
  return `${protocol}://${host}`
}

// POST — send email to all speakers who have claimed a topic
export async function POST(request: NextRequest) {
  const sql = getDb()
  const body = await request.json().catch(() => ({}))
  const { volunteerIds } = body
  const baseUrl = getBaseUrl(request)

  // Get speakers who have claimed a topic (have a claimed_lesson_id)
  const speakers = volunteerIds?.length
    ? await sql`
        SELECT vs.id, vs.volunteer_name, vs.claimed_lesson_id, vs.lesson_bid_token, lt.title as topic_title, r.email
        FROM volunteer_signups vs
        JOIN registrations r ON r.id = vs.registration_id
        LEFT JOIN lesson_topics lt ON lt.id = vs.claimed_lesson_id
        WHERE vs.id = ANY(${volunteerIds})
          AND vs.claimed_lesson_id IS NOT NULL
      `
    : await sql`
        SELECT vs.id, vs.volunteer_name, vs.claimed_lesson_id, vs.lesson_bid_token, lt.title as topic_title, r.email
        FROM volunteer_signups vs
        JOIN registrations r ON r.id = vs.registration_id
        LEFT JOIN lesson_topics lt ON lt.id = vs.claimed_lesson_id
        WHERE vs.claimed_lesson_id IS NOT NULL
      `

  if (speakers.length === 0) {
    return NextResponse.json({ error: "No speakers have claimed a topic yet" }, { status: 400 })
  }

  const payloads = speakers.map((speaker: any) => ({
    to: speaker.email,
    subject: "Action Required: Submit Your Lesson Title & Scripture Reading – Rendezvous 2026",
    html: buildSpeakerEmailHtml(speaker.volunteer_name, speaker.topic_title, speaker.lesson_bid_token, baseUrl),
  }))

  const results = await sendBatch(payloads)
  const sent = results.filter((r: any) => r.success).length
  const failed = results.filter((r: any) => !r.success).length

  return NextResponse.json({
    message: `Email sent to ${sent} speaker${sent !== 1 ? "s" : ""}${failed > 0 ? `, ${failed} failed` : ""}`,
    sent,
    failed,
  })
}

// GET — export speakers list for Resend (CSV format with name, email, topic)
export async function GET() {
  const sql = getDb()
  
  const speakers = await sql`
    SELECT 
      vs.volunteer_name,
      r.email,
      lt.title as topic_title,
      vs.submitted_at as claimed_at
    FROM volunteer_signups vs
    JOIN registrations r ON r.id = vs.registration_id
    LEFT JOIN lesson_topics lt ON lt.id = vs.claimed_lesson_id
    WHERE vs.claimed_lesson_id IS NOT NULL
    ORDER BY vs.volunteer_name
  `

  // Build CSV
  const headers = ["Name", "Email", "Topic", "Claimed Date"]
  const rows = speakers.map((s: any) => [
    s.volunteer_name,
    s.email,
    s.topic_title || "",
    s.claimed_at ? new Date(s.claimed_at).toLocaleDateString() : "",
  ])

  const csv = [
    headers.join(","),
    ...rows.map((row: string[]) => row.map(cell => `"${(cell || "").replace(/"/g, '""')}"`).join(","))
  ].join("\n")

  return new Response(csv, {
    headers: {
      "Content-Type": "text/csv",
      "Content-Disposition": `attachment; filename="speakers-export-${new Date().toISOString().split("T")[0]}.csv"`,
    },
  })
}

function buildSpeakerEmailHtml(name: string, topicTitle: string, token: string, baseUrl: string): string {
  const submitUrl = `${baseUrl}/lessons/submit?token=${token}`
  
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
        <tr><td style="background:#2563eb;padding:12px 32px;text-align:center;">
          <p style="color:#fff;margin:0;font-size:14px;font-weight:bold;letter-spacing:0.3px;">
            Action Required: Please Submit Your Lesson Details
          </p>
        </td></tr>
        <tr><td style="padding:32px;">
          <h2 style="color:#8B4513;margin:0 0 16px;">Lesson Title & Scripture Reading Needed</h2>
          <p style="color:#555;font-size:15px;line-height:1.6;">Dear <strong>${name}</strong>,</p>
          <p style="color:#555;font-size:15px;line-height:1.6;">
            Thank you for volunteering to present a lesson at Rendezvous 2026! You have claimed the following topic:
          </p>
          
          <table width="100%" cellpadding="0" cellspacing="0" style="background:#fef9f0;border:1px solid #f5c89a;border-radius:8px;margin:20px 0;">
            <tr><td style="padding:20px;">
              <p style="color:#888;font-size:12px;text-transform:uppercase;letter-spacing:1px;margin:0 0 4px;">Your Topic</p>
              <p style="color:#8B4513;font-size:18px;font-weight:bold;margin:0;">${topicTitle || "Topic assigned"}</p>
            </td></tr>
          </table>

          <p style="color:#555;font-size:15px;line-height:1.6;">
            To help us prepare for the event, please submit the following:
          </p>
          
          <table width="100%" cellpadding="0" cellspacing="0" style="background:#e8f4fd;border:1px solid #93c5fd;border-radius:8px;margin:20px 0;">
            <tr><td style="padding:20px;">
              <p style="color:#1e40af;font-size:15px;line-height:1.8;margin:0;">
                <strong>1. Your Lesson Title</strong><br/>
                <span style="color:#555;">The specific title you want displayed in the program</span>
              </p>
              <p style="color:#1e40af;font-size:15px;line-height:1.8;margin:16px 0 0;">
                <strong>2. Scripture Reading</strong><br/>
                <span style="color:#555;">The Scripture passage you would like read before your lesson (e.g., "John 3:16-21")</span>
              </p>
            </td></tr>
          </table>

          <table width="100%" cellpadding="0" cellspacing="0" style="margin:24px 0;">
            <tr><td align="center">
              <a href="${submitUrl}" style="display:inline-block;background:#8B4513;color:#fff;padding:14px 32px;font-size:16px;font-weight:bold;text-decoration:none;border-radius:8px;">
                Submit Your Lesson Details
              </a>
            </td></tr>
          </table>
          
          <p style="color:#555;font-size:15px;line-height:1.6;">
            Or copy this link: <a href="${submitUrl}" style="color:#2563eb;">${submitUrl}</a>
          </p>
          
          <table width="100%" cellpadding="0" cellspacing="0" style="background:#fef3c7;border:1px solid #fcd34d;border-radius:8px;margin:20px 0;">
            <tr><td style="padding:16px;">
              <p style="color:#92400e;font-size:14px;margin:0;">
                <strong>Questions?</strong> Contact Stephen directly:<br/>
                <a href="mailto:Stephen@Bradd.us" style="color:#2563eb;">Stephen@Bradd.us</a> or text <a href="sms:+12179355058" style="color:#2563eb;">(217) 935-5058</a>
              </p>
            </td></tr>
          </table>

          <p style="color:#555;font-size:15px;line-height:1.6;margin-top:24px;">
            We're looking forward to hearing your message at Rendezvous 2026!
          </p>
          
          <p style="color:#555;font-size:15px;line-height:1.6;">
            In Christ,<br/>
            <strong>The Rendezvous Planning Team</strong>
          </p>
        </td></tr>
        <tr><td style="background:#f5f0eb;padding:20px;text-align:center;">
          <p style="color:#888;font-size:12px;margin:0;">Rendezvous 2026 · Lake Williamson Christian Center · May 4–8, 2026</p>
        </td></tr>
      </table>
    </td></tr>
  </table>
</body></html>`
}
