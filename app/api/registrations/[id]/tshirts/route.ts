import { getDb } from "@/lib/db"
import { NextResponse, NextRequest } from "next/server"

export async function POST(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const sql = getDb()
    const { id } = await params
    const body = await request.json()
    const orders: { size: string; color: string; quantity: number; price: number }[] = body.orders ?? []

    // Delete all existing orders for this registration
    await sql`DELETE FROM tshirt_orders WHERE registration_id = ${Number(id)}`

    // Insert each order individually
    for (const order of orders) {
      const size = String(order.size ?? "")
      const color = String(order.color ?? "")
      const quantity = Number(order.quantity) || 1
      const price = parseFloat(String(order.price)) || 0

      await sql`
        INSERT INTO tshirt_orders (registration_id, size, color, quantity, price)
        VALUES (${Number(id)}, ${size}, ${color}, ${quantity}, ${price})
      `
    }

    // Recalculate tshirt_total on the registration
    await sql`
      UPDATE registrations
      SET tshirt_total = (
        SELECT COALESCE(SUM(price * quantity), 0)
        FROM tshirt_orders
        WHERE registration_id = ${Number(id)}
      ),
      updated_at = NOW()
      WHERE id = ${Number(id)}
    `

    return NextResponse.json({ success: true })
  } catch (error: any) {
    console.error("Error updating t-shirt orders:", error?.message ?? error)
    return NextResponse.json({ error: String(error?.message ?? "Failed to update t-shirt orders") }, { status: 500 })
  }
}
