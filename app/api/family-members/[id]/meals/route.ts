import { NextResponse } from "next/server"
import { getDb } from "@/lib/db"

export async function PUT(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const body = await request.json()
    const sql = getDb()

    const {
      monday_dinner,
      tuesday_breakfast,
      tuesday_lunch,
      tuesday_dinner,
      wednesday_breakfast,
      wednesday_lunch,
      wednesday_dinner,
      thursday_breakfast,
      thursday_lunch,
      thursday_dinner,
      friday_breakfast,
      friday_lunch,
    } = body

    const result = await sql`
      UPDATE family_members SET
        monday_dinner = ${monday_dinner ?? true},
        tuesday_breakfast = ${tuesday_breakfast ?? true},
        tuesday_lunch = ${tuesday_lunch ?? true},
        tuesday_dinner = ${tuesday_dinner ?? true},
        wednesday_breakfast = ${wednesday_breakfast ?? true},
        wednesday_lunch = ${wednesday_lunch ?? true},
        wednesday_dinner = ${wednesday_dinner ?? true},
        thursday_breakfast = ${thursday_breakfast ?? true},
        thursday_lunch = ${thursday_lunch ?? true},
        thursday_dinner = ${thursday_dinner ?? true},
        friday_breakfast = ${friday_breakfast ?? true},
        friday_lunch = ${friday_lunch ?? true}
      WHERE id = ${id}
      RETURNING *
    `

    if (result.length === 0) {
      return NextResponse.json({ error: "Family member not found" }, { status: 404 })
    }

    return NextResponse.json(result[0])
  } catch (error) {
    console.error("Error updating family member meals:", error)
    return NextResponse.json({ error: "Failed to update meals" }, { status: 500 })
  }
}
