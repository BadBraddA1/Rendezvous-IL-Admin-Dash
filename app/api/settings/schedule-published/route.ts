import { NextResponse } from "next/server"
import { getDb } from "@/lib/db"

async function ensureSettingsTable(sql: ReturnType<typeof getDb>) {
  await sql`
    CREATE TABLE IF NOT EXISTS app_settings (
      key TEXT PRIMARY KEY,
      value TEXT NOT NULL,
      updated_at TIMESTAMPTZ DEFAULT NOW()
    )
  `
  await sql`
    INSERT INTO app_settings (key, value)
    VALUES ('schedule_published', 'false')
    ON CONFLICT (key) DO NOTHING
  `
}

export async function GET() {
  try {
    const sql = getDb()
    await ensureSettingsTable(sql)
    const rows = await sql`SELECT value FROM app_settings WHERE key = 'schedule_published'`
    const published = rows[0]?.value === "true"
    return NextResponse.json({ published })
  } catch (error) {
    console.error("[v0] Error fetching schedule publish status:", error)
    return NextResponse.json({ published: false })
  }
}

export async function POST(request: Request) {
  try {
    const sql = getDb()
    await ensureSettingsTable(sql)
    const { published } = await request.json()
    await sql`
      INSERT INTO app_settings (key, value, updated_at)
      VALUES ('schedule_published', ${published ? "true" : "false"}, NOW())
      ON CONFLICT (key) DO UPDATE SET value = EXCLUDED.value, updated_at = NOW()
    `
    return NextResponse.json({ published })
  } catch (error) {
    console.error("[v0] Error updating schedule publish status:", error)
    return NextResponse.json({ error: "Failed to update" }, { status: 500 })
  }
}
