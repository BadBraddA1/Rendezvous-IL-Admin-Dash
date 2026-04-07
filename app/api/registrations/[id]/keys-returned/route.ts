import { type NextRequest, NextResponse } from "next/server"
import { getDb } from "@/lib/db"

export async function POST(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const sql = getDb()
    const { id } = await params

    const result = await sql`
      UPDATE registrations 
      SET 
        keys_returned = TRUE,
        keys_returned_at = NOW(),
        updated_at = NOW()
      WHERE id = ${id}
      RETURNING *
    `

    if (result.length === 0) {
      return NextResponse.json({ error: "Registration not found" }, { status: 404 })
    }

    return NextResponse.json({ message: "Keys marked as returned" })
  } catch (error: any) {
    console.error("Error marking keys returned:", error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}

export async function DELETE(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const sql = getDb()
    const { id } = await params

    const result = await sql`
      UPDATE registrations 
      SET 
        keys_returned = FALSE,
        keys_returned_at = NULL,
        updated_at = NOW()
      WHERE id = ${id}
      RETURNING *
    `

    if (result.length === 0) {
      return NextResponse.json({ error: "Registration not found" }, { status: 404 })
    }

    return NextResponse.json({ message: "Keys unmarked as returned" })
  } catch (error: any) {
    console.error("Error unmarking keys returned:", error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}
