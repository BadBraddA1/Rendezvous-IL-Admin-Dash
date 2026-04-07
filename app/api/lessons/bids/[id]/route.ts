import { type NextRequest, NextResponse } from "next/server"
import { sql } from "@/lib/db"

// DELETE a bid invite
export async function DELETE(_: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  await sql`DELETE FROM lesson_bids WHERE id = ${id}`
  return NextResponse.json({ success: true })
}
