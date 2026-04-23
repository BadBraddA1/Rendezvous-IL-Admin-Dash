import { NextResponse } from "next/server"
import { getDb } from "@/lib/db"

export async function GET() {
  try {
    const sql = getDb()

    // Get all family members with their costs and registration details
    const familyMembers = await sql`
      SELECT 
        r.id as reg_id,
        r.family_last_name,
        r.arrival_notes,
        r.lodging_type,
        fm.first_name,
        fm.last_name,
        fm.age,
        fm.person_cost
      FROM family_members fm
      JOIN registrations r ON fm.registration_id = r.id
      ORDER BY r.family_last_name, fm.age DESC NULLS FIRST, fm.first_name
    `

    // Calculate total cost
    const totalCost = familyMembers.reduce((sum: number, member: any) => sum + (Number(member.person_cost) || 0), 0)

    // Build CSV rows
    const csvRows: string[] = []

    // Header
    csvRows.push("LAST NAME,FIRST NAME,AGE,LODGING,COST,NOTES")

    // Family members rows
    let currentFamily = ""
    familyMembers.forEach((member: any) => {
      const isNewFamily = member.family_last_name !== currentFamily
      currentFamily = member.family_last_name
      
      const lastName = isNewFamily ? member.family_last_name : ""
      const notes = isNewFamily && member.arrival_notes ? member.arrival_notes.replace(/"/g, '""') : ""
      const lodging = isNewFamily ? (member.lodging_type || "") : ""
      const age = member.age === null || member.age === undefined || member.age === "" || Number(member.age) >= 18 ? "adult" : member.age
      const fee = Number(member.person_cost || 0).toFixed(2)
      
      csvRows.push([
        `"${lastName}"`,
        `"${member.first_name || ""}"`,
        age,
        `"${lodging}"`,
        `$${fee}`,
        `"${notes}"`
      ].join(","))
    })

    // Total row
    csvRows.push("")
    csvRows.push(`"TOTAL",,,,,"$${totalCost.toFixed(2)}"`)

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
