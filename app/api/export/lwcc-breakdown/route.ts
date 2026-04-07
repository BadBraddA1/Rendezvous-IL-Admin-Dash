import { NextResponse } from "next/server"
import { getDb } from "@/lib/db"

export async function GET() {
  try {
    const sql = getDb()

    // Get all family members with their costs
    const familyMembers = await sql`
      SELECT 
        r.family_last_name,
        fm.first_name,
        fm.last_name,
        fm.age,
        fm.person_cost,
        r.lodging_type,
        r.home_congregation
      FROM family_members fm
      JOIN registrations r ON fm.registration_id = r.id
      ORDER BY r.family_last_name, fm.first_name
    `

    // Calculate totals
    const totalCost = familyMembers.reduce((sum: number, member: any) => sum + (Number(member.person_cost) || 0), 0)

    // Create CSV content
    const headers = ["Family Name", "First Name", "Last Name", "Age", "Cost Per Person", "Lodging Type", "Congregation"]

    const csvRows = [
      headers.join(","),
      ...familyMembers.map((member: any) =>
        [
          `"${member.family_last_name || ""}"`,
          `"${member.first_name || ""}"`,
          `"${member.last_name || ""}"`,
          member.age || "",
          Number(member.person_cost || 0).toFixed(2),
          `"${member.lodging_type || ""}"`,
          `"${member.home_congregation || ""}"`,
        ].join(","),
      ),
      "",
      `"TOTAL OWED TO LWCC",,,,${totalCost.toFixed(2)},`,
    ]

    const csv = csvRows.join("\n")

    return new NextResponse(csv, {
      headers: {
        "Content-Type": "text/csv",
        "Content-Disposition": `attachment; filename="lwcc-breakdown-${new Date().toISOString().split("T")[0]}.csv"`,
      },
    })
  } catch (error) {
    console.error("Error exporting LWCC breakdown:", error)
    return NextResponse.json({ error: "Failed to export LWCC breakdown" }, { status: 500 })
  }
}
