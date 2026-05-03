import { getDb } from "@/lib/db"
import { type NextRequest, NextResponse } from "next/server"

export async function POST(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const sql = getDb()
    const { id } = await params
    const body = await request.json().catch(() => ({}))
    const distributed = body.distributed === true

    const rows = await sql`
      UPDATE registrations
      SET tshirts_distributed = ${distributed}, updated_at = NOW()
      WHERE id = ${Number(id)}
      RETURNING id, tshirts_distributed
    `

    if (rows.length === 0) {
      return NextResponse.json({ error: "Registration not found" }, { status: 404 })
    }

    return NextResponse.json({ success: true, registration: rows[0] })
  } catch (error: any) {
    console.error("Error updating tshirts_distributed:", error?.message ?? error)
    return NextResponse.json(
      { error: String(error?.message ?? "Failed to update t-shirt distribution") },
      { status: 500 },
    )
  }
}
