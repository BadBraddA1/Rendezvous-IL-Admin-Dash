import { NextResponse } from "next/server"
import { getDb } from "@/lib/db"

export async function GET(request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params
    const sql = getDb()
    const result = await sql`
      SELECT * FROM drivein_passes WHERE id = ${id}
    `
    
    if (result.length === 0) {
      return NextResponse.json({ error: "Drive-in pass not found" }, { status: 404 })
    }
    
    return NextResponse.json(result[0])
  } catch (error) {
    console.error("Error fetching drive-in pass:", error)
    return NextResponse.json({ error: "Failed to fetch drive-in pass" }, { status: 500 })
  }
}

export async function PUT(request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params
    const sql = getDb()
    const body = await request.json()
    
    const { 
      family_name, 
      contact_name, 
      contact_phone, 
      contact_email,
      num_adults,
      num_children,
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
      notes
    } = body

    const result = await sql`
      UPDATE drivein_passes SET
        family_name = ${family_name},
        contact_name = ${contact_name},
        contact_phone = ${contact_phone || null},
        contact_email = ${contact_email || null},
        num_adults = ${num_adults || 0},
        num_children = ${num_children || 0},
        monday_dinner = ${monday_dinner || false},
        tuesday_breakfast = ${tuesday_breakfast || false},
        tuesday_lunch = ${tuesday_lunch || false},
        tuesday_dinner = ${tuesday_dinner || false},
        wednesday_breakfast = ${wednesday_breakfast || false},
        wednesday_lunch = ${wednesday_lunch || false},
        wednesday_dinner = ${wednesday_dinner || false},
        thursday_breakfast = ${thursday_breakfast || false},
        thursday_lunch = ${thursday_lunch || false},
        thursday_dinner = ${thursday_dinner || false},
        friday_breakfast = ${friday_breakfast || false},
        friday_lunch = ${friday_lunch || false},
        notes = ${notes || null},
        updated_at = CURRENT_TIMESTAMP
      WHERE id = ${id}
      RETURNING *
    `

    if (result.length === 0) {
      return NextResponse.json({ error: "Drive-in pass not found" }, { status: 404 })
    }

    return NextResponse.json(result[0])
  } catch (error) {
    console.error("Error updating drive-in pass:", error)
    return NextResponse.json({ error: "Failed to update drive-in pass" }, { status: 500 })
  }
}

export async function DELETE(request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params
    const sql = getDb()
    
    const result = await sql`
      DELETE FROM drivein_passes WHERE id = ${id} RETURNING id
    `

    if (result.length === 0) {
      return NextResponse.json({ error: "Drive-in pass not found" }, { status: 404 })
    }

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error("Error deleting drive-in pass:", error)
    return NextResponse.json({ error: "Failed to delete drive-in pass" }, { status: 500 })
  }
}
