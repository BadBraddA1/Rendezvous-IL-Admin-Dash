import { type NextRequest, NextResponse } from "next/server"
import { getDb } from "@/lib/db"

const AUTH_TOKEN = process.env.AUTH_TOKEN || "default_auth_token_change_me"

export async function POST(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    // Admin-only: require valid admin_auth cookie
    const cookie = request.cookies.get("admin_auth")
    if (!cookie || cookie.value !== AUTH_TOKEN) {
      return NextResponse.json({ error: "Not authorized" }, { status: 401 })
    }

    const { id } = await params
    const registrationId = Number(id)
    const body = await request.json()
    const amount = Number(body.amount)
    const note: string | undefined = body.note

    if (!registrationId || !Number.isFinite(amount) || amount <= 0) {
      return NextResponse.json({ error: "A positive amount is required" }, { status: 400 })
    }

    const sql = getDb()

    const existing = await sql`
      SELECT id, registration_fee, lodging_total, tshirt_total, climbing_tower_total,
             scholarship_donation, scholarship_amount_paid, scholarship_requested
      FROM registrations
      WHERE id = ${registrationId}
    `

    if (existing.length === 0) {
      return NextResponse.json({ error: "Registration not found" }, { status: 404 })
    }

    const reg = existing[0]
    if (!reg.scholarship_requested) {
      return NextResponse.json(
        { error: "This family does not have a scholarship request on file" },
        { status: 400 },
      )
    }

    const fullTotal =
      Number(reg.registration_fee || 0) +
      Number(reg.lodging_total || 0) +
      Number(reg.tshirt_total || 0) +
      Number(reg.climbing_tower_total || 0) +
      Number(reg.scholarship_donation || 0)

    const previouslyPaid = Number(reg.scholarship_amount_paid || 0)
    const newPaid = previouslyPaid + amount
    const fullyCovered = newPaid >= fullTotal

    const noteSuffix = `Scholarship contribution: $${amount.toFixed(2)} on ${new Date().toLocaleDateString()}${note ? ` (${note})` : ""}`

    const updated = await sql`
      UPDATE registrations
      SET scholarship_amount_paid = ${newPaid},
          payment_status = ${fullyCovered ? "paid" : "partial"},
          full_payment_paid = ${fullyCovered},
          registration_fee_paid = ${fullyCovered || newPaid >= Number(reg.registration_fee || 0)},
          scholarship_requested = ${!fullyCovered},
          payment_notes = COALESCE(payment_notes || ' | ', '') || ${noteSuffix},
          updated_at = NOW()
      WHERE id = ${registrationId}
      RETURNING id, payment_status, full_payment_paid, registration_fee_paid,
                scholarship_requested, scholarship_amount_paid, payment_notes, updated_at
    `

    return NextResponse.json({
      success: true,
      registration: updated[0],
      fullTotal,
      amountCollected: amount,
      fullyCovered,
    })
  } catch (error) {
    console.error("Error recording scholarship payment:", error)
    return NextResponse.json({ error: "Failed to record scholarship payment" }, { status: 500 })
  }
}
