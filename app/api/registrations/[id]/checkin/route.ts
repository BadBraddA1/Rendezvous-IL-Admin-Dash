import { type NextRequest, NextResponse } from "next/server"
import { cookies } from "next/headers"
import { getDb } from "@/lib/db"

const ADMIN_AUTH_TOKEN = process.env.ADMIN_AUTH_TOKEN || "rendezvous-2026-admin"

export async function DELETE(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    // Admin-only: require the same admin_auth cookie used elsewhere.
    const cookieStore = await cookies()
    const auth = cookieStore.get("admin_auth")?.value
    if (auth !== ADMIN_AUTH_TOKEN) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const sql = getDb()
    const { id } = await params

    const result = await sql`
      UPDATE registrations
      SET
        checked_in = FALSE,
        checked_in_at = NULL,
        room_keys = NULL,
        keys_taken_count = NULL,
        keys_returned = FALSE,
        keys_returned_at = NULL,
        updated_at = NOW()
      WHERE id = ${id}
      RETURNING id
    `

    if (result.length === 0) {
      return NextResponse.json({ error: "Registration not found" }, { status: 404 })
    }

    console.log(`[v0] Undid check-in for registration ${id}`)
    return NextResponse.json({ success: true, checked_in: false })
  } catch (error) {
    console.error("[v0] Error undoing check-in:", error)
    return NextResponse.json({ error: "Failed to undo check-in" }, { status: 500 })
  }
}

export async function POST(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const sql = getDb()
    const { id } = await params
    const body = await request.json().catch(() => ({}))
    const { room_keys, keys_taken_count } = body

    // Build the update based on whether room keys are provided
    const result = room_keys && Array.isArray(room_keys) && room_keys.length > 0
      ? await sql`
          UPDATE registrations 
          SET 
            checked_in = TRUE,
            checked_in_at = NOW(),
            room_keys = ${room_keys},
            keys_taken_count = ${keys_taken_count || 2},
            updated_at = NOW()
          WHERE id = ${id}
          RETURNING *
        `
      : await sql`
          UPDATE registrations 
          SET 
            checked_in = TRUE,
            checked_in_at = NOW(),
            updated_at = NOW()
          WHERE id = ${id}
          RETURNING *
        `

    if (result.length === 0) {
      return NextResponse.json({ error: "Registration not found" }, { status: 404 })
    }

    console.log(`[v0] Checked in registration ${id}`)

    return NextResponse.json({
      success: true,
      checked_in_at: result[0].checked_in_at,
      checked_in: true,
    })
  } catch (error) {
    console.error("[v0] Error checking in:", error)
    return NextResponse.json({ error: "Failed to check in" }, { status: 500 })
  }
}
