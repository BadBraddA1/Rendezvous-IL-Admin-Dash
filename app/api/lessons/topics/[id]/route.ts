import { type NextRequest, NextResponse } from "next/server"
import { sql } from "@/lib/db"

// PATCH update a topic
export async function PATCH(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const body = await request.json()
  const { title, description, sort_order, assigned_presenter_name, assigned_registration_id, assigned_day, assigned_session } = body

  const result = await sql`
    UPDATE lesson_topics SET
      title = COALESCE(${title ?? null}, title),
      description = COALESCE(${description ?? null}, description),
      sort_order = COALESCE(${sort_order ?? null}, sort_order),
      assigned_presenter_name = ${assigned_presenter_name ?? null},
      assigned_registration_id = ${assigned_registration_id ?? null},
      assigned_day = ${assigned_day ?? null},
      assigned_session = ${assigned_session ?? null},
      updated_at = NOW()
    WHERE id = ${id}
    RETURNING *
  `
  if (result.length === 0) return NextResponse.json({ error: "Not found" }, { status: 404 })
  return NextResponse.json(result[0])
}

// DELETE a topic
export async function DELETE(_: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  await sql`DELETE FROM lesson_topics WHERE id = ${id}`
  return NextResponse.json({ success: true })
}
