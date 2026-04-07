import { type NextRequest, NextResponse } from "next/server"
import { getDb } from "@/lib/db"

export async function PATCH(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const sql = getDb()
    const { payment_status } = await request.json()
    const { id } = await params

    const result = await sql`
      UPDATE registrations 
      SET payment_status = ${payment_status},
          full_payment_paid = ${payment_status === "paid"},
          updated_at = NOW() 
      WHERE id = ${id}
      RETURNING id, payment_status, full_payment_paid, updated_at
    `

    if (result.length === 0) {
      return NextResponse.json({ error: "Registration not found" }, { status: 404 })
    }

    return NextResponse.json({ success: true, registration: result[0] })
  } catch (error) {
    console.error("Error updating payment:", error)
    return NextResponse.json({ error: "Failed to update payment status" }, { status: 500 })
  }
}
