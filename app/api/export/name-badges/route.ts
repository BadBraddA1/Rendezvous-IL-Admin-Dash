import { NextResponse } from "next/server"
import { getDb } from "@/lib/db"

export async function GET() {
  try {
    const sql = getDb()
    const familyMembers = await sql`
      SELECT 
        fm.first_name,
        r.family_last_name,
        r.home_congregation,
        fm.age
      FROM family_members fm
      JOIN registrations r ON fm.registration_id = r.id
      ORDER BY r.family_last_name, fm.first_name
    `

    // Create CSV content
    const headers = ["First Name", "Last Name", "Congregation", "Age"]
    const csvRows = [
      headers.join(","),
      ...familyMembers.map((member: any) =>
        [
          `"${member.first_name || ""}"`,
          `"${member.family_last_name || ""}"`,
          `"${member.home_congregation || ""}"`,
          member.age || "",
        ].join(","),
      ),
    ]

    const csv = csvRows.join("\n")

    return new NextResponse(csv, {
      headers: {
        "Content-Type": "text/csv",
        "Content-Disposition": 'attachment; filename="name-badges.csv"',
      },
    })
  } catch (error) {
    console.error("[v0] Error exporting name badges:", error)
    return NextResponse.json({ error: "Failed to export name badges" }, { status: 500 })
  }
}
