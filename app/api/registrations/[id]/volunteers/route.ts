import { NextResponse } from "next/server"
import { getDb } from "@/lib/db"

export async function POST(request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const sql = getDb()
    const { id } = await params
    const body = await request.json()
    const { volunteer_name, volunteer_type } = body

    if (!volunteer_name || !volunteer_type) {
      return NextResponse.json({ error: "volunteer_name and volunteer_type are required" }, { status: 400 })
    }

    const result = await sql`
      INSERT INTO volunteer_signups (registration_id, volunteer_name, volunteer_type)
      VALUES (${id}, ${volunteer_name}, ${volunteer_type})
      RETURNING *
    `

    return NextResponse.json(result[0])
  } catch (error) {
    console.error("[v0] Error adding volunteer signup:", error)
    return NextResponse.json({ error: "Failed to add volunteer signup" }, { status: 500 })
  }
}
