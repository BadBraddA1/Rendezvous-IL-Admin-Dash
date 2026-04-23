import { Resend } from "resend"

// Set the EMAIL_FROM environment variable to your verified domain email in production.
// Default: Resend IL <noreply@braddcorp.com>
export const FROM_ADDRESS = process.env.EMAIL_FROM || "Rendezvous IL <noreply@braddcorp.com>"

function getResend() {
  if (!process.env.Resend_API) {
    throw new Error("Resend_API environment variable is not set")
  }
  return new Resend(process.env.Resend_API)
}

// ---------------------------------------------------------------------------
// Rate-limited batch sender
// Resend allows 5 requests/second per team. We send in batches of 4 with a
// 300ms pause between batches, and retry once on a 429 response.
// ---------------------------------------------------------------------------
const BATCH_SIZE = 4
const BATCH_DELAY_MS = 300
const RETRY_DELAY_MS = 1200

function sleep(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms))
}

export interface EmailPayload {
  to: string
  subject: string
  html: string
}

export interface BatchSendResult {
  email: string
  success: boolean
  error?: string
}

export async function sendBatch(payloads: EmailPayload[]): Promise<BatchSendResult[]> {
  const resend = getResend()
  const results: BatchSendResult[] = []

  for (let i = 0; i < payloads.length; i += BATCH_SIZE) {
    const batch = payloads.slice(i, i + BATCH_SIZE)

    // Send each email in the batch, with one retry on 429
    const batchResults = await Promise.all(
      batch.map(async (payload): Promise<BatchSendResult> => {
        const send = async (attempt: number): Promise<BatchSendResult> => {
          try {
            const { error } = await resend.emails.send({
              from: FROM_ADDRESS,
              to: payload.to,
              subject: payload.subject,
              html: payload.html,
            })
            if (error) {
              // Retry once on rate-limit error
              if ((error as any)?.statusCode === 429 && attempt === 0) {
                await sleep(RETRY_DELAY_MS)
                return send(1)
              }
              return { email: payload.to, success: false, error: error.message }
            }
            return { email: payload.to, success: true }
          } catch (err: any) {
            if (err?.statusCode === 429 && attempt === 0) {
              await sleep(RETRY_DELAY_MS)
              return send(1)
            }
            return { email: payload.to, success: false, error: err.message ?? "Unknown error" }
          }
        }
        return send(0)
      })
    )

    results.push(...batchResults)

    // Pause between batches (skip after the last batch)
    if (i + BATCH_SIZE < payloads.length) {
      await sleep(BATCH_DELAY_MS)
    }
  }

  return results
}

export async function sendRegistrationConfirmation(data: {
  id: number
  familyName: string
  email: string
  phone: string
  familyMembers: { name: string; age: number; baptized: boolean }[]
  lodgingType: string
  lodgingTotal: number
  registrationFee: number
  tshirtTotal: number
  climbingTowerTotal: number
  scholarshipDonation: number
  checkinQrCode: string
}) {
  try {
    const resend = getResend()
    const totalOwed = data.registrationFee + data.lodgingTotal + data.tshirtTotal + data.climbingTowerTotal + data.scholarshipDonation

    const membersHtml = data.familyMembers.map(m =>
      `<tr><td style="padding:8px;border-bottom:1px solid #eee;">${m.name}</td><td style="padding:8px;border-bottom:1px solid #eee;">${m.age}</td><td style="padding:8px;border-bottom:1px solid #eee;">${m.baptized ? "Yes" : "No"}</td></tr>`
    ).join("")

    const html = `
<!DOCTYPE html>
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
          <h2 style="color:#8B4513;margin:0 0 16px;">Registration Confirmed</h2>
          <p style="color:#555;font-size:15px;line-height:1.6;">Dear <strong>${data.familyName} Family</strong>,</p>
          <p style="color:#555;font-size:15px;line-height:1.6;">Your registration has been confirmed! Here are your details:</p>
          <p style="color:#555;font-size:14px;"><strong>Registration ID:</strong> ${data.id}</p>
          <p style="color:#555;font-size:14px;"><strong>QR Code:</strong> ${data.checkinQrCode}</p>
          ${data.familyMembers.length > 0 ? `
          <h3 style="color:#8B4513;margin:20px 0 10px;">Family Members</h3>
          <table width="100%" style="border-collapse:collapse;">
            <tr><th style="padding:8px;text-align:left;border-bottom:2px solid #8B4513;color:#8B4513;">Name</th><th style="padding:8px;text-align:left;border-bottom:2px solid #8B4513;color:#8B4513;">Age</th><th style="padding:8px;text-align:left;border-bottom:2px solid #8B4513;color:#8B4513;">Baptized</th></tr>
            ${membersHtml}
          </table>` : ""}
          <table width="100%" style="background:#fef9f0;border:1px solid #f5c89a;border-radius:8px;margin:24px 0;" cellpadding="0" cellspacing="0">
            <tr><td style="padding:20px;">
              <table width="100%" cellpadding="0" cellspacing="0">
                <tr><td style="color:#555;font-size:13px;padding-bottom:4px;">Registration Fee</td><td align="right" style="color:#555;font-size:13px;padding-bottom:4px;">$${data.registrationFee.toFixed(2)}</td></tr>
                <tr><td style="color:#555;font-size:13px;padding-bottom:4px;">Lodging (${data.lodgingType || "N/A"})</td><td align="right" style="color:#555;font-size:13px;padding-bottom:4px;">$${data.lodgingTotal.toFixed(2)}</td></tr>
                ${data.tshirtTotal > 0 ? `<tr><td style="color:#555;font-size:13px;padding-bottom:4px;">T-Shirts</td><td align="right" style="color:#555;font-size:13px;padding-bottom:4px;">$${data.tshirtTotal.toFixed(2)}</td></tr>` : ""}
                ${data.climbingTowerTotal > 0 ? `<tr><td style="color:#555;font-size:13px;padding-bottom:4px;">Adventure Activities</td><td align="right" style="color:#555;font-size:13px;padding-bottom:4px;">$${data.climbingTowerTotal.toFixed(2)}</td></tr>` : ""}
                ${data.scholarshipDonation > 0 ? `<tr><td style="color:#555;font-size:13px;padding-bottom:4px;">Scholarship Donation</td><td align="right" style="color:#555;font-size:13px;padding-bottom:4px;">$${data.scholarshipDonation.toFixed(2)}</td></tr>` : ""}
                <tr><td colspan="2" style="border-top:1px solid #e0d0c0;padding-top:10px;"></td></tr>
                <tr><td style="color:#333;font-size:16px;font-weight:bold;">Total</td><td align="right" style="color:#8B4513;font-size:18px;font-weight:bold;">$${totalOwed.toFixed(2)}</td></tr>
              </table>
            </td></tr>
          </table>
          <p style="color:#555;font-size:14px;">We look forward to seeing you at Rendezvous 2026!</p>
        </td></tr>
        <tr><td style="background:#f5f0eb;padding:20px;text-align:center;">
          <p style="color:#888;font-size:12px;margin:0;">Rendezvous 2026 - Lake Whitney Christian Camp - May 26-30, 2026</p>
        </td></tr>
      </table>
    </td></tr>
  </table>
</body></html>`

    const { data: emailData, error } = await resend.emails.send({
      from: FROM_ADDRESS,
      to: data.email,
      subject: "Registration Confirmed - Rendezvous 2026",
      html,
    })

    if (error) {
      return { success: false, error: error.message }
    }
    return { success: true, id: emailData?.id }
  } catch (err: any) {
    return { success: false, error: err.message }
  }
}

export function renderVolunteerScheduleEmail(data: {
  firstName: string
  lastName: string
  volunteerType: string
  assignedDate: string | Date
  assignedTimeSlot: string
  notes?: string | null
  approveUrl: string
  declineUrl: string
}) {
  // Normalise to YYYY-MM-DD regardless of whether we get a Date object, ISO string, or plain date string
  const rawDate = data.assignedDate
  const datePart =
    rawDate instanceof Date
      ? rawDate.toISOString().substring(0, 10)
      : String(rawDate).substring(0, 10)
  const dateLabel = new Date(datePart + "T12:00:00").toLocaleDateString("en-US", {
    weekday: "long", month: "long", day: "numeric", year: "numeric",
  })

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
          <h2 style="color:#8B4513;margin:0 0 8px;">Volunteer Assignment</h2>
          <p style="color:#555;font-size:15px;line-height:1.6;">Dear <strong>${data.firstName} ${data.lastName}</strong>,</p>
          <p style="color:#555;font-size:15px;line-height:1.6;">
            Thank you for volunteering for Rendezvous 2026! You have been assigned the following role:
          </p>

          <table width="100%" cellpadding="0" cellspacing="0" style="background:#fef9f0;border:1px solid #f5c89a;border-radius:8px;margin:20px 0;">
            <tr><td style="padding:20px;">
              <table width="100%" cellpadding="0" cellspacing="0">
                <tr>
                  <td style="color:#888;font-size:12px;text-transform:uppercase;letter-spacing:1px;padding-bottom:4px;">Role</td>
                </tr>
                <tr>
                  <td style="color:#333;font-size:18px;font-weight:bold;padding-bottom:16px;">${data.volunteerType}</td>
                </tr>
                <tr>
                  <td style="color:#888;font-size:12px;text-transform:uppercase;letter-spacing:1px;padding-bottom:4px;">Date</td>
                </tr>
                <tr>
                  <td style="color:#333;font-size:15px;padding-bottom:16px;">${dateLabel}</td>
                </tr>
                <tr>
                  <td style="color:#888;font-size:12px;text-transform:uppercase;letter-spacing:1px;padding-bottom:4px;">Session</td>
                </tr>
                <tr>
                  <td style="color:#333;font-size:15px;padding-bottom:${data.notes ? "16px" : "0"};">${data.assignedTimeSlot}</td>
                </tr>
                ${data.notes ? `
                <tr>
                  <td style="color:#888;font-size:12px;text-transform:uppercase;letter-spacing:1px;padding-bottom:4px;">Notes</td>
                </tr>
                <tr>
                  <td style="color:#555;font-size:14px;font-style:italic;">${data.notes}</td>
                </tr>` : ""}
              </table>
            </td></tr>
          </table>

          <p style="color:#555;font-size:14px;line-height:1.6;">
            Please confirm whether you can fulfill this assignment by clicking one of the buttons below:
          </p>

          <table width="100%" cellpadding="0" cellspacing="0" style="margin:24px 0;">
            <tr>
              <td width="48%" align="center">
                <a href="${data.approveUrl}" style="display:inline-block;background:#16a34a;color:#fff;text-decoration:none;padding:14px 28px;border-radius:8px;font-size:16px;font-weight:bold;font-family:Georgia,serif;">
                  Accept Assignment
                </a>
              </td>
              <td width="4%"></td>
              <td width="48%" align="center">
                <a href="${data.declineUrl}" style="display:inline-block;background:#dc2626;color:#fff;text-decoration:none;padding:14px 28px;border-radius:8px;font-size:16px;font-weight:bold;font-family:Georgia,serif;">
                  Decline Assignment
                </a>
              </td>
            </tr>
          </table>

          <p style="color:#888;font-size:12px;line-height:1.6;border-top:1px solid #eee;padding-top:16px;margin-top:8px;">
            If the buttons above don't work, copy and paste these links into your browser:<br/>
            Accept: ${data.approveUrl}<br/>
            Decline: ${data.declineUrl}
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

export async function sendCustomEmail(data: {
  to: string[]
  subject: string
  message: string
}) {
  try {
    const resend = getResend()

    const html = `
<!DOCTYPE html>
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
          <div style="color:#555;font-size:15px;line-height:1.8;white-space:pre-wrap;">${data.message}</div>
        </td></tr>
        <tr><td style="background:#f5f0eb;padding:20px;text-align:center;">
          <p style="color:#888;font-size:12px;margin:0;">Rendezvous 2026 - Lake Whitney Christian Camp - May 26-30, 2026</p>
        </td></tr>
      </table>
    </td></tr>
  </table>
</body></html>`

    const { data: emailData, error } = await resend.emails.send({
      from: FROM_ADDRESS,
      to: data.to,
      subject: data.subject,
      html,
    })

    if (error) {
      return { success: false, error: error.message }
    }
    return { success: true, id: emailData?.id }
  } catch (err: any) {
    return { success: false, error: err.message }
  }
}
