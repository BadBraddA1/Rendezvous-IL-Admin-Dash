import { NextRequest, NextResponse } from "next/server"
import { getDb } from "@/lib/db"

// GET all special assignments
export async function GET() {
  const sql = getDb()
  
  const assignments = await sql`
    SELECT 
      sa.*,
      r.family_last_name,
      fm.first_name as matched_first_name
    FROM special_assignments sa
    LEFT JOIN registrations r ON r.id = sa.registration_id
    LEFT JOIN family_members fm ON fm.id = sa.family_member_id
    ORDER BY sa.assigned_date, sa.time_slot, sa.activity_name
  `
  
  return NextResponse.json(assignments)
}

// POST - create or import assignments
export async function POST(request: NextRequest) {
  const sql = getDb()
  const body = await request.json()
  
  // Handle bulk import
  if (body.assignments && Array.isArray(body.assignments)) {
    const results = []
    
    for (const a of body.assignments) {
      // Try to match the name to a family member
      const match = await matchNameToFamilyMember(sql, a.assigned_name)
      
      const result = await sql`
        INSERT INTO special_assignments (
          activity_name, assigned_name, assigned_date, time_slot, notes,
          registration_id, family_member_id
        ) VALUES (
          ${a.activity_name},
          ${a.assigned_name},
          ${a.assigned_date || null},
          ${a.time_slot || null},
          ${a.notes || null},
          ${match?.registration_id || null},
          ${match?.family_member_id || null}
        )
        RETURNING *
      `
      results.push({ ...result[0], matched: !!match })
    }
    
    const matched = results.filter(r => r.matched).length
    return NextResponse.json({ 
      success: true, 
      imported: results.length,
      matched,
      unmatched: results.length - matched
    })
  }
  
  // Single assignment
  const { activity_name, assigned_name, assigned_date, time_slot, notes } = body
  
  const match = await matchNameToFamilyMember(sql, assigned_name)
  
  const result = await sql`
    INSERT INTO special_assignments (
      activity_name, assigned_name, assigned_date, time_slot, notes,
      registration_id, family_member_id
    ) VALUES (
      ${activity_name},
      ${assigned_name},
      ${assigned_date || null},
      ${time_slot || null},
      ${notes || null},
      ${match?.registration_id || null},
      ${match?.family_member_id || null}
    )
    RETURNING *
  `
  
  return NextResponse.json(result[0])
}

// Helper to match "Abel Bradd" to a family member
async function matchNameToFamilyMember(sql: any, fullName: string) {
  if (!fullName) return null
  
  const parts = fullName.trim().split(/\s+/)
  if (parts.length < 2) return null
  
  const firstName = parts[0]
  const lastName = parts[parts.length - 1]
  
  // Try to find a family member with matching first name in a registration with matching last name
  const matches = await sql`
    SELECT fm.id as family_member_id, fm.first_name, r.id as registration_id, r.family_last_name
    FROM family_members fm
    JOIN registrations r ON r.id = fm.registration_id
    WHERE LOWER(fm.first_name) = LOWER(${firstName})
      AND LOWER(r.family_last_name) = LOWER(${lastName})
    LIMIT 1
  `
  
  if (matches.length > 0) {
    return {
      family_member_id: matches[0].family_member_id,
      registration_id: matches[0].registration_id
    }
  }
  
  return null
}

// DELETE all assignments
export async function DELETE() {
  const sql = getDb()
  await sql`DELETE FROM special_assignments`
  return NextResponse.json({ success: true })
}
