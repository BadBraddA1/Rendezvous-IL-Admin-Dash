import { NextResponse } from "next/server"
import { getDb } from "@/lib/db"

// POST - re-run name matching on all unmatched assignments
export async function POST() {
  const sql = getDb()
  
  // Get all unmatched assignments
  const unmatched = await sql`
    SELECT id, assigned_name 
    FROM special_assignments 
    WHERE registration_id IS NULL
  `
  
  let matchedCount = 0
  
  for (const assignment of unmatched) {
    const match = await matchNameToFamilyMember(sql, assignment.assigned_name)
    
    if (match) {
      await sql`
        UPDATE special_assignments
        SET registration_id = ${match.registration_id},
            family_member_id = ${match.family_member_id},
            updated_at = NOW()
        WHERE id = ${assignment.id}
      `
      matchedCount++
    }
  }
  
  return NextResponse.json({ 
    success: true, 
    checked: unmatched.length,
    newMatches: matchedCount 
  })
}

async function matchNameToFamilyMember(sql: any, fullName: string) {
  if (!fullName) return null
  
  const parts = fullName.trim().split(/\s+/)
  if (parts.length < 2) return null
  
  const firstName = parts[0]
  const lastName = parts[parts.length - 1]
  
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
