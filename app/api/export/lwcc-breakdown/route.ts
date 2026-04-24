import { NextResponse } from "next/server"
import { getDb } from "@/lib/db"

export async function GET() {
  try {
    const sql = getDb()

    // Get all family members with their costs, registration details, and meal attendance
    const familyMembers = await sql`
      SELECT 
        r.id as reg_id,
        r.family_last_name,
        r.arrival_notes,
        r.lodging_type,
        fm.first_name,
        fm.last_name,
        fm.age,
        fm.person_cost,
        fm.monday_dinner,
        fm.tuesday_breakfast,
        fm.tuesday_lunch,
        fm.tuesday_dinner,
        fm.wednesday_breakfast,
        fm.wednesday_lunch,
        fm.wednesday_dinner,
        fm.thursday_breakfast,
        fm.thursday_lunch,
        fm.thursday_dinner,
        fm.friday_breakfast,
        fm.friday_lunch
      FROM family_members fm
      JOIN registrations r ON fm.registration_id = r.id
      ORDER BY r.family_last_name, r.id, fm.age DESC NULLS FIRST, fm.first_name
    `

    // Get drive-in passes
    const driveInPasses = await sql`
      SELECT 
        id,
        family_name,
        num_adults,
        num_children,
        monday_dinner,
        tuesday_breakfast,
        tuesday_lunch,
        tuesday_dinner,
        wednesday_breakfast,
        wednesday_lunch,
        wednesday_dinner,
        thursday_breakfast,
        thursday_lunch,
        thursday_dinner,
        friday_breakfast,
        friday_lunch
      FROM drivein_passes
      ORDER BY family_name
    `

    // Calculate total cost
    const totalCost = familyMembers.reduce((sum: number, member: any) => sum + (Number(member.person_cost) || 0), 0)

    // Build CSV rows
    const csvRows: string[] = []

    // Header with meal columns
    csvRows.push("LAST NAME,FIRST NAME,AGE,Mon D,Tue B,Tue L,Tue D,Wed B,Wed L,Wed D,Thu B,Thu L,Thu D,Fri B,Fri L,LODGING,COST")

    // Family members rows - group by reg_id to handle multiple families with same last name
    let currentRegId = -1
    familyMembers.forEach((member: any) => {
      const isNewFamily = member.reg_id !== currentRegId
      currentRegId = member.reg_id
      
      const lastName = isNewFamily ? member.family_last_name : ""
      const lodging = isNewFamily ? (member.lodging_type || "") : ""
      const age = member.age === null || member.age === undefined || member.age === "" || Number(member.age) >= 18 ? "adult" : member.age
      const fee = Number(member.person_cost || 0).toFixed(2)
      
      // Meal attendance (default to 1 if null/undefined for lodging guests)
      const monD = (member.monday_dinner ?? true) ? 1 : ""
      const tueB = (member.tuesday_breakfast ?? true) ? 1 : ""
      const tueL = (member.tuesday_lunch ?? true) ? 1 : ""
      const tueD = (member.tuesday_dinner ?? true) ? 1 : ""
      const wedB = (member.wednesday_breakfast ?? true) ? 1 : ""
      const wedL = (member.wednesday_lunch ?? true) ? 1 : ""
      const wedD = (member.wednesday_dinner ?? true) ? 1 : ""
      const thuB = (member.thursday_breakfast ?? true) ? 1 : ""
      const thuL = (member.thursday_lunch ?? true) ? 1 : ""
      const thuD = (member.thursday_dinner ?? true) ? 1 : ""
      const friB = (member.friday_breakfast ?? true) ? 1 : ""
      const friL = (member.friday_lunch ?? true) ? 1 : ""
      
      csvRows.push([
        `"${lastName}"`,
        `"${member.first_name || ""}"`,
        age,
        monD, tueB, tueL, tueD, wedB, wedL, wedD, thuB, thuL, thuD, friB, friL,
        `"${lodging}"`,
        `$${fee}`
      ].join(","))
    })

    // Total row for lodging
    csvRows.push("")
    csvRows.push(`"LODGING TOTAL",,,,,,,,,,,,,,,,"$${totalCost.toFixed(2)}"`)

    // Drive-in section
    if (driveInPasses.length > 0) {
      csvRows.push("")
      csvRows.push("")
      csvRows.push("DRIVE-IN PASSES (Meals Only)")
      csvRows.push("FAMILY,CONTACT,PEOPLE,Mon D,Tue B,Tue L,Tue D,Wed B,Wed L,Wed D,Thu B,Thu L,Thu D,Fri B,Fri L,,")

      driveInPasses.forEach((pass: any) => {
        const people = (Number(pass.num_adults) || 0) + (Number(pass.num_children) || 0)
        
        const monD = pass.monday_dinner ? people : ""
        const tueB = pass.tuesday_breakfast ? people : ""
        const tueL = pass.tuesday_lunch ? people : ""
        const tueD = pass.tuesday_dinner ? people : ""
        const wedB = pass.wednesday_breakfast ? people : ""
        const wedL = pass.wednesday_lunch ? people : ""
        const wedD = pass.wednesday_dinner ? people : ""
        const thuB = pass.thursday_breakfast ? people : ""
        const thuL = pass.thursday_lunch ? people : ""
        const thuD = pass.thursday_dinner ? people : ""
        const friB = pass.friday_breakfast ? people : ""
        const friL = pass.friday_lunch ? people : ""

        csvRows.push([
          `"${pass.family_name}"`,
          `"Drive-In"`,
          people,
          monD, tueB, tueL, tueD, wedB, wedL, wedD, thuB, thuL, thuD, friB, friL,
          `""`,
          `""`
        ].join(","))
      })
    }

    const csv = csvRows.join("\n")

    return new NextResponse(csv, {
      headers: {
        "Content-Type": "text/csv",
        "Content-Disposition": `attachment; filename="lwcc-breakdown-${new Date().toISOString().replace(/[:.]/g, "-")}.csv"`,
        "Cache-Control": "no-cache, no-store, must-revalidate",
        "Pragma": "no-cache",
        "Expires": "0",
      },
    })
  } catch (error) {
    console.error("Error exporting LWCC breakdown:", error)
    return NextResponse.json({ error: "Failed to export LWCC breakdown" }, { status: 500 })
  }
}
