import { neon } from "@neondatabase/serverless"
import { NextResponse } from "next/server"

export async function GET() {
  try {
    const sql = neon(process.env.DATABASE_URL!)

    const registrations = await sql`
      SELECT 
        r.id,
        r.family_last_name,
        r.lodging_type,
        COALESCE(r.registration_fee, 0) as registration_fee,
        COALESCE(r.lodging_total, 0) as lodging_total,
        COALESCE(r.tshirt_total, 0) as tshirt_total,
        COALESCE(r.climbing_tower_total, 0) as climbing_tower_total,
        COALESCE(r.scholarship_donation, 0) as scholarship_donation,
        (
          SELECT json_agg(
            json_build_object(
              'id', fm.id,
              'first_name', fm.first_name,
              'age', fm.age,
              'person_cost', COALESCE(fm.person_cost, 0),
              'rate_key', fm.rate_key
            ) ORDER BY fm.age DESC NULLS LAST
          )
          FROM family_members fm
          WHERE fm.registration_id = r.id
        ) as family_members
      FROM registrations r
      ORDER BY r.family_last_name
    `

    return NextResponse.json({ 
      registrations: registrations.map(r => ({
        ...r,
        family_members: r.family_members || []
      }))
    })
  } catch (error) {
    console.error("Error fetching registrations:", error)
    return NextResponse.json({ error: "Failed to fetch registrations" }, { status: 500 })
  }
}
