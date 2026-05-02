import { type NextRequest, NextResponse } from "next/server"
import { getDb } from "@/lib/db"
import { FROM_ADDRESS, sendBatch } from "@/lib/email"

export async function POST(request: NextRequest) {
  try {
    const { registrationId, sendToAll } = await request.json()
    const sql = getDb()

    if (!process.env.Resend_API) {
      return NextResponse.json({ error: "Email API not configured" }, { status: 500 })
    }

    // Get registration(s) to send to
    let registrations: any[]
    if (sendToAll) {
      registrations = await sql`
        SELECT 
          r.id, r.family_last_name, r.email, r.checkin_qr_code,
          r.registration_fee, r.lodging_total, r.scholarship_donation,
          r.payment_status, r.tshirt_total, r.climbing_tower_total
        FROM registrations r
        WHERE r.checkin_qr_code IS NOT NULL
        ORDER BY r.family_last_name
      `
    } else {
      registrations = await sql`
        SELECT 
          r.id, r.family_last_name, r.email, r.checkin_qr_code,
          r.registration_fee, r.lodging_total, r.scholarship_donation,
          r.payment_status, r.tshirt_total, r.climbing_tower_total
        FROM registrations r
        WHERE r.id = ${registrationId}
      `
    }

    // Build payloads for rate-limited batch sender
    const payloads: { to: string; subject: string; html: string }[] = []
    const skipped: { email: string; error: string }[] = []

    for (const reg of registrations) {
      if (!reg.email || !reg.checkin_qr_code) {
        skipped.push({ email: reg.email || "unknown", error: "Missing email or QR code" })
        continue
      }

      // Fetch volunteers for this registration
      const volunteers = await sql`
        SELECT volunteer_name, volunteer_type, assigned_date, time_slot, prayer_type
        FROM volunteer_signups
        WHERE registration_id = ${reg.id}
        AND assigned_date IS NOT NULL
        AND time_slot IS NOT NULL
        ORDER BY assigned_date, time_slot, prayer_type
      `

      const regFee = Number(reg.registration_fee || 0)
      const lodging = Number(reg.lodging_total || 0)
      const donation = Number(reg.scholarship_donation || 0)
      const tshirts = Number(reg.tshirt_total || 0)
      const adventure = Number(reg.climbing_tower_total || 0)
      const totalOwed = regFee + lodging + donation + tshirts + adventure
      let amountDue = totalOwed
      if (reg.payment_status === "paid") amountDue = 0
      else if (reg.payment_status === "partial") amountDue = lodging + donation + tshirts + adventure

      const qrCodeUrl = `https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=${encodeURIComponent(reg.checkin_qr_code)}`
      payloads.push({
        to: reg.email,
        subject: "Your Check-In QR Code - Rendezvous 2026",
        html: buildCheckinHtml(reg, regFee, lodging, donation, tshirts, adventure, totalOwed, amountDue, qrCodeUrl, volunteers),
      })
    }

    const batchResults = await sendBatch(payloads)
    const allResults = [
      ...batchResults,
      ...skipped.map((s) => ({ email: s.email, success: false, error: s.error })),
    ]

    const successCount = allResults.filter((r) => r.success).length
    const failCount = allResults.filter((r) => !r.success).length

    return NextResponse.json({
      message: `Sent ${successCount} email(s)${failCount > 0 ? `, ${failCount} failed` : ""}`,
      results: allResults,
      successCount,
      failCount,
    })
  } catch (error: any) {
    console.error("[v0] Error sending check-in emails:", error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}

function buildCheckinHtml(
  reg: any,
  regFee: number,
  lodging: number,
  donation: number,
  tshirts: number,
  adventure: number,
  totalOwed: number,
  amountDue: number,
  qrCodeUrl: string,
  volunteers: any[]
): string {
  // Build volunteer schedule HTML if there are any scheduled volunteers
  let volunteerHtml = ""
  if (volunteers.length > 0) {
    const volunteerRows = volunteers.map((v) => {
      // Handle assigned_date which could be a Date object, ISO string, or date string
      let dayName = "TBD"
      let monthDay = ""
      if (v.assigned_date) {
        const rawDate = v.assigned_date
        // Extract just the date part (YYYY-MM-DD) regardless of input format
        const dateStr = rawDate instanceof Date 
          ? rawDate.toISOString().split("T")[0] 
          : String(rawDate).substring(0, 10)
        const date = new Date(dateStr + "T12:00:00")
        if (!isNaN(date.getTime())) {
          dayName = date.toLocaleDateString("en-US", { weekday: "short" })
          monthDay = date.toLocaleDateString("en-US", { month: "short", day: "numeric" })
        }
      }
      const orderLabel = v.prayer_type === "A" || v.prayer_type === "B" ? ` [${v.prayer_type}]` : (v.prayer_type ? ` - ${v.prayer_type}` : "")
      return `<tr>
        <td style="color:#555;font-size:13px;padding:6px 8px;border-bottom:1px solid #f0e8e0;">${v.volunteer_name}</td>
        <td style="color:#555;font-size:13px;padding:6px 8px;border-bottom:1px solid #f0e8e0;">${v.volunteer_type}${orderLabel}</td>
        <td style="color:#555;font-size:13px;padding:6px 8px;border-bottom:1px solid #f0e8e0;">${dayName}${monthDay ? `, ${monthDay}` : ""}</td>
        <td style="color:#555;font-size:13px;padding:6px 8px;border-bottom:1px solid #f0e8e0;">${v.time_slot || "TBD"}</td>
      </tr>`
    }).join("")

    volunteerHtml = `
      <table width="100%" cellpadding="0" cellspacing="0" style="background:#f0f7ff;border:1px solid #a8d0f0;border-radius:8px;margin:24px 0;">
        <tr><td style="padding:20px;">
          <h3 style="color:#1e40af;margin:0 0 16px;font-size:16px;">Your Volunteer Schedule</h3>
          <table width="100%" cellpadding="0" cellspacing="0" style="background:#fff;border-radius:6px;overflow:hidden;">
            <tr style="background:#e8f4ff;">
              <th style="color:#1e40af;font-size:12px;font-weight:bold;padding:8px;text-align:left;">Name</th>
              <th style="color:#1e40af;font-size:12px;font-weight:bold;padding:8px;text-align:left;">Role</th>
              <th style="color:#1e40af;font-size:12px;font-weight:bold;padding:8px;text-align:left;">Date</th>
              <th style="color:#1e40af;font-size:12px;font-weight:bold;padding:8px;text-align:left;">Time</th>
            </tr>
            ${volunteerRows}
          </table>
          <p style="color:#555;font-size:12px;margin:12px 0 0;font-style:italic;">Thank you for volunteering! Please arrive a few minutes early for your assigned times.</p>
        </td></tr>
      </table>`
  }
  return `<!DOCTYPE html>
<html lang="en">
<head><meta charset="UTF-8" /><meta name="viewport" content="width=device-width, initial-scale=1.0" /></head>
<body style="margin:0;padding:0;background:#f5f0eb;font-family:Georgia,serif;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background:#f5f0eb;padding:32px 16px;">
    <tr><td align="center">
      <table width="600" cellpadding="0" cellspacing="0" style="background:#fff;border-radius:12px;overflow:hidden;box-shadow:0 2px 8px rgba(0,0,0,0.08);">
        <tr><td style="background:#8B4513;padding:32px;text-align:center;">
          <h1 style="color:#fff;margin:0;font-size:28px;letter-spacing:1px;">Rendezvous 2026</h1>
          <p style="color:#f5c89a;margin:8px 0 0;font-size:14px;">May 4-8, 2026 - Lake Williamson Christian Center, Carlinville, IL</p>
        </td></tr>
        <tr><td style="padding:32px;">
          <h2 style="color:#8B4513;margin:0 0 16px;font-size:22px;">Your Check-In Information</h2>
          <p style="color:#555;font-size:15px;line-height:1.6;margin:0 0 24px;">Dear <strong>${reg.family_last_name} Family</strong>,</p>
          <p style="color:#555;font-size:15px;line-height:1.6;margin:0 0 24px;">
            We're excited to see you at Rendezvous 2026! Please save this email for check-in. Present the QR code below when you arrive.
          </p>
          <div style="text-align:center;margin:32px 0;">
            <div style="background:#f5f0eb;border-radius:12px;padding:24px;display:inline-block;">
              <img src="${qrCodeUrl}" alt="Check-in QR Code" style="width:200px;height:200px;border-radius:8px;" />
              <p style="color:#8B4513;font-size:20px;font-weight:bold;margin:16px 0 4px;font-family:monospace;letter-spacing:2px;">${reg.checkin_qr_code}</p>
              <p style="color:#888;font-size:12px;margin:0;">Your Check-In Code</p>
            </div>
            <p style="color:#555;font-size:14px;line-height:1.6;margin:20px 0 0;max-width:450px;display:inline-block;">
              Please pay your balance owed at check-in with either a personal check (made out to &quot;Stephen Bradd&quot;), cash, or Venmo (<strong>sbradd78</strong>).
            </p>
          </div>
          <table width="100%" cellpadding="0" cellspacing="0" style="background:#fef9f0;border:1px solid #f5c89a;border-radius:8px;margin:24px 0;">
            <tr><td style="padding:20px;">
              <h3 style="color:#8B4513;margin:0 0 16px;font-size:16px;">Payment Summary</h3>
              <table width="100%" cellpadding="0" cellspacing="0">
                <tr><td style="color:#555;font-size:13px;padding-bottom:8px;">Registration Fee</td><td align="right" style="color:#555;font-size:13px;padding-bottom:8px;">$${regFee.toFixed(2)}</td></tr>
                <tr><td style="color:#555;font-size:13px;padding-bottom:8px;">Lodging</td><td align="right" style="color:#555;font-size:13px;padding-bottom:8px;">$${lodging.toFixed(2)}</td></tr>
                ${tshirts > 0 ? `<tr><td style="color:#555;font-size:13px;padding-bottom:8px;">T-Shirts</td><td align="right" style="color:#555;font-size:13px;padding-bottom:8px;">$${tshirts.toFixed(2)}</td></tr>` : ""}
                ${adventure > 0 ? `<tr><td style="color:#555;font-size:13px;padding-bottom:8px;">Adventure Activities</td><td align="right" style="color:#555;font-size:13px;padding-bottom:8px;">$${adventure.toFixed(2)}</td></tr>` : ""}
                ${donation > 0 ? `<tr><td style="color:#555;font-size:13px;padding-bottom:8px;">Scholarship Donation</td><td align="right" style="color:#555;font-size:13px;padding-bottom:8px;">$${donation.toFixed(2)}</td></tr>` : ""}
                <tr><td colspan="2" style="border-top:1px solid #e0d0c0;padding-top:12px;"></td></tr>
                <tr><td style="color:#333;font-size:14px;font-weight:bold;">Total</td><td align="right" style="color:#333;font-size:14px;font-weight:bold;">$${totalOwed.toFixed(2)}</td></tr>
                <tr><td colspan="2" style="padding-top:8px;"></td></tr>
                <tr>
                  <td style="color:#333;font-size:16px;font-weight:bold;">Amount Due at Check-In</td>
                  <td align="right" style="color:${amountDue > 0 ? "#dc2626" : "#16a34a"};font-size:18px;font-weight:bold;">
                    ${amountDue > 0 ? `$${amountDue.toFixed(2)}` : "PAID IN FULL"}
                  </td>
                </tr>
              </table>
            </td></tr>
          </table>
          ${volunteerHtml}
          <p style="color:#555;font-size:14px;line-height:1.6;margin:24px 0 0;">
            We look forward to a wonderful time of fellowship with the ${reg.family_last_name} family!
          </p>
        </td></tr>
        <tr><td style="background:#f5f0eb;padding:20px;text-align:center;">
          <p style="color:#888;font-size:12px;margin:0;">Rendezvous 2026 - Lake Williamson Christian Center, Carlinville, IL - May 4-8, 2026</p>
        </td></tr>
      </table>
    </td></tr>
  </table>
</body></html>`
}
