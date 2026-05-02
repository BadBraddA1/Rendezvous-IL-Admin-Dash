import { NextRequest, NextResponse } from "next/server"
import { getDb } from "@/lib/db"

// DELETE single assignment
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params
  const sql = getDb()
  
  await sql`DELETE FROM special_assignments WHERE id = ${id}`
  
  return NextResponse.json({ success: true })
}

// PUT - update assignment
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params
  const sql = getDb()
  const body = await request.json()
  
  const { activity_name, assigned_name, assigned_date, time_slot, notes, registration_id, family_member_id } = body
  
  const result = await sql`
    UPDATE special_assignments
    SET 
      activity_name = ${activity_name},
      assigned_name = ${assigned_name},
      assigned_date = ${assigned_date || null},
      time_slot = ${time_slot || null},
      notes = ${notes || null},
      registration_id = ${registration_id || null},
      family_member_id = ${family_member_id || null},
      updated_at = NOW()
    WHERE id = ${id}
    RETURNING *
  `
  
  return NextResponse.json(result[0])
}
