import { type NextRequest, NextResponse } from "next/server"
import { getDb } from "@/lib/db"
import { sendRegistrationConfirmation } from "@/lib/email"

export async function POST(request: NextRequest) {
  try {
    const { registrationId } = await request.json()

    if (!registrationId) {
      return NextResponse.json({ error: "Registration ID is required" }, { status: 400 })
    }

    const sql = getDb()

    // Get registration details
    const registration = await sql`
      SELECT * FROM registrations WHERE id = ${registrationId}
    `

    if (!registration || registration.length === 0) {
      return NextResponse.json({ error: "Registration not found" }, { status: 404 })
    }

    const reg = registration[0]

    const familyMembers = await sql`
      SELECT first_name, last_name, age, is_baptized FROM family_members 
      WHERE registration_id = ${registrationId}
      ORDER BY age DESC
    `

    // Send email
    const result = await sendRegistrationConfirmation({
      id: Number(reg.id),
      familyName: reg.family_last_name,
      email: reg.email,
      phone: reg.husband_phone || reg.wife_phone || "",
      familyMembers: familyMembers.map((fm: any) => ({
        name: `${fm.first_name} ${fm.last_name}`,
        age: Number(fm.age),
        baptized: fm.is_baptized || false,
      })),
      lodgingType: reg.lodging_type,
      lodgingTotal: Number(reg.lodging_total || 0),
      registrationFee: Number(reg.registration_fee || 0),
      scholarshipDonation: Number(reg.scholarship_donation || 0),
      checkinQrCode: reg.checkin_qr_code,
    })

    if (result.success) {
      return NextResponse.json({ message: "Email sent successfully", emailId: result.id })
    } else {
      return NextResponse.json({ error: result.error }, { status: 500 })
    }
  } catch (error) {
    console.error("Error resending confirmation:", error)
    return NextResponse.json({ error: "Failed to resend confirmation email" }, { status: 500 })
  }
}
