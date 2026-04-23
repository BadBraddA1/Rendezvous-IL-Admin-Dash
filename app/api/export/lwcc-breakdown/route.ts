import { NextResponse } from "next/server"
import { getDb } from "@/lib/db"

export async function GET() {
  try {
    const sql = getDb()

    // Get all family members with their costs (lodging registrations)
    const familyMembers = await sql`
      SELECT 
        r.id as reg_id,
        r.checkin_qr_code,
        r.family_last_name,
        fm.first_name,
        fm.last_name,
        fm.age,
        fm.person_cost,
        r.lodging_type,
        'Lodging' as registration_type
      FROM family_members fm
      JOIN registrations r ON fm.registration_id = r.id
      ORDER BY r.family_last_name, fm.first_name
    `

    // Get drive-in pass families
    const driveInPasses = await sql`
      SELECT 
        id,
        family_name,
        contact_name,
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

    // Calculate totals for lodging
    const totalLodgingCost = familyMembers.reduce((sum: number, member: any) => sum + (Number(member.person_cost) || 0), 0)

    // Build meal summary for drive-in passes
    const getMealsList = (pass: any) => {
      const meals: string[] = []
      if (pass.monday_dinner) meals.push("Mon Dinner")
      if (pass.tuesday_breakfast) meals.push("Tue Breakfast")
      if (pass.tuesday_lunch) meals.push("Tue Lunch")
      if (pass.tuesday_dinner) meals.push("Tue Dinner")
      if (pass.wednesday_breakfast) meals.push("Wed Breakfast")
      if (pass.wednesday_lunch) meals.push("Wed Lunch")
      if (pass.wednesday_dinner) meals.push("Wed Dinner")
      if (pass.thursday_breakfast) meals.push("Thu Breakfast")
      if (pass.thursday_lunch) meals.push("Thu Lunch")
      if (pass.thursday_dinner) meals.push("Thu Dinner")
      if (pass.friday_breakfast) meals.push("Fri Breakfast")
      if (pass.friday_lunch) meals.push("Fri Lunch")
      return meals.join("; ")
    }

    // Create CSV content
    const headers = ["Reg ID", "QR Code", "Family Name", "First Name", "Last Name", "Age", "Cost Per Person", "Lodging Type", "Type"]

    const csvRows = [
      headers.join(","),
      // Lodging registrations
      ...familyMembers.map((member: any) =>
        [
          member.reg_id || "",
          `"${member.checkin_qr_code || ""}"`,
          `"${member.family_last_name || ""}"`,
          `"${member.first_name || ""}"`,
          `"${member.last_name || ""}"`,
          member.age || "",
          Number(member.person_cost || 0).toFixed(2),
          `"${member.lodging_type || ""}"`,
          `"${member.registration_type || ""}"`,
        ].join(","),
      ),
      "",
      `"TOTAL LODGING COST",,,,,,${totalLodgingCost.toFixed(2)},,`,
    ]

    // Add Drive-In section if there are any
    if (driveInPasses.length > 0) {
      csvRows.push("")
      csvRows.push("")
      csvRows.push("DRIVE-IN PASSES (Meals Only - No Lodging)")
      csvRows.push(["ID", "Family Name", "Contact", "Adults", "Children", "Total People", "Meals"].join(","))
      
      driveInPasses.forEach((pass: any) => {
        const totalPeople = (Number(pass.num_adults) || 0) + (Number(pass.num_children) || 0)
        csvRows.push([
          pass.id,
          `"${pass.family_name || ""}"`,
          `"${pass.contact_name || ""}"`,
          pass.num_adults || 0,
          pass.num_children || 0,
          totalPeople,
          `"${getMealsList(pass)}"`,
        ].join(","))
      })

      // Meal counts summary
      const mealCounts = {
        monday_dinner: 0,
        tuesday_breakfast: 0,
        tuesday_lunch: 0,
        tuesday_dinner: 0,
        wednesday_breakfast: 0,
        wednesday_lunch: 0,
        wednesday_dinner: 0,
        thursday_breakfast: 0,
        thursday_lunch: 0,
        thursday_dinner: 0,
        friday_breakfast: 0,
        friday_lunch: 0,
      }

      driveInPasses.forEach((pass: any) => {
        const people = (Number(pass.num_adults) || 0) + (Number(pass.num_children) || 0)
        if (pass.monday_dinner) mealCounts.monday_dinner += people
        if (pass.tuesday_breakfast) mealCounts.tuesday_breakfast += people
        if (pass.tuesday_lunch) mealCounts.tuesday_lunch += people
        if (pass.tuesday_dinner) mealCounts.tuesday_dinner += people
        if (pass.wednesday_breakfast) mealCounts.wednesday_breakfast += people
        if (pass.wednesday_lunch) mealCounts.wednesday_lunch += people
        if (pass.wednesday_dinner) mealCounts.wednesday_dinner += people
        if (pass.thursday_breakfast) mealCounts.thursday_breakfast += people
        if (pass.thursday_lunch) mealCounts.thursday_lunch += people
        if (pass.thursday_dinner) mealCounts.thursday_dinner += people
        if (pass.friday_breakfast) mealCounts.friday_breakfast += people
        if (pass.friday_lunch) mealCounts.friday_lunch += people
      })

      csvRows.push("")
      csvRows.push("DRIVE-IN MEAL COUNTS (Additional people for meals)")
      csvRows.push(`"Monday Dinner",${mealCounts.monday_dinner}`)
      csvRows.push(`"Tuesday Breakfast",${mealCounts.tuesday_breakfast}`)
      csvRows.push(`"Tuesday Lunch",${mealCounts.tuesday_lunch}`)
      csvRows.push(`"Tuesday Dinner",${mealCounts.tuesday_dinner}`)
      csvRows.push(`"Wednesday Breakfast",${mealCounts.wednesday_breakfast}`)
      csvRows.push(`"Wednesday Lunch",${mealCounts.wednesday_lunch}`)
      csvRows.push(`"Wednesday Dinner",${mealCounts.wednesday_dinner}`)
      csvRows.push(`"Thursday Breakfast",${mealCounts.thursday_breakfast}`)
      csvRows.push(`"Thursday Lunch",${mealCounts.thursday_lunch}`)
      csvRows.push(`"Thursday Dinner",${mealCounts.thursday_dinner}`)
      csvRows.push(`"Friday Breakfast",${mealCounts.friday_breakfast}`)
      csvRows.push(`"Friday Lunch",${mealCounts.friday_lunch}`)
    }

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
