import { neon } from "@neondatabase/serverless"
import { NextResponse } from "next/server"

export async function POST(request: Request) {
  try {
    const sql = neon(process.env.DATABASE_URL!)
    const body = await request.json()
    const { registrationId, regFee, lodgingTotal, memberUpdates } = body

    if (!registrationId) {
      return NextResponse.json({ error: "Registration ID required" }, { status: 400 })
    }

    // Update registration totals
    await sql`
      UPDATE registrations 
      SET 
        registration_fee = ${regFee},
        lodging_total = ${lodgingTotal},
        updated_at = NOW()
      WHERE id = ${registrationId}
    `

    // Update each family member's rate and cost
    if (memberUpdates && Array.isArray(memberUpdates)) {
      for (const member of memberUpdates) {
        await sql`
          UPDATE family_members
          SET 
            rate_key = ${member.rate_key},
            person_cost = ${member.person_cost}
          WHERE id = ${member.id}
        `
      }
    }

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error("Error saving pricing:", error)
    return NextResponse.json({ error: "Failed to save pricing" }, { status: 500 })
  }
}
