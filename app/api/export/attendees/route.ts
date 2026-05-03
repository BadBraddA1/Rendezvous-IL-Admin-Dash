import { NextResponse } from "next/server"
import { getDb } from "@/lib/db"

export async function GET() {
  try {
    const sql = getDb()

    // Get all registrations with family members and health info
    const registrations = await sql`
      SELECT 
        r.id,
        r.family_last_name,
        r.address,
        r.city,
        r.state,
        r.zip,
        r.husband_phone,
        r.wife_phone,
        r.email,
        r.times_attended,
        json_agg(
          json_build_object(
            'first_name', fm.first_name,
            'age', fm.age,
            'is_baptized', fm.is_baptized,
            'is_adult_override', fm.is_adult_override
          ) ORDER BY fm.age DESC NULLS LAST
        ) FILTER (WHERE fm.id IS NOT NULL) as family_members
      FROM registrations r
      LEFT JOIN family_members fm ON fm.registration_id = r.id
      GROUP BY r.id
      ORDER BY r.family_last_name
    `

    // Get health info (dietary restrictions/allergies) grouped by registration
    const healthInfo = await sql`
      SELECT 
        registration_id,
        full_name,
        dietary_restrictions,
        food_allergies
      FROM health_info
      WHERE dietary_restrictions IS NOT NULL 
         OR food_allergies IS NOT NULL
    `

    // Build a map of registration_id -> allergies/dietary info
    const healthMap: Record<number, string[]> = {}
    for (const hi of healthInfo) {
      if (!healthMap[hi.registration_id]) {
        healthMap[hi.registration_id] = []
      }
      const parts: string[] = []
      if (hi.dietary_restrictions) {
        parts.push(`${hi.full_name} = ${hi.dietary_restrictions}`)
      }
      if (hi.food_allergies) {
        parts.push(`${hi.full_name} allergic to ${hi.food_allergies}`)
      }
      if (parts.length > 0) {
        healthMap[hi.registration_id].push(parts.join("; "))
      }
    }

    // Create CSV content matching the spreadsheet format
    const headers = [
      "#",
      "LAST NAME",
      "PARENTS",
      "CHILDREN",
      "ADDRESS",
      "CITY",
      "ST",
      "ZIP",
      "PHONES",
      "EMAIL",
      "FOOD ALLERGIES?",
    ]

    let rowNum = 1
    const csvRows = [
      `RENDEZVOUS 2026 ATTENDEES,,,,,,,,,,`,
      headers.join(","),
      ...registrations.map((reg: any) => {
        const members = reg.family_members || []
        
        // Separate adults (age >= 18 or no age) from children
        const adults: string[] = []
        const children: string[] = []
        
        for (const m of members) {
          const name = m.first_name || ""
          const age = m.age
          const override = m.is_adult_override

          // Manual override wins over age-based default.
          const isAdult =
            override !== null && override !== undefined
              ? override
              : age === null || age === undefined || age >= 18

          if (isAdult) {
            // Adult - just name
            adults.push(name)
          } else {
            // Child - name with age (if known)
            children.push(age != null ? `${name} (${age})` : name)
          }
        }

        // Format parents as "Name1 & Name2" or "Name1\n& Name2" for multiple lines
        const parentsStr = adults.length > 1 
          ? `${adults[0]}\n& ${adults.slice(1).join(", ")}`
          : adults[0] || ""

        // Format children as comma-separated list with ages
        const childrenStr = children.join(", ")

        // Format phones - combine husband and wife phones
        const phones: string[] = []
        if (reg.husband_phone) phones.push(reg.husband_phone)
        if (reg.wife_phone && reg.wife_phone !== reg.husband_phone) phones.push(reg.wife_phone)
        const phonesStr = phones.join("\n")

        // Get food allergies/dietary restrictions for this registration
        const allergies = healthMap[reg.id] ? healthMap[reg.id].join("; ") : ""

        // Mark first-timers with asterisk
        const lastName = reg.times_attended === 1 ? `${reg.family_last_name}*` : reg.family_last_name

        const row = [
          rowNum++,
          `"${(lastName || "").replace(/"/g, '""')}"`,
          `"${parentsStr.replace(/"/g, '""')}"`,
          `"${childrenStr.replace(/"/g, '""')}"`,
          `"${(reg.address || "").replace(/"/g, '""')}"`,
          `"${(reg.city || "").replace(/"/g, '""')}"`,
          `"${(reg.state || "").replace(/"/g, '""')}"`,
          `"${(reg.zip || "").replace(/"/g, '""')}"`,
          `"${phonesStr.replace(/"/g, '""')}"`,
          `"${(reg.email || "").replace(/"/g, '""')}"`,
          `"${allergies.replace(/"/g, '""')}"`,
        ]
        
        return row.join(",")
      }),
    ]

    const csv = csvRows.join("\n")

    return new NextResponse(csv, {
      headers: {
        "Content-Type": "text/csv; charset=utf-8",
        "Content-Disposition": `attachment; filename="rendezvous-2026-attendees-${new Date().toISOString().split("T")[0]}.csv"`,
      },
    })
  } catch (error) {
    console.error("Error exporting attendees:", error)
    return NextResponse.json({ error: "Failed to export attendees" }, { status: 500 })
  }
}
