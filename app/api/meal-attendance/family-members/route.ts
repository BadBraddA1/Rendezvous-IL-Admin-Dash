import { NextResponse } from "next/server"
import { getDb } from "@/lib/db"

export async function GET() {
  try {
    const sql = getDb()

    const familyMembers = await sql`
      SELECT 
        fm.id,
        fm.registration_id,
        fm.first_name,
        fm.last_name,
        fm.age,
        fm.monday_dinner,
        fm.tuesday_breakfast,
        fm.tuesday_lunch,
        fm.tuesday_dinner,
        fm.wednesday_breakfast,
        fm.wednesday_lunch,
        fm.wednesday_dinner,
        fm.thursday_breakfast,
        fm.thursday_lunch,
        fm.thursday_dinner,
        fm.friday_breakfast,
        fm.friday_lunch,
        r.family_last_name,
        r.lodging_type,
        r.arrival_notes
      FROM family_members fm
      JOIN registrations r ON fm.registration_id = r.id
      ORDER BY r.family_last_name, r.id, fm.age DESC NULLS FIRST, fm.first_name
    `

    return NextResponse.json(familyMembers)
  } catch (error) {
    console.error("Error fetching family members for meal attendance:", error)
    return NextResponse.json({ error: "Failed to fetch data" }, { status: 500 })
  }
}
