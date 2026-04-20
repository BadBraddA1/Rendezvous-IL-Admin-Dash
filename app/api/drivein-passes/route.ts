import { NextResponse } from "next/server"
import { getDb } from "@/lib/db"

export async function GET() {
  try {
    const sql = getDb()
    const passes = await sql`
      SELECT * FROM drivein_passes ORDER BY family_name
    `
    return NextResponse.json(passes)
  } catch (error) {
    console.error("Error fetching drive-in passes:", error)
    return NextResponse.json({ error: "Failed to fetch drive-in passes" }, { status: 500 })
  }
}

export async function POST(request: Request) {
  try {
    const sql = getDb()
    const body = await request.json()
    
    const { 
      family_name, 
      contact_name, 
      contact_phone, 
      contact_email,
      num_adults,
      num_children,
      thursday_lunch,
      thursday_dinner,
      friday_breakfast,
      friday_lunch,
      friday_dinner,
      saturday_breakfast,
      saturday_lunch,
      saturday_dinner,
      sunday_breakfast,
      sunday_lunch,
      notes
    } = body

    const result = await sql`
      INSERT INTO drivein_passes (
        family_name, contact_name, contact_phone, contact_email,
        num_adults, num_children,
        thursday_lunch, thursday_dinner,
        friday_breakfast, friday_lunch, friday_dinner,
        saturday_breakfast, saturday_lunch, saturday_dinner,
        sunday_breakfast, sunday_lunch, notes
      ) VALUES (
        ${family_name}, ${contact_name}, ${contact_phone || null}, ${contact_email || null},
        ${num_adults || 0}, ${num_children || 0},
        ${thursday_lunch || false}, ${thursday_dinner || false},
        ${friday_breakfast || false}, ${friday_lunch || false}, ${friday_dinner || false},
        ${saturday_breakfast || false}, ${saturday_lunch || false}, ${saturday_dinner || false},
        ${sunday_breakfast || false}, ${sunday_lunch || false}, ${notes || null}
      )
      RETURNING *
    `

    return NextResponse.json(result[0], { status: 201 })
  } catch (error) {
    console.error("Error creating drive-in pass:", error)
    return NextResponse.json({ error: "Failed to create drive-in pass" }, { status: 500 })
  }
}
