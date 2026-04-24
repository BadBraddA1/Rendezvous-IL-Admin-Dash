import { neon } from "@neondatabase/serverless"
import { NextResponse } from "next/server"

export async function POST(request: Request) {
  try {
    const sql = neon(process.env.DATABASE_URL!)
    const body = await request.json()
    const { registrationId, expectedRegFee, expectedLodgingTotal, memberUpdates } = body

    // Update the registration with new totals
    await sql`
      UPDATE registrations 
      SET 
        registration_fee = ${expectedRegFee},
        lodging_total = ${expectedLodgingTotal},
        updated_at = NOW()
      WHERE id = ${registrationId}
    `

    // Update each family member's person_cost
    for (const member of memberUpdates) {
      await sql`
        UPDATE family_members 
        SET person_cost = ${member.expected_cost}
        WHERE id = ${member.id}
      `
    }

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error("Error applying rates:", error)
    return NextResponse.json({ error: "Failed to apply rates" }, { status: 500 })
  }
}

// Apply rates to all registrations
export async function PUT() {
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

    // Get all registrations with family members
    const registrations = await sql`
      SELECT 
        r.id,
        r.lodging_type,
        r.created_at,
        COALESCE(
          (SELECT json_agg(json_build_object('id', fm.id, 'age', fm.age))
          FROM family_members fm WHERE fm.registration_id = r.id),
          '[]'
        ) as family_members
      FROM registrations r
    `

    let updatedCount = 0

    for (const reg of registrations) {
      const regDate = new Date(reg.created_at)
      const isLateReg = regDate > lateRegDate
      const lodgingType = (reg.lodging_type || "").toLowerCase()
      
      // Calculate expected registration fee
      const expectedRegFee = isLateReg 
        ? (rateMap["late_reg_fee"] || 50)
        : (rateMap["reg_fee"] || 25)

      let expectedLodgingTotal = 0
      const members = reg.family_members || []

      for (const member of members) {
        const age = member.age || 0
        let expectedCost = 0

        if (lodgingType.includes("commut")) {
          expectedCost = 0
        } else if (age <= 5) {
          expectedCost = rateMap["child_0_5"] || 0
        } else if (age <= 11) {
          if (lodgingType.includes("motel")) {
            expectedCost = rateMap["child_6_11_motel"] || 81
          } else if (lodgingType.includes("rv")) {
            expectedCost = rateMap["child_6_11_rv"] || 81
          } else {
            expectedCost = rateMap["child_6_11_tent"] || 81
          }
        } else if (age <= 17) {
          if (lodgingType.includes("motel")) {
            expectedCost = rateMap["teen_12_17_motel"] || 163
          } else if (lodgingType.includes("rv")) {
            expectedCost = rateMap["teen_12_17_rv"] || 163
          } else {
            expectedCost = rateMap["teen_12_17_tent"] || 163
          }
        } else {
          if (lodgingType.includes("motel")) {
            expectedCost = rateMap["adult_motel"] || 163
          } else if (lodgingType.includes("rv")) {
            expectedCost = rateMap["adult_rv"] || 163
          } else {
            expectedCost = rateMap["adult_tent"] || 163
          }
        }

        expectedLodgingTotal += expectedCost

        // Update family member cost
        await sql`
          UPDATE family_members 
          SET person_cost = ${expectedCost}
          WHERE id = ${member.id}
        `
      }

      // Update registration
      await sql`
        UPDATE registrations 
        SET 
          registration_fee = ${expectedRegFee},
          lodging_total = ${expectedLodgingTotal},
          updated_at = NOW()
        WHERE id = ${reg.id}
      `

      updatedCount++
    }

    return NextResponse.json({ success: true, updated: updatedCount })
  } catch (error) {
    console.error("Error applying all rates:", error)
    return NextResponse.json({ error: "Failed to apply rates" }, { status: 500 })
  }
}
