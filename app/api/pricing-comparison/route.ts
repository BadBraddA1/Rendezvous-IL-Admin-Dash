import { neon } from "@neondatabase/serverless"
import { NextResponse } from "next/server"

export async function GET() {
  try {
    const sql = neon(process.env.DATABASE_URL!)

    // Get all rate chart values
    const rates = await sql`SELECT rate_key, rate_value FROM rate_chart`
    const rateMap: Record<string, number> = {}
    rates.forEach((r: any) => {
      rateMap[r.rate_key] = Number(r.rate_value)
    })

    // Get late reg date
    const lateRegDate = rateMap["late_reg_date"] 
      ? new Date(
          String(rateMap["late_reg_date"]).slice(0, 4) + "-" +
          String(rateMap["late_reg_date"]).slice(4, 6) + "-" +
          String(rateMap["late_reg_date"]).slice(6, 8)
        )
      : new Date("2026-04-20")

    // Get all registrations with their family members
    const registrations = await sql`
      SELECT 
        r.id,
        r.family_last_name,
        r.lodging_type,
        r.registration_fee,
        r.lodging_total,
        r.tshirt_total,
        r.climbing_tower_total,
        r.scholarship_donation,
        r.created_at,
        COALESCE(
          (SELECT json_agg(json_build_object(
            'id', fm.id,
            'first_name', fm.first_name,
            'age', fm.age,
            'person_cost', fm.person_cost
          ) ORDER BY fm.age DESC NULLS FIRST)
          FROM family_members fm WHERE fm.registration_id = r.id),
          '[]'
        ) as family_members
      FROM registrations r
      ORDER BY r.family_last_name, r.id
    `

    // Calculate expected totals for each registration
    const comparisons = registrations.map((reg: any) => {
      const regDate = new Date(reg.created_at)
      const isLateReg = regDate > lateRegDate
      
      // Expected registration fee
      const expectedRegFee = isLateReg 
        ? (rateMap["late_reg_fee"] || 50)
        : (rateMap["reg_fee"] || 25)

      // Calculate expected lodging total based on family members
      const lodgingType = (reg.lodging_type || "").toLowerCase()
      let expectedLodgingTotal = 0

      const members = reg.family_members || []
      members.forEach((member: any) => {
        const age = member.age || 0
        let memberCost = 0

        if (lodgingType.includes("commut")) {
          // Commuting - free
          memberCost = 0
        } else if (age <= 5) {
          // 0-5 free
          memberCost = rateMap["child_0_5"] || 0
        } else if (age <= 11) {
          // 6-11
          if (lodgingType.includes("motel")) {
            memberCost = rateMap["child_6_11_motel"] || 81
          } else if (lodgingType.includes("rv")) {
            memberCost = rateMap["child_6_11_rv"] || 81
          } else {
            memberCost = rateMap["child_6_11_tent"] || 81
          }
        } else if (age <= 17) {
          // 12-17
          if (lodgingType.includes("motel")) {
            memberCost = rateMap["teen_12_17_motel"] || 163
          } else if (lodgingType.includes("rv")) {
            memberCost = rateMap["teen_12_17_rv"] || 163
          } else {
            memberCost = rateMap["teen_12_17_tent"] || 163
          }
        } else {
          // 18+ adult
          if (lodgingType.includes("motel")) {
            memberCost = rateMap["adult_motel"] || 163
          } else if (lodgingType.includes("rv")) {
            memberCost = rateMap["adult_rv"] || 163
          } else {
            memberCost = rateMap["adult_tent"] || 163
          }
        }

        expectedLodgingTotal += memberCost
      })

      // Old totals from database
      const oldRegFee = Number(reg.registration_fee) || 0
      const oldLodgingTotal = Number(reg.lodging_total) || 0
      const tshirtTotal = Number(reg.tshirt_total) || 0
      const climbingTotal = Number(reg.climbing_tower_total) || 0
      const donation = Number(reg.scholarship_donation) || 0

      const oldTotal = oldRegFee + oldLodgingTotal + tshirtTotal + climbingTotal + donation
      const expectedTotal = expectedRegFee + expectedLodgingTotal + tshirtTotal + climbingTotal + donation

      const difference = expectedTotal - oldTotal

      return {
        id: reg.id,
        family_last_name: reg.family_last_name,
        lodging_type: reg.lodging_type,
        member_count: members.length,
        is_late_reg: isLateReg,
        old_reg_fee: oldRegFee,
        expected_reg_fee: expectedRegFee,
        old_lodging_total: oldLodgingTotal,
        expected_lodging_total: expectedLodgingTotal,
        tshirt_total: tshirtTotal,
        climbing_total: climbingTotal,
        donation: donation,
        old_total: oldTotal,
        expected_total: expectedTotal,
        difference: difference,
        family_members: members
      }
    })

    return NextResponse.json(comparisons)
  } catch (error) {
    console.error("Error calculating pricing comparison:", error)
    return NextResponse.json({ error: "Failed to calculate pricing" }, { status: 500 })
  }
}
