import { getDb } from "@/lib/db"
import { NextResponse } from "next/server"

export async function GET() {
  try {
    const sql = getDb()
    const result = await sql`
      SELECT value FROM event_settings WHERE key = 'adventure_enabled'
    `
    const enabled = result[0]?.value === 'true'
    return NextResponse.json({ enabled })
  } catch (error) {
    // If table doesn't exist yet, default to disabled
    console.error("[v0] Error fetching adventure setting:", error)
    return NextResponse.json({ enabled: false })
  }
}

export async function POST(request: Request) {
  try {
    const sql = getDb()
    const { enabled } = await request.json()

    // Upsert the setting
    await sql`
      INSERT INTO event_settings (key, value, updated_at)
      VALUES ('adventure_enabled', ${enabled ? 'true' : 'false'}, CURRENT_TIMESTAMP)
      ON CONFLICT (key) DO UPDATE SET value = ${enabled ? 'true' : 'false'}, updated_at = CURRENT_TIMESTAMP
    `

    return NextResponse.json({ success: true, enabled })
  } catch (error) {
    console.error("[v0] Error updating adventure setting:", error)
    return NextResponse.json({ error: "Failed to update setting" }, { status: 500 })
  }
}
