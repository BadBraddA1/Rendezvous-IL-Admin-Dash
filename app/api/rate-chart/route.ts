import { NextResponse } from "next/server"
import { getDb } from "@/lib/db"

export async function GET() {
  try {
    const sql = getDb()
    const rates = await sql`
      SELECT * FROM rate_chart ORDER BY sort_order, rate_key
    `
    return NextResponse.json(rates)
  } catch (error) {
    console.error("Error fetching rate chart:", error)
    return NextResponse.json({ error: "Failed to fetch rate chart" }, { status: 500 })
  }
}

export async function PUT(request: Request) {
  try {
    const sql = getDb()
    const body = await request.json()
    const { rate_key, rate_value } = body

    if (!rate_key || rate_value === undefined) {
      return NextResponse.json({ error: "rate_key and rate_value are required" }, { status: 400 })
    }

    const result = await sql`
      UPDATE rate_chart 
      SET rate_value = ${rate_value}, updated_at = CURRENT_TIMESTAMP
      WHERE rate_key = ${rate_key}
      RETURNING *
    `

    if (result.length === 0) {
      return NextResponse.json({ error: "Rate not found" }, { status: 404 })
    }

    return NextResponse.json(result[0])
  } catch (error) {
    console.error("Error updating rate:", error)
    return NextResponse.json({ error: "Failed to update rate" }, { status: 500 })
  }
}
