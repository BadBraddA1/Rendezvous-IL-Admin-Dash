import { NextResponse } from "next/server"
import { getDb } from "@/lib/db"

// Helper to categorize age
function getAgeGroup(age: number | string | null): string {
  if (age === null || age === undefined || age === "") return "adult"
  const numAge = typeof age === "string" ? parseInt(age, 10) : age
  if (isNaN(numAge) || numAge >= 18) return "adult"
  if (numAge >= 12) return "12-17"
  if (numAge >= 6) return "6-11"
  return "0-5"
}

// Helper to display age for spreadsheet
function displayAge(age: number | string | null): string {
  if (age === null || age === undefined || age === "") return "adult"
  const numAge = typeof age === "string" ? parseInt(age, 10) : age
  if (isNaN(numAge) || numAge >= 18) return "adult"
  return String(numAge)
}

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
        r.total_cost,
        fm.first_name,
        fm.last_name,
        fm.age,
        fm.person_cost
      FROM family_members fm
      JOIN registrations r ON fm.registration_id = r.id
      ORDER BY r.family_last_name, fm.age DESC NULLS FIRST, fm.first_name
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

    // Calculate meal counts by age group
    const mealCounts = {
      monday_dinner: { adult: 0, "12-17": 0, "6-11": 0, "0-5": 0, total: 0 },
      tuesday_breakfast: { adult: 0, "12-17": 0, "6-11": 0, "0-5": 0, total: 0 },
      tuesday_lunch: { adult: 0, "12-17": 0, "6-11": 0, "0-5": 0, total: 0 },
      tuesday_dinner: { adult: 0, "12-17": 0, "6-11": 0, "0-5": 0, total: 0 },
      wednesday_breakfast: { adult: 0, "12-17": 0, "6-11": 0, "0-5": 0, total: 0 },
      wednesday_lunch: { adult: 0, "12-17": 0, "6-11": 0, "0-5": 0, total: 0 },
      wednesday_dinner: { adult: 0, "12-17": 0, "6-11": 0, "0-5": 0, total: 0 },
      thursday_breakfast: { adult: 0, "12-17": 0, "6-11": 0, "0-5": 0, total: 0 },
      thursday_lunch: { adult: 0, "12-17": 0, "6-11": 0, "0-5": 0, total: 0 },
      thursday_dinner: { adult: 0, "12-17": 0, "6-11": 0, "0-5": 0, total: 0 },
      friday_breakfast: { adult: 0, "12-17": 0, "6-11": 0, "0-5": 0, total: 0 },
      friday_lunch: { adult: 0, "12-17": 0, "6-11": 0, "0-5": 0, total: 0 },
    }

    // All lodging family members get all meals (Mon dinner through Fri lunch)
    familyMembers.forEach((member: any) => {
      const ageGroup = getAgeGroup(member.age) as keyof typeof mealCounts.monday_dinner
      Object.keys(mealCounts).forEach((meal) => {
        mealCounts[meal as keyof typeof mealCounts][ageGroup]++
        mealCounts[meal as keyof typeof mealCounts].total++
      })
    })

    // Add drive-in pass meal counts (only for meals they selected)
    driveInPasses.forEach((pass: any) => {
      const adults = Number(pass.num_adults) || 0
      const children = Number(pass.num_children) || 0
      // Assume children are in 6-11 age group for drive-in passes
      
      if (pass.monday_dinner) {
        mealCounts.monday_dinner.adult += adults
        mealCounts.monday_dinner["6-11"] += children
        mealCounts.monday_dinner.total += adults + children
      }
      if (pass.tuesday_breakfast) {
        mealCounts.tuesday_breakfast.adult += adults
        mealCounts.tuesday_breakfast["6-11"] += children
        mealCounts.tuesday_breakfast.total += adults + children
      }
      if (pass.tuesday_lunch) {
        mealCounts.tuesday_lunch.adult += adults
        mealCounts.tuesday_lunch["6-11"] += children
        mealCounts.tuesday_lunch.total += adults + children
      }
      if (pass.tuesday_dinner) {
        mealCounts.tuesday_dinner.adult += adults
        mealCounts.tuesday_dinner["6-11"] += children
        mealCounts.tuesday_dinner.total += adults + children
      }
      if (pass.wednesday_breakfast) {
        mealCounts.wednesday_breakfast.adult += adults
        mealCounts.wednesday_breakfast["6-11"] += children
        mealCounts.wednesday_breakfast.total += adults + children
      }
      if (pass.wednesday_lunch) {
        mealCounts.wednesday_lunch.adult += adults
        mealCounts.wednesday_lunch["6-11"] += children
        mealCounts.wednesday_lunch.total += adults + children
      }
      if (pass.wednesday_dinner) {
        mealCounts.wednesday_dinner.adult += adults
        mealCounts.wednesday_dinner["6-11"] += children
        mealCounts.wednesday_dinner.total += adults + children
      }
      if (pass.thursday_breakfast) {
        mealCounts.thursday_breakfast.adult += adults
        mealCounts.thursday_breakfast["6-11"] += children
        mealCounts.thursday_breakfast.total += adults + children
      }
      if (pass.thursday_lunch) {
        mealCounts.thursday_lunch.adult += adults
        mealCounts.thursday_lunch["6-11"] += children
        mealCounts.thursday_lunch.total += adults + children
      }
      if (pass.thursday_dinner) {
        mealCounts.thursday_dinner.adult += adults
        mealCounts.thursday_dinner["6-11"] += children
        mealCounts.thursday_dinner.total += adults + children
      }
      if (pass.friday_breakfast) {
        mealCounts.friday_breakfast.adult += adults
        mealCounts.friday_breakfast["6-11"] += children
        mealCounts.friday_breakfast.total += adults + children
      }
      if (pass.friday_lunch) {
        mealCounts.friday_lunch.adult += adults
        mealCounts.friday_lunch["6-11"] += children
        mealCounts.friday_lunch.total += adults + children
      }
    })

    // Calculate total cost
    const totalCost = familyMembers.reduce((sum: number, member: any) => sum + (Number(member.person_cost) || 0), 0)

    // Build CSV rows
    const csvRows: string[] = []

    // Header section with meal counts
    csvRows.push(`,,,,"MEAL",${mealCounts.monday_dinner.total},${mealCounts.tuesday_breakfast.total},${mealCounts.tuesday_lunch.total},${mealCounts.tuesday_dinner.total},${mealCounts.wednesday_breakfast.total},${mealCounts.wednesday_lunch.total},${mealCounts.wednesday_dinner.total},${mealCounts.thursday_breakfast.total},${mealCounts.thursday_lunch.total},${mealCounts.thursday_dinner.total},${mealCounts.friday_breakfast.total},${mealCounts.friday_lunch.total},,,"$${totalCost.toFixed(2)}","AMOUNT OWED"`)
    csvRows.push(`,,,,"ADULTS:",${mealCounts.monday_dinner.adult},${mealCounts.tuesday_breakfast.adult},${mealCounts.tuesday_lunch.adult},${mealCounts.tuesday_dinner.adult},${mealCounts.wednesday_breakfast.adult},${mealCounts.wednesday_lunch.adult},${mealCounts.wednesday_dinner.adult},${mealCounts.thursday_breakfast.adult},${mealCounts.thursday_lunch.adult},${mealCounts.thursday_dinner.adult},${mealCounts.friday_breakfast.adult},${mealCounts.friday_lunch.adult}`)
    csvRows.push(`,,,,"12-17 YRS:",${mealCounts.monday_dinner["12-17"]},${mealCounts.tuesday_breakfast["12-17"]},${mealCounts.tuesday_lunch["12-17"]},${mealCounts.tuesday_dinner["12-17"]},${mealCounts.wednesday_breakfast["12-17"]},${mealCounts.wednesday_lunch["12-17"]},${mealCounts.wednesday_dinner["12-17"]},${mealCounts.thursday_breakfast["12-17"]},${mealCounts.thursday_lunch["12-17"]},${mealCounts.thursday_dinner["12-17"]},${mealCounts.friday_breakfast["12-17"]},${mealCounts.friday_lunch["12-17"]}`)
    csvRows.push(`,,,,"6-11 YRS:",${mealCounts.monday_dinner["6-11"]},${mealCounts.tuesday_breakfast["6-11"]},${mealCounts.tuesday_lunch["6-11"]},${mealCounts.tuesday_dinner["6-11"]},${mealCounts.wednesday_breakfast["6-11"]},${mealCounts.wednesday_lunch["6-11"]},${mealCounts.wednesday_dinner["6-11"]},${mealCounts.thursday_breakfast["6-11"]},${mealCounts.thursday_lunch["6-11"]},${mealCounts.thursday_dinner["6-11"]},${mealCounts.friday_breakfast["6-11"]},${mealCounts.friday_lunch["6-11"]}`)
    csvRows.push(`,,,,"0-5 YRS:",${mealCounts.monday_dinner["0-5"]},${mealCounts.tuesday_breakfast["0-5"]},${mealCounts.tuesday_lunch["0-5"]},${mealCounts.tuesday_dinner["0-5"]},${mealCounts.wednesday_breakfast["0-5"]},${mealCounts.wednesday_lunch["0-5"]},${mealCounts.wednesday_dinner["0-5"]},${mealCounts.thursday_breakfast["0-5"]},${mealCounts.thursday_lunch["0-5"]},${mealCounts.thursday_dinner["0-5"]},${mealCounts.friday_breakfast["0-5"]},${mealCounts.friday_lunch["0-5"]}`)

    // Column headers
    csvRows.push("#,LAST NAME,FIRST NAME,AGE,MON D,TUE B,TUE L,TUE D,WED B,WED L,WED D,THU B,THU L,THU D,FRI B,FRI L,NOTES,LODGING,TOTAL FEE (including RV / Tent fee)")

    // Track family for highlighting and grouping
    let currentFamily = ""
    let rowNum = 1

    // Family members rows - all lodging guests get all meals
    familyMembers.forEach((member: any) => {
      const isNewFamily = member.family_last_name !== currentFamily
      currentFamily = member.family_last_name
      
      const lastName = isNewFamily ? member.family_last_name : ""
      const notes = isNewFamily && member.arrival_notes ? member.arrival_notes.replace(/"/g, '""') : ""
      const lodging = member.lodging_type || ""
      const fee = Number(member.person_cost || 0).toFixed(2)
      
      csvRows.push([
        rowNum,
        `"${lastName}"`,
        `"${member.first_name || ""}"`,
        displayAge(member.age),
        1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, // All meals = 1
        `"${notes}"`,
        `"${lodging}"`,
        `$${fee}`
      ].join(","))
      
      rowNum++
    })

    // Add drive-in passes section if any exist
    if (driveInPasses.length > 0) {
      csvRows.push("")
      csvRows.push("DRIVE-IN PASSES (Meals Only - No Lodging)")
      csvRows.push("#,FAMILY NAME,CONTACT,ADULTS,CHILDREN,MON D,TUE B,TUE L,TUE D,WED B,WED L,WED D,THU B,THU L,THU D,FRI B,FRI L,NOTES")
      
      driveInPasses.forEach((pass: any, index: number) => {
        csvRows.push([
          index + 1,
          `"${pass.family_name || ""}"`,
          `"${pass.contact_name || ""}"`,
          pass.num_adults || 0,
          pass.num_children || 0,
          pass.monday_dinner ? 1 : "",
          pass.tuesday_breakfast ? 1 : "",
          pass.tuesday_lunch ? 1 : "",
          pass.tuesday_dinner ? 1 : "",
          pass.wednesday_breakfast ? 1 : "",
          pass.wednesday_lunch ? 1 : "",
          pass.wednesday_dinner ? 1 : "",
          pass.thursday_breakfast ? 1 : "",
          pass.thursday_lunch ? 1 : "",
          pass.thursday_dinner ? 1 : "",
          pass.friday_breakfast ? 1 : "",
          pass.friday_lunch ? 1 : "",
          `"Drive-In Pass"`
        ].join(","))
      })
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
