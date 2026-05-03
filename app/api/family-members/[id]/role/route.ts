import { type NextRequest, NextResponse } from "next/server"
import { getDb } from "@/lib/db"

const AUTH_TOKEN = process.env.AUTH_TOKEN || "default_auth_token_change_me"

function requireAdmin(request: NextRequest) {
  const cookie = request.cookies.get("admin_auth")
  return !!cookie && cookie.value === AUTH_TOKEN
}

// Body: { role: "parent" | "child" | "auto" }
//   parent => is_adult_override = TRUE  (force into PARENTS)
//   child  => is_adult_override = FALSE (force into CHILDREN)
//   auto   => is_adult_override = NULL  (fall back to age-based default)
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  if (!requireAdmin(request)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  const { id: idParam } = await params
  const id = Number(idParam)
  if (!Number.isFinite(id) || id <= 0) {
    return NextResponse.json({ error: "Invalid id" }, { status: 400 })
  }

  let body: { role?: string } = {}
  try {
    body = await request.json()
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 })
  }

  let override: boolean | null
  switch (body.role) {
    case "parent":
      override = true
      break
    case "child":
      override = false
      break
    case "auto":
      override = null
      break
    default:
      return NextResponse.json(
        { error: 'role must be "parent", "child", or "auto"' },
        { status: 400 },
      )
  }

  try {
    const sql = getDb()
    const rows = await sql`
      UPDATE family_members
      SET is_adult_override = ${override}
      WHERE id = ${id}
      RETURNING id, first_name, age, is_adult_override
    `
    if (rows.length === 0) {
      return NextResponse.json({ error: "Family member not found" }, { status: 404 })
    }
    return NextResponse.json({ success: true, member: rows[0] })
  } catch (error) {
    console.error("[v0] Error updating family member role:", error)
    return NextResponse.json({ error: "Database error" }, { status: 500 })
  }
}
