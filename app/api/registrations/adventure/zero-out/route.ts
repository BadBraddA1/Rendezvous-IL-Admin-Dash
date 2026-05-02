import { getDb } from "@/lib/db"
import { NextResponse } from "next/server"

export async function POST() {
  try {
    const sql = getDb()
    
    // First get the total that will be removed
    const totalResult = await sql`
      SELECT COALESCE(SUM(climbing_tower_total), 0) as total
      FROM registrations
      WHERE climbing_tower_total > 0
    `
    const totalRemoved = Number(totalResult[0]?.total || 0)
    
    // Count registrations to be updated
    const countResult = await sql`
      SELECT COUNT(*) as count
      FROM registrations
      WHERE climbing_tower_total > 0
    `
    const updated = Number(countResult[0]?.count || 0)
    
    // Zero out all climbing tower totals
    await sql`
      UPDATE registrations
      SET climbing_tower_total = 0,
          updated_at = CURRENT_TIMESTAMP
      WHERE climbing_tower_total > 0
    `

    return NextResponse.json({ 
      success: true, 
      updated, 
      totalRemoved 
    })
  } catch (error) {
    console.error("[v0] Error zeroing out adventure totals:", error)
    return NextResponse.json({ error: "Failed to zero out adventure totals" }, { status: 500 })
  }
}
