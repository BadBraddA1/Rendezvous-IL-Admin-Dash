import { NextResponse } from "next/server"
import { getDb } from "@/lib/db"

const assignments = [
  { activity: "Prepare Check-In Packets & Double-check Packing List", time: "Prepare ahead of time", name: "Stephen Bradd" },
  { activity: "Assembly organizer (speaking & other worship assignments)", time: "Prepare ahead of time", name: "Stephen Bradd" },
  { activity: "Meal Prayer Organizer", time: "All 12 meals", name: "Adam Cozort" },
  { activity: "Take-A-Hike Ice Breaker Game in Room 205/206", time: "Monday 4:00 - 5:00 PM", name: "Caleb Meacham" },
  { activity: "Bring laptop for Power Point loaded with digital songbook", time: "Monday before 5 PM", name: "Adin Bradd" },
  { activity: "A/V & digital song book for assemblies", time: "Each 9 AM & 7 PM assembly", name: "Adin Bradd" },
  { activity: "Check-in (distribute keys, collect money, help newbies)", time: "Monday 1 - 5 PM", name: "Englishes" },
  { activity: "Small Gym: Black-light dodgeball, Bombardment, Steal the Bacon", time: "Monday 8 - 9 PM", name: "Abel Bradd" },
  { activity: "Main Gym: 9 Square & Knockout", time: "Monday 9 - 10 PM", name: "Abel Bradd" },
  { activity: "Mom's Session", time: "Tuesday 10 - 11:55 AM", name: "Melissa Collins" },
  { activity: "Young Adult Session (non-parent graduates)", time: "Tuesday 10 - 11:55 AM", name: "Stephen Bradd" },
  { activity: "Miniature Painting Session #1", time: "Tuesday 10 - 11:30 AM", name: "Englishes" },
  { activity: "Small Gym: Black-light dodgeball, Bombardment, Steal the Bacon", time: "Tuesday 10 - 11 AM", name: "Amos Bradd" },
  { activity: "Main Gym: 9 Square & Knockout", time: "Tuesday 11 - 11:55 AM", name: "Amos Bradd" },
  { activity: "Obstacle course & rope games", time: "Tuesday 1:30 - 2:30 PM", name: "Stephen Bradd" },
  { activity: "Archery", time: "Tuesday 1:30 - 3:30 PM", name: "Brian Collins" },
  { activity: "Human Foosball", time: "Tuesday 3:30 - 4:30 PM", name: "Daniel/Peter Zamfir" },
  { activity: "Play childrens' movie in meeting room", time: "Tuesday 3:30 PM", name: "Adin Bradd" },
  { activity: "Female lifeguard", time: "Tuesday 8 - 10 PM", name: "LWCC Staff" },
  { activity: "Dad's Session", time: "Wednesday 10 - 11:55 AM", name: "Brian Collins" },
  { activity: "Small Gym: Black-light dodgeball, Bombardment, Steal the Bacon", time: "Wednesday 10 - 11 AM", name: "Isaac Hanes" },
  { activity: "Main Gym: 9 Square & Knockout", time: "Wednesday 11 - 11:55 AM", name: "Isaac Hanes" },
  { activity: "Kickball", time: "Wednesday 1:30 - 2:30 PM", name: "Adam Cozort" },
  { activity: "Gaga Ball Tournament", time: "Wednesday 2:30 - 3:30 PM", name: "Amos Bradd" },
  { activity: "Scrabble Tournament", time: "Wednesday 2:30 - 5:00 PM", name: "Stephen Bradd" },
  { activity: "Play childrens' movie in meeting room", time: "Wednesday 3:30 PM", name: "Adin Bradd" },
  { activity: "Craft in Activity Room", time: "Wednesday 3:30 - 5:00 PM", name: "Jonlyn Meacham" },
  { activity: "Craft in Activity Room", time: "Wednesday 3:30 - 5:00 PM", name: "Jill Watson" },
  { activity: "Disc Golf", time: "Wednesday 3:30 - 4:30 PM", name: "Abram Bradd" },
  { activity: "Male lifeguard", time: "Wednesday 8 - 10 PM", name: "LWCC Staff" },
  { activity: "Bible Bowl", time: "Thursday 10 - 10:30 AM", name: "Stephen Bradd" },
  { activity: "Ping Pong Tourney", time: "Thursday 10:20 - 11:55 AM", name: "Ryan Manning" },
  { activity: "Paddle boats & canoes at beachfront", time: "Thursday 1:30 - 3:30 PM", name: "LWCC Staff" },
  { activity: "Miniature Painting Session #2", time: "Thursday 3 - 5 PM", name: "Englishes" },
  { activity: "Play childrens' movie in meeting room", time: "Thursday 3:30 PM", name: "Adin Bradd" },
  { activity: "Billiards & Air Hockey Tournaments", time: "Thursday 3:30 - 5 PM", name: "Ryan Manning" },
  { activity: "Glow-in-the-Dark Capture the Flag", time: "Thursday 8 - 9 PM", name: "Stephen Bradd" },
  { activity: "Adult/Teen Volleyball", time: "Thursday 9 - 10 PM", name: "Nathan Cozort" },
]

// Event dates for 2026: May 4 (Mon), May 5 (Tue), May 6 (Wed), May 7 (Thu)
const dayToDate: Record<string, string> = {
  "Monday": "2026-05-04",
  "Tuesday": "2026-05-05", 
  "Wednesday": "2026-05-06",
  "Thursday": "2026-05-07",
}

function parseDay(time: string): string | null {
  for (const day of Object.keys(dayToDate)) {
    if (time.includes(day)) return dayToDate[day]
  }
  return null
}

// Match name to registration
async function matchName(sql: any, name: string) {
  // Handle family names like "Englishes"
  if (name === "Englishes") {
    const reg = await sql`
      SELECT id FROM registrations WHERE family_last_name ILIKE 'English' LIMIT 1
    `
    return reg[0] ? { registration_id: reg[0].id, family_member_id: null } : null
  }
  
  // Skip LWCC Staff
  if (name === "LWCC Staff") return null
  
  // Try to match "FirstName LastName" pattern
  const parts = name.split(" ")
  if (parts.length >= 2) {
    const firstName = parts[0]
    const lastName = parts[parts.length - 1]
    
    // Find family member
    const members = await sql`
      SELECT fm.id as family_member_id, fm.registration_id
      FROM family_members fm
      JOIN registrations r ON r.id = fm.registration_id
      WHERE fm.first_name ILIKE ${firstName}
      AND r.family_last_name ILIKE ${lastName}
      LIMIT 1
    `
    
    if (members[0]) {
      return { registration_id: members[0].registration_id, family_member_id: members[0].family_member_id }
    }
    
    // Try just last name for registration
    const regs = await sql`
      SELECT id FROM registrations WHERE family_last_name ILIKE ${lastName} LIMIT 1
    `
    if (regs[0]) {
      return { registration_id: regs[0].id, family_member_id: null }
    }
  }
  
  return null
}

export async function POST() {
  const sql = getDb()
  
  try {
    // Create table if not exists
    await sql`
      CREATE TABLE IF NOT EXISTS special_assignments (
        id SERIAL PRIMARY KEY,
        activity_name TEXT NOT NULL,
        assigned_name TEXT NOT NULL,
        assigned_date DATE,
        time_slot TEXT,
        notes TEXT,
        registration_id INTEGER REFERENCES registrations(id),
        family_member_id INTEGER REFERENCES family_members(id),
        created_at TIMESTAMPTZ DEFAULT NOW(),
        updated_at TIMESTAMPTZ DEFAULT NOW()
      )
    `
    
    // Clear existing
    await sql`DELETE FROM special_assignments`
    
    let imported = 0
    let matched = 0
    
    for (const a of assignments) {
      const dateStr = parseDay(a.time)
      const match = await matchName(sql, a.name)
      
      await sql`
        INSERT INTO special_assignments (activity_name, assigned_name, assigned_date, time_slot, registration_id, family_member_id)
        VALUES (${a.activity}, ${a.name}, ${dateStr}, ${a.time}, ${match?.registration_id || null}, ${match?.family_member_id || null})
      `
      
      imported++
      if (match?.registration_id) matched++
    }
    
    return NextResponse.json({ 
      success: true, 
      imported, 
      matched,
      unmatched: imported - matched,
      message: `Imported ${imported} assignments. ${matched} matched to registrations.`
    })
  } catch (error: any) {
    console.error("[v0] Import error:", error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}

export async function GET() {
  return NextResponse.json({ message: "POST to this endpoint to import 2026 assignments" })
}
