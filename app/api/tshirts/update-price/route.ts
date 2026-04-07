import { getDb } from "@/lib/db"
import { NextResponse, NextRequest } from "next/server"

export async function POST(request: NextRequest) {
  try {
    const sql = getDb()
    const { size, price } = await request.json()

    if (!size || isNaN(price) || price < 0) {
      return NextResponse.json({ error: "Invalid size or price" }, { status: 400 })
    }

    // Update all t-shirt orders with this size
    const result = await sql`
      UPDATE tshirt_orders
      SET price = ${price}
      WHERE size = ${size}
    `

    return NextResponse.json({ success: true, updated: result.rowCount ?? 0 })
  } catch (error) {
    console.error("[v0] Error updating t-shirt prices:", error)
    return NextResponse.json({ error: "Failed to update t-shirt prices" }, { status: 500 })
  }
}
