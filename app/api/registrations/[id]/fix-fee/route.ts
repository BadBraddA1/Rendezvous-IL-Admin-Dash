import { type NextRequest, NextResponse } from "next/server"
import { getDb } from "@/lib/db"
import { Resend } from "resend"
import { FROM_ADDRESS } from "@/lib/email"

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const registrationId = Number(id)
    const { newFee, oldFee, reason } = await request.json()

    if (!registrationId || newFee === undefined) {
      return NextResponse.json({ error: "Registration ID and new fee are required" }, { status: 400 })
    }

    const sql = getDb()

    // Update the registration fee in the DB
    await sql`
      UPDATE registrations
      SET registration_fee = ${newFee},
          payment_notes = COALESCE(payment_notes || ' | ', '') || ${`Fee corrected from $${oldFee} to $${newFee}${reason ? `: ${reason}` : ""} on ${new Date().toLocaleDateString()}`},
          updated_at = NOW()
      WHERE id = ${registrationId}
    `

    // Fetch full registration details to send email
    const registrations = await sql`
      SELECT * FROM registrations WHERE id = ${registrationId}
    `

    if (!registrations || registrations.length === 0) {
      return NextResponse.json({ error: "Registration not found" }, { status: 404 })
    }

    const reg = registrations[0]

    // Try to send fee correction email via Resend
    let emailSent = false
    let emailError = ""

    if (process.env.Resend_API) {
      try {
        const resend = new Resend(process.env.Resend_API)
        const totalOwed = Number(newFee) + Number(reg.lodging_total || 0) + Number(reg.scholarship_donation || 0)

        const emailHtml = `
<!DOCTYPE html>
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
          <h2 style="color:#8B4513;margin:0 0 16px;font-size:20px;">Registration Fee Update</h2>
          <p style="color:#555;font-size:15px;line-height:1.6;margin:0 0 16px;">Dear <strong>${reg.family_last_name} Family</strong>,</p>
          <p style="color:#555;font-size:15px;line-height:1.6;margin:0 0 24px;">We wanted to let you know that your registration fee has been updated. Please review the details below.</p>
          <table width="100%" cellpadding="0" cellspacing="0" style="background:#fef9f0;border:1px solid #f5c89a;border-radius:8px;margin-bottom:24px;">
            <tr><td style="padding:20px;">
              <table width="100%" cellpadding="0" cellspacing="0">
                <tr><td style="color:#888;font-size:13px;padding-bottom:8px;">Previous Fee</td><td align="right" style="color:#888;font-size:13px;padding-bottom:8px;text-decoration:line-through;">$${Number(oldFee).toFixed(2)}</td></tr>
                <tr><td style="color:#8B4513;font-size:16px;font-weight:bold;padding-bottom:8px;">Updated Fee</td><td align="right" style="color:#8B4513;font-size:16px;font-weight:bold;padding-bottom:8px;">$${Number(newFee).toFixed(2)}</td></tr>
                <tr><td colspan="2" style="border-top:1px solid #f5c89a;padding-top:12px;"></td></tr>
                <tr><td style="color:#555;font-size:13px;padding-bottom:4px;">Lodging</td><td align="right" style="color:#555;font-size:13px;padding-bottom:4px;">$${Number(reg.lodging_total || 0).toFixed(2)}</td></tr>
                ${Number(reg.scholarship_donation || 0) > 0 ? `<tr><td style="color:#555;font-size:13px;padding-bottom:4px;">Scholarship Donation</td><td align="right" style="color:#555;font-size:13px;padding-bottom:4px;">$${Number(reg.scholarship_donation).toFixed(2)}</td></tr>` : ""}
                <tr><td colspan="2" style="border-top:1px solid #e0d0c0;padding-top:10px;"></td></tr>
                <tr><td style="color:#333;font-size:16px;font-weight:bold;">Total Owed</td><td align="right" style="color:#8B4513;font-size:18px;font-weight:bold;">$${totalOwed.toFixed(2)}</td></tr>
              </table>
            </td></tr>
          </table>
          ${reason ? `<p style="color:#555;font-size:14px;line-height:1.6;margin:0 0 24px;"><strong>Reason for update:</strong> ${reason}</p>` : ""}
          <p style="color:#555;font-size:14px;line-height:1.6;">If you have any questions, please don't hesitate to reach out. We look forward to seeing the ${reg.family_last_name} family at Rendezvous 2026!</p>
        </td></tr>
        <tr><td style="background:#f5f0eb;padding:20px;text-align:center;">
          <p style="color:#888;font-size:12px;margin:0;">Rendezvous 2026 - Lake Williamson Christian Center, Carlinville, IL - May 4-8, 2026</p>
        </td></tr>
      </table>
    </td></tr>
  </table>
</body></html>`

        const { error } = await resend.emails.send({
          from: FROM_ADDRESS,
          to: reg.email,
          subject: "Your Registration Fee Has Been Updated - Rendezvous 2026",
          html: emailHtml,
        })

        if (error) {
          emailError = error.message
        } else {
          emailSent = true
        }
      } catch (err: any) {
        emailError = err.message
      }
    }

    return NextResponse.json({
      message: emailSent
        ? "Fee updated and email sent successfully"
        : `Fee updated successfully. Email not sent: ${emailError || "No email API key configured. To send emails to registrants, verify your domain at resend.com/domains."}`,
      emailSent,
    })
  } catch (error) {
    console.error("Error fixing registration fee:", error)
    return NextResponse.json({ error: "Failed to update registration fee" }, { status: 500 })
  }
}
