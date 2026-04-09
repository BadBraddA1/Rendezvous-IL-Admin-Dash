import { getDb } from "@/lib/db"

function serializeRow(row: any) {
  const serialized: any = {}
  for (const [key, value] of Object.entries(row)) {
    if (value instanceof Date) {
      serialized[key] = value.toISOString()
    } else if (typeof value === "bigint") {
      serialized[key] = Number(value)
    } else {
      serialized[key] = value
    }
  }
  return serialized
}

export async function GET(request: Request) {
  try {
    const sql = getDb()
    const { searchParams } = new URL(request.url)
    const status = searchParams.get("status")
    const search = searchParams.get("search")

    console.log("[v0] Fetching registrations with filters:", { status, search })

    let result

    if (status && status !== "all" && search) {
      // Filter by both status and search
      result = await sql`
        SELECT 
          r.*,
          COUNT(DISTINCT fm.id) as family_member_count,
          COUNT(DISTINCT ts.id) as tshirt_order_count,
          COUNT(DISTINCT vs.id) as volunteer_count,
          (SELECT first_name FROM family_members WHERE registration_id = r.id ORDER BY age DESC NULLS LAST, id LIMIT 1) as first_person_name
        FROM registrations r
        LEFT JOIN family_members fm ON r.id = fm.registration_id
        LEFT JOIN tshirt_orders ts ON r.id = ts.registration_id
        LEFT JOIN volunteer_signups vs ON r.id = vs.registration_id
        WHERE r.payment_status = ${status}
          AND (r.family_last_name ILIKE ${"%" + search + "%"} OR r.email ILIKE ${"%" + search + "%"})
        GROUP BY r.id 
        ORDER BY r.created_at DESC
      `
    } else if (status && status !== "all") {
      // Filter by status only
      result = await sql`
        SELECT 
          r.*,
          COUNT(DISTINCT fm.id) as family_member_count,
          COUNT(DISTINCT ts.id) as tshirt_order_count,
          COUNT(DISTINCT vs.id) as volunteer_count,
          (SELECT first_name FROM family_members WHERE registration_id = r.id ORDER BY age DESC NULLS LAST, id LIMIT 1) as first_person_name
        FROM registrations r
        LEFT JOIN family_members fm ON r.id = fm.registration_id
        LEFT JOIN tshirt_orders ts ON r.id = ts.registration_id
        LEFT JOIN volunteer_signups vs ON r.id = vs.registration_id
        WHERE r.payment_status = ${status}
        GROUP BY r.id 
        ORDER BY r.created_at DESC
      `
    } else if (search) {
      // Filter by search only
      result = await sql`
        SELECT 
          r.*,
          COUNT(DISTINCT fm.id) as family_member_count,
          COUNT(DISTINCT ts.id) as tshirt_order_count,
          COUNT(DISTINCT vs.id) as volunteer_count,
          (SELECT first_name FROM family_members WHERE registration_id = r.id ORDER BY age DESC NULLS LAST, id LIMIT 1) as first_person_name
        FROM registrations r
        LEFT JOIN family_members fm ON r.id = fm.registration_id
        LEFT JOIN tshirt_orders ts ON r.id = ts.registration_id
        LEFT JOIN volunteer_signups vs ON r.id = vs.registration_id
        WHERE r.family_last_name ILIKE ${"%" + search + "%"} OR r.email ILIKE ${"%" + search + "%"}
        GROUP BY r.id 
        ORDER BY r.created_at DESC
      `
    } else {
      // No filters
      result = await sql`
        SELECT 
          r.*,
          COUNT(DISTINCT fm.id) as family_member_count,
          COUNT(DISTINCT ts.id) as tshirt_order_count,
          COUNT(DISTINCT vs.id) as volunteer_count,
          (SELECT first_name FROM family_members WHERE registration_id = r.id ORDER BY age DESC NULLS LAST, id LIMIT 1) as first_person_name
        FROM registrations r
        LEFT JOIN family_members fm ON r.id = fm.registration_id
        LEFT JOIN tshirt_orders ts ON r.id = ts.registration_id
        LEFT JOIN volunteer_signups vs ON r.id = vs.registration_id
        GROUP BY r.id 
        ORDER BY r.created_at DESC
      `
    }

    console.log("[v0] Query executed successfully, rows:", result.length)

    const serializedRows = result.map(serializeRow)

    return Response.json(serializedRows)
  } catch (error) {
    console.error("[v0] Error fetching registrations:", error)
    return Response.json({ error: "Failed to fetch registrations" }, { status: 500 })
  }
}

export async function POST(request: Request) {
  try {
    const sql = getDb()
    const body = await request.json()
    const {
      family_last_name,
      email,
      husband_phone,
      wife_phone,
      address,
      city,
      state,
      zip,
      home_congregation,
      currently_homeschooling,
      years_homeschooling,
      times_attended,
      lodging_type,
      emergency_contact_name,
      emergency_contact_phone,
      emergency_contact_relationship,
      payment_status,
    } = body

    const result = await sql`
      INSERT INTO registrations (
        family_last_name, email, husband_phone, wife_phone, address, city, state, zip,
        home_congregation, currently_homeschooling, years_homeschooling, times_attended,
        lodging_type, emergency_contact_name, emergency_contact_phone, 
        emergency_contact_relationship, payment_status, created_at, updated_at
      ) VALUES (
        ${family_last_name}, ${email}, ${husband_phone}, ${wife_phone}, ${address}, 
        ${city}, ${state}, ${zip}, ${home_congregation}, ${currently_homeschooling}, 
        ${years_homeschooling}, ${times_attended}, ${lodging_type}, ${emergency_contact_name}, 
        ${emergency_contact_phone}, ${emergency_contact_relationship}, ${payment_status || "pending"}, 
        NOW(), NOW()
      )
      RETURNING *
    `

    return Response.json(serializeRow(result[0]), { status: 201 })
  } catch (error) {
    console.error("[v0] Error creating registration:", error)
    return Response.json({ error: "Failed to create registration" }, { status: 500 })
  }
}
