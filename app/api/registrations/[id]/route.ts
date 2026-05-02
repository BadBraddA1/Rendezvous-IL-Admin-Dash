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

export async function GET(request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const sql = getDb()
    const { id } = await params

    const registration = await sql`SELECT * FROM registrations WHERE id = ${id}`

    if (!registration || registration.length === 0) {
      return Response.json({ error: "Registration not found" }, { status: 404 })
    }

    // Get family members
    const familyMembers = await sql`SELECT * FROM family_members WHERE registration_id = ${id} ORDER BY id`

    // Get health info
    const healthInfo = await sql`SELECT * FROM health_info WHERE registration_id = ${id} ORDER BY id`

    // Get t-shirt orders
    const tshirtOrders = await sql`SELECT * FROM tshirt_orders WHERE registration_id = ${id} ORDER BY id`

    // Get volunteer signups
    const volunteers = await sql`SELECT * FROM volunteer_signups WHERE registration_id = ${id} ORDER BY id`

    // Get session suggestions
    const sessionSuggestions = await sql`SELECT * FROM session_suggestions WHERE registration_id = ${id} ORDER BY id`

    return Response.json({
      ...serializeRow(registration[0]),
      family_members: familyMembers.map(serializeRow),
      health_info: healthInfo.map(serializeRow),
      tshirt_orders: tshirtOrders.map(serializeRow),
      volunteers: volunteers.map(serializeRow),
      session_suggestions: sessionSuggestions.map(serializeRow),
    })
  } catch (error) {
    console.error("[v0] Error fetching registration:", error)
    return Response.json({ error: "Failed to fetch registration" }, { status: 500 })
  }
}

export async function PATCH(request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const sql = getDb()
    const { id } = await params
    const body = await request.json()

    // Build dynamic update query - only update fields that are provided
    const updates: string[] = []
    const values: any[] = []

    const allowedFields = [
      "family_last_name",
      "email",
      "husband_phone",
      "wife_phone",
      "address",
      "city",
      "state",
      "zip",
      "home_congregation",
      "payment_status",
      "lodging_type",
      "lodging_total",
      "emergency_contact_name",
      "emergency_contact_phone",
      "emergency_contact_relationship",
      "payment_notes",
    ]

    for (const field of allowedFields) {
      if (field in body) {
        updates.push(field)
        values.push(body[field])
      }
    }

    if (updates.length === 0) {
      return Response.json({ error: "No fields to update" }, { status: 400 })
    }

    // Build and execute the query using tagged template
    // We need to do individual field updates since neon uses tagged templates
    let result
    
    // Handle common partial update cases
    if (updates.length === 2 && updates.includes("lodging_type") && updates.includes("lodging_total")) {
      // Lodging-only update
      result = await sql`
        UPDATE registrations
        SET lodging_type = ${body.lodging_type}, lodging_total = ${body.lodging_total}, updated_at = NOW()
        WHERE id = ${id}
        RETURNING *
      `
    } else if (updates.length === 1 && updates.includes("payment_status")) {
      // Payment status only
      result = await sql`
        UPDATE registrations
        SET payment_status = ${body.payment_status}, updated_at = NOW()
        WHERE id = ${id}
        RETURNING *
      `
    } else if (updates.length === 1 && updates.includes("payment_notes")) {
      // Payment notes only
      result = await sql`
        UPDATE registrations
        SET payment_notes = ${body.payment_notes}, updated_at = NOW()
        WHERE id = ${id}
        RETURNING *
      `
    } else if (updates.length === 1 && updates.includes("lodging_total")) {
      // Lodging total only (for Accept Calculated button)
      result = await sql`
        UPDATE registrations
        SET lodging_total = ${body.lodging_total}, updated_at = NOW()
        WHERE id = ${id}
        RETURNING *
      `
    } else {
      // Full update - all fields provided
      result = await sql`
        UPDATE registrations
        SET family_last_name = ${body.family_last_name ?? null}, 
            email = ${body.email ?? null}, 
            husband_phone = ${body.husband_phone ?? null}, 
            wife_phone = ${body.wife_phone ?? null}, 
            address = ${body.address ?? null}, 
            city = ${body.city ?? null}, 
            state = ${body.state ?? null}, 
            zip = ${body.zip ?? null}, 
            home_congregation = ${body.home_congregation ?? null}, 
            payment_status = ${body.payment_status ?? null}, 
            lodging_type = ${body.lodging_type ?? null}, 
            lodging_total = ${body.lodging_total ?? null}, 
            emergency_contact_name = ${body.emergency_contact_name ?? null}, 
            emergency_contact_phone = ${body.emergency_contact_phone ?? null}, 
            emergency_contact_relationship = ${body.emergency_contact_relationship ?? null}, 
            payment_notes = ${body.payment_notes ?? null}, 
            updated_at = NOW()
        WHERE id = ${id}
        RETURNING *
      `
    }

    if (result.length === 0) {
      return Response.json({ error: "Registration not found" }, { status: 404 })
    }

    return Response.json(serializeRow(result[0]))
  } catch (error) {
    console.error("[v0] Error updating registration:", error)
    return Response.json({ error: "Failed to update registration" }, { status: 500 })
  }
}

export async function DELETE(request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const sql = getDb()
    const { id } = await params

    const result = await sql`DELETE FROM registrations WHERE id = ${id} RETURNING *`

    if (result.length === 0) {
      return Response.json({ error: "Registration not found" }, { status: 404 })
    }

    return Response.json({ success: true })
  } catch (error) {
    console.error("[v0] Error deleting registration:", error)
    return Response.json({ error: "Failed to delete registration" }, { status: 500 })
  }
}
