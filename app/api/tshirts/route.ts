import { NextResponse } from "next/server"
import { getDb } from "@/lib/db"

export async function GET() {
  try {
    const sql = getDb()

    const tshirts = await sql`
      SELECT 
        t.id,
        t.registration_id,
        t.size,
        t.color,
        t.quantity,
        t.price as cost,
        r.family_last_name,
        r.email,
        r.husband_phone,
        r.wife_phone
      FROM tshirt_orders t
      INNER JOIN registrations r ON t.registration_id = r.id
      ORDER BY r.family_last_name, t.size
    `

    const serializedTshirts = tshirts.map((shirt: any) => ({
      ...shirt,
      cost: shirt.cost ? Number(shirt.cost) : 0,
      quantity: shirt.quantity ? Number(shirt.quantity) : 1,
    }))

    return NextResponse.json(serializedTshirts)
  } catch (error) {
    console.error("[v0] Error fetching t-shirts:", error)
    return NextResponse.json({ error: "Failed to fetch t-shirt orders" }, { status: 500 })
  }
}
