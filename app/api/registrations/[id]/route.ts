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
      payment_status,
      lodging_type,
      emergency_contact_name,
      emergency_contact_phone,
      emergency_contact_relationship,
      payment_notes,
    } = body

    const result = await sql`
      UPDATE registrations
      SET family_last_name = ${family_last_name}, email = ${email}, husband_phone = ${husband_phone}, 
          wife_phone = ${wife_phone}, address = ${address}, city = ${city}, state = ${state}, zip = ${zip}, 
          home_congregation = ${home_congregation}, payment_status = ${payment_status}, lodging_type = ${lodging_type}, 
          emergency_contact_name = ${emergency_contact_name}, emergency_contact_phone = ${emergency_contact_phone}, 
          emergency_contact_relationship = ${emergency_contact_relationship}, payment_notes = ${payment_notes}, 
          updated_at = NOW()
      WHERE id = ${id}
      RETURNING *
    `

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
