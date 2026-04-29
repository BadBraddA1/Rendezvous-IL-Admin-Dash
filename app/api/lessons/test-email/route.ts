import { type NextRequest, NextResponse } from "next/server"
import { getDb } from "@/lib/db"
import { Resend } from "resend"

function getResend() {
  if (!process.env.Resend_API) {
    throw new Error("Resend_API environment variable is not set")
  }
  return new Resend(process.env.Resend_API)
}

function getBaseUrl(request: NextRequest): string {
  const envUrl = process.env.NEXT_PUBLIC_BASE_URL
  if (envUrl && envUrl !== "NA" && envUrl.startsWith("http")) return envUrl.replace(/\/$/, "")
  const host = request.headers.get("host") || "localhost:3000"
  const protocol = host.startsWith("localhost") ? "http" : "https"
  return `${protocol}://${host}`
}

// POST — send a TEST lesson invite email to a specified email address
export async function POST(request: NextRequest) {
  console.log("[v0] test-email route called")
  
  let body
  try {
    body = await request.json()
    console.log("[v0] test-email body:", body)
  } catch (e) {
    console.log("[v0] test-email JSON parse error:", e)
    return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 })
  }
  
  const { testEmail, emailType } = body
  const baseUrl = getBaseUrl(request)
  console.log("[v0] test-email baseUrl:", baseUrl)
  
  const sql = getDb()

  if (!testEmail) {
    console.log("[v0] test-email missing testEmail")
    return NextResponse.json({ error: "testEmail is required" }, { status: 400 })
  }

  let resend
  try {
    resend = getResend()
    console.log("[v0] test-email resend initialized")
  } catch (e: any) {
    console.log("[v0] test-email resend error:", e.message)
    return NextResponse.json({ error: e.message }, { status: 500 })
  }

  // Get topic count for the email
  const topicCount = await sql`SELECT COUNT(*) as count FROM lesson_topics`
  const count = Number(topicCount[0]?.count ?? 12)

  // Create a mock token for testing (doesn't actually work for claiming)
  const mockToken = "TEST_TOKEN_" + Date.now()
  const pickUrl = `${baseUrl}/lessons/pick?token=${mockToken}`

  let subject: string
  let html: string

  if (emailType === "reminder") {
    subject = "[TEST] Reminder: Claim Your Lesson Topic – Deadline April 8th"
    html = buildReminderHtml("Test User", pickUrl)
  } else if (emailType === "speaker") {
    const submitUrl = `${baseUrl}/lessons/submit?token=${mockToken}`
    subject = "[TEST] Action Required: Submit Your Lesson Title & Scripture Reading – Rendezvous 2026"
    html = buildSpeakerEmailHtml("Test User", "Sample Topic: Walking by Faith", submitUrl)
  } else {
    // Default: invite email
    subject = "[TEST] Claim Your Lesson Topic – Rendezvous 2026"
    html = buildInviteHtml("Test User", count, pickUrl)
  }

  try {
    console.log("[v0] test-email sending to:", testEmail, "type:", emailType)
    const result = await resend.emails.send({
      from: "Rendezvous 2026 <noreply@mail.rendezvousil.org>",
      to: testEmail,
      subject,
      html,
    })
    console.log("[v0] test-email sent successfully:", result.data?.id)

    return NextResponse.json({
      success: true,
      message: `Test ${emailType || "invite"} email sent to ${testEmail}`,
      emailId: result.data?.id,
      previewUrl: pickUrl,
      note: emailType === "speaker" 
        ? "This email asks the speaker to reply with their lesson title and scripture reading."
        : `The link in the email won't work for claiming (it's a test token), but you can see how the email looks.`
    })
  } catch (err: any) {
    console.log("[v0] test-email send error:", err.message, err)
    return NextResponse.json({ 
      error: err.message || "Failed to send email",
      details: err
    }, { status: 500 })
  }
}

function buildInviteHtml(name: string, count: number, pickUrl: string): string {
  return `<!DOCTYPE html>
<html lang="en">
<head><meta charset="UTF-8" /><meta name="viewport" content="width=device-width, initial-scale=1.0" /></head>
<body style="margin:0;padding:0;background:#f5f0eb;font-family:Georgia,serif;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background:#f5f0eb;padding:32px 16px;">
    <tr><td align="center">
      <table width="600" cellpadding="0" cellspacing="0" style="background:#fff;border-radius:12px;overflow:hidden;box-shadow:0 2px 8px rgba(0,0,0,0.08);">
        <tr><td style="background:#fef3c7;padding:8px;text-align:center;">
          <p style="color:#92400e;margin:0;font-size:12px;font-weight:bold;">[TEST EMAIL] This is a preview - the link below will not work</p>
        </td></tr>
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

function buildReminderHtml(name: string, pickUrl: string): string {
  return `<!DOCTYPE html>
<html lang="en">
<head><meta charset="UTF-8" /><meta name="viewport" content="width=device-width, initial-scale=1.0" /></head>
<body style="margin:0;padding:0;background:#f5f0eb;font-family:Georgia,serif;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background:#f5f0eb;padding:32px 16px;">
    <tr><td align="center">
      <table width="600" cellpadding="0" cellspacing="0" style="background:#fff;border-radius:12px;overflow:hidden;box-shadow:0 2px 8px rgba(0,0,0,0.08);">
        <tr><td style="background:#fef3c7;padding:8px;text-align:center;">
          <p style="color:#92400e;margin:0;font-size:12px;font-weight:bold;">[TEST EMAIL] This is a preview - the link below will not work</p>
        </td></tr>
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

function buildSpeakerEmailHtml(name: string, topicTitle: string, submitUrl: string): string {
  return `<!DOCTYPE html>
<html lang="en">
<head><meta charset="UTF-8" /><meta name="viewport" content="width=device-width, initial-scale=1.0" /></head>
<body style="margin:0;padding:0;background:#f5f0eb;font-family:Georgia,serif;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background:#f5f0eb;padding:32px 16px;">
    <tr><td align="center">
      <table width="600" cellpadding="0" cellspacing="0" style="background:#fff;border-radius:12px;overflow:hidden;box-shadow:0 2px 8px rgba(0,0,0,0.08);">
        <tr><td style="background:#fef3c7;padding:8px;text-align:center;">
          <p style="color:#92400e;margin:0;font-size:12px;font-weight:bold;">[TEST EMAIL] This is a preview</p>
        </td></tr>
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
              <p style="color:#8B4513;font-size:18px;font-weight:bold;margin:0;">${topicTitle}</p>
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
                <a href="mailto:stephen@rendezvousil.org" style="color:#2563eb;">stephen@rendezvousil.org</a> or text <a href="sms:+13097124234" style="color:#2563eb;">(309) 712-4234</a>
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
