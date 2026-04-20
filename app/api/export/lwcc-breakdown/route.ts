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
        thursday_lunch,
        thursday_dinner,
        friday_breakfast,
        friday_lunch,
        friday_dinner,
        saturday_breakfast,
        saturday_lunch,
        saturday_dinner,
        sunday_breakfast,
        sunday_lunch
      FROM drivein_passes
      ORDER BY family_name
    `

    // Calculate totals for lodging
    const totalLodgingCost = familyMembers.reduce((sum: number, member: any) => sum + (Number(member.person_cost) || 0), 0)

    // Build meal summary for drive-in passes
    const getMealsList = (pass: any) => {
      const meals: string[] = []
      if (pass.thursday_lunch) meals.push("Thu Lunch")
      if (pass.thursday_dinner) meals.push("Thu Dinner")
      if (pass.friday_breakfast) meals.push("Fri Breakfast")
      if (pass.friday_lunch) meals.push("Fri Lunch")
      if (pass.friday_dinner) meals.push("Fri Dinner")
      if (pass.saturday_breakfast) meals.push("Sat Breakfast")
      if (pass.saturday_lunch) meals.push("Sat Lunch")
      if (pass.saturday_dinner) meals.push("Sat Dinner")
      if (pass.sunday_breakfast) meals.push("Sun Breakfast")
      if (pass.sunday_lunch) meals.push("Sun Lunch")
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
        thursday_lunch: 0,
        thursday_dinner: 0,
        friday_breakfast: 0,
        friday_lunch: 0,
        friday_dinner: 0,
        saturday_breakfast: 0,
        saturday_lunch: 0,
        saturday_dinner: 0,
        sunday_breakfast: 0,
        sunday_lunch: 0,
      }

      driveInPasses.forEach((pass: any) => {
        const people = (Number(pass.num_adults) || 0) + (Number(pass.num_children) || 0)
        if (pass.thursday_lunch) mealCounts.thursday_lunch += people
        if (pass.thursday_dinner) mealCounts.thursday_dinner += people
        if (pass.friday_breakfast) mealCounts.friday_breakfast += people
        if (pass.friday_lunch) mealCounts.friday_lunch += people
        if (pass.friday_dinner) mealCounts.friday_dinner += people
        if (pass.saturday_breakfast) mealCounts.saturday_breakfast += people
        if (pass.saturday_lunch) mealCounts.saturday_lunch += people
        if (pass.saturday_dinner) mealCounts.saturday_dinner += people
        if (pass.sunday_breakfast) mealCounts.sunday_breakfast += people
        if (pass.sunday_lunch) mealCounts.sunday_lunch += people
      })

      csvRows.push("")
      csvRows.push("DRIVE-IN MEAL COUNTS (Additional people for meals)")
      csvRows.push(`"Thursday Lunch",${mealCounts.thursday_lunch}`)
      csvRows.push(`"Thursday Dinner",${mealCounts.thursday_dinner}`)
      csvRows.push(`"Friday Breakfast",${mealCounts.friday_breakfast}`)
      csvRows.push(`"Friday Lunch",${mealCounts.friday_lunch}`)
      csvRows.push(`"Friday Dinner",${mealCounts.friday_dinner}`)
      csvRows.push(`"Saturday Breakfast",${mealCounts.saturday_breakfast}`)
      csvRows.push(`"Saturday Lunch",${mealCounts.saturday_lunch}`)
      csvRows.push(`"Saturday Dinner",${mealCounts.saturday_dinner}`)
      csvRows.push(`"Sunday Breakfast",${mealCounts.sunday_breakfast}`)
      csvRows.push(`"Sunday Lunch",${mealCounts.sunday_lunch}`)
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
