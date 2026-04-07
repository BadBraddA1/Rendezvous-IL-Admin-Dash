import { type NextRequest, NextResponse } from "next/server"
import { Resend } from "resend"
import { FROM_ADDRESS } from "@/lib/email"

function getResend() {
  if (!process.env.Resend_API) {
    throw new Error("Resend_API environment variable is not set")
  }
  return new Resend(process.env.Resend_API)
}

export function buildCheckinEmailHtml() {
  return `<!DOCTYPE html>
<html lang="en">
<head><meta charset="UTF-8" /><meta name="viewport" content="width=device-width, initial-scale=1.0" /></head>
<body style="margin:0;padding:0;background:#f5f0eb;font-family:Georgia,serif;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background:#f5f0eb;padding:32px 16px;">
    <tr><td align="center">
      <table width="600" cellpadding="0" cellspacing="0" style="background:#fff;border-radius:12px;overflow:hidden;box-shadow:0 2px 8px rgba(0,0,0,0.08);">
        <tr><td style="background:#8B4513;padding:32px;text-align:center;">
          <h1 style="color:#fff;margin:0;font-size:28px;">Rendezvous 2026</h1>
          <p style="color:#f5c89a;margin:8px 0 0;font-size:14px;">May 4-8, 2026 - Lake Williamson Christian Center, Carlinville, IL</p>
        </td></tr>
        <tr><td style="padding:32px;">
          <h2 style="color:#8B4513;margin:0 0 16px;">Your Check-In QR Code</h2>
          <p style="color:#555;font-size:15px;line-height:1.6;">Dear <strong>Sample Family</strong>,</p>
          <p style="color:#555;font-size:15px;line-height:1.6;">We're excited to see you at Rendezvous 2026! Below is your check-in QR code. Please have it ready when you arrive.</p>
          <div style="text-align:center;margin:24px 0;">
            <div style="display:inline-block;background:#f5f0eb;border-radius:12px;padding:24px;">
              <div style="background:#ccc;width:200px;height:200px;margin:0 auto;border-radius:8px;display:flex;align-items:center;justify-content:center;">
                <span style="color:#888;font-size:12px;">[QR Code Image]</span>
              </div>
              <p style="margin:12px 0 0;font-size:14px;color:#555;">Can't scan? Use this code:</p>
              <p style="margin:4px 0 0;font-size:22px;font-weight:bold;letter-spacing:4px;color:#8B4513;font-family:monospace;">SAMPLE1234</p>
            </div>
          </div>
          <table width="100%" style="background:#fef9f0;border:1px solid #f5c89a;border-radius:8px;margin:24px 0;" cellpadding="0" cellspacing="0">
            <tr><td style="padding:20px;">
              <h3 style="margin:0 0 12px;color:#8B4513;font-size:14px;text-transform:uppercase;letter-spacing:1px;">Amount Due at Check-In</h3>
              <table width="100%" cellpadding="0" cellspacing="0">
                <tr><td style="color:#555;font-size:13px;padding-bottom:4px;">Registration Fee</td><td align="right" style="color:#555;font-size:13px;padding-bottom:4px;">$150.00</td></tr>
                <tr><td style="color:#555;font-size:13px;padding-bottom:4px;">Lodging (Motel)</td><td align="right" style="color:#555;font-size:13px;padding-bottom:4px;">$200.00</td></tr>
                <tr><td style="color:#555;font-size:13px;padding-bottom:4px;">T-Shirts</td><td align="right" style="color:#555;font-size:13px;padding-bottom:4px;">$45.00</td></tr>
                <tr><td colspan="2" style="border-top:1px solid #e0d0c0;padding-top:10px;"></td></tr>
                <tr><td style="color:#333;font-size:16px;font-weight:bold;">Total Due</td><td align="right" style="color:#8B4513;font-size:18px;font-weight:bold;">$395.00</td></tr>
              </table>
            </td></tr>
          </table>
          <p style="color:#555;font-size:14px;line-height:1.6;">We look forward to seeing you at Rendezvous 2026!</p>
        </td></tr>
        <tr><td style="background:#f5f0eb;padding:20px;text-align:center;">
          <p style="color:#888;font-size:12px;margin:0;">Rendezvous 2026 - Lake Williamson Christian Center - May 4-8, 2026</p>
        </td></tr>
      </table>
    </td></tr>
  </table>
</body></html>`
}

export function buildCustomEmailHtml(message: string) {
  return `<!DOCTYPE html>
<html lang="en">
<head><meta charset="UTF-8" /><meta name="viewport" content="width=device-width, initial-scale=1.0" /></head>
<body style="margin:0;padding:0;background:#f5f0eb;font-family:Georgia,serif;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background:#f5f0eb;padding:32px 16px;">
    <tr><td align="center">
      <table width="600" cellpadding="0" cellspacing="0" style="background:#fff;border-radius:12px;overflow:hidden;box-shadow:0 2px 8px rgba(0,0,0,0.08);">
        <tr><td style="background:#8B4513;padding:32px;text-align:center;">
          <h1 style="color:#fff;margin:0;font-size:28px;">Rendezvous 2026</h1>
          <p style="color:#f5c89a;margin:8px 0 0;font-size:14px;">May 4-8, 2026 - Lake Williamson Christian Center, Carlinville, IL</p>
        </td></tr>
        <tr><td style="padding:32px;">
          <div style="color:#555;font-size:15px;line-height:1.8;white-space:pre-wrap;">${message || "(Your message will appear here)"}</div>
        </td></tr>
        <tr><td style="background:#f5f0eb;padding:20px;text-align:center;">
          <p style="color:#888;font-size:12px;margin:0;">Rendezvous 2026 - Lake Williamson Christian Center - May 4-8, 2026</p>
        </td></tr>
      </table>
    </td></tr>
  </table>
</body></html>`
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { testEmail, emailType, subject, message } = body

    if (!testEmail) {
      return NextResponse.json({ error: "Test email address is required" }, { status: 400 })
    }

    const resend = getResend()

    let html: string
    let emailSubject: string

    if (emailType === "checkin") {
      html = buildCheckinEmailHtml()
      emailSubject = "[TEST] Your Check-In QR Code - Rendezvous 2026"
    } else {
      if (!subject || !message) {
        return NextResponse.json({ error: "Subject and message are required for custom emails" }, { status: 400 })
      }
      html = buildCustomEmailHtml(message)
      emailSubject = `[TEST] ${subject}`
    }

    const { error } = await resend.emails.send({
      from: FROM_ADDRESS,
      to: testEmail,
      subject: emailSubject,
      html,
    })

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    return NextResponse.json({
      message: `Test email sent to ${testEmail}`,
    })
  } catch (err: any) {
    return NextResponse.json({ error: err.message || "Failed to send test email" }, { status: 500 })
  }
}
