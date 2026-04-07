import { NextResponse } from "next/server"
import { getDb } from "@/lib/db"

export async function GET() {
  try {
    const sql = getDb()

    // Get all registrations with family members
    const registrations = await sql`
      SELECT 
        r.*,
        json_agg(
          json_build_object(
            'first_name', fm.first_name,
            'last_name', fm.last_name,
            'age', fm.age,
            'date_of_birth', fm.date_of_birth,
            'is_baptized', fm.is_baptized,
            'person_cost', fm.person_cost
          )
        ) FILTER (WHERE fm.id IS NOT NULL) as family_members
      FROM registrations r
      LEFT JOIN family_members fm ON fm.registration_id = r.id
      GROUP BY r.id
      ORDER BY r.family_last_name
    `

    // Create CSV content
    const headers = [
      "Family Name",
      "Email",
      "Phone",
      "Address",
      "City",
      "State",
      "Zip",
      "Home Congregation",
      "Lodging Type",
      "Lodging Total",
      "Registration Fee",
      "Scholarship Donation",
      "T-Shirt Total",
      "Climbing Tower Total",
      "Expected Total",
      "Payment Status",
      "Times Attended",
      "Years Homeschooling",
      "Currently Homeschooling",
      "Father Occupation",
      "Emergency Contact",
      "Emergency Phone",
      "Emergency Relationship",
      "Father Signature",
      "Mother Signature",
      "Arrival Notes",
      "Payment Notes",
      "Family Members",
    ]

    const csvRows = [
      headers.join(","),
      ...registrations.map((reg: any) => {
        const expectedTotal =
          (Number(reg.registration_fee) || 0) +
          (Number(reg.lodging_total) || 0) +
          (Number(reg.scholarship_donation) || 0)

        const familyMembers = reg.family_members
          ? reg.family_members.map((m: any) => `${m.first_name} ${m.last_name} (${m.age})`).join("; ")
          : ""

        return [
          `"${reg.family_last_name || ""}"`,
          `"${reg.email || ""}"`,
          `"${reg.husband_phone || reg.wife_phone || ""}"`,
          `"${(reg.address || "").replace(/"/g, '""')}"`,
          `"${reg.city || ""}"`,
          `"${reg.state || ""}"`,
          `"${reg.zip || ""}"`,
          `"${reg.home_congregation || ""}"`,
          `"${reg.lodging_type || ""}"`,
          reg.lodging_total || 0,
          reg.registration_fee || 0,
          reg.scholarship_donation || 0,
          reg.tshirt_total || 0,
          reg.climbing_tower_total || 0,
          expectedTotal,
          `"${reg.payment_status || ""}"`,
          reg.times_attended || 0,
          reg.years_homeschooling || 0,
          reg.currently_homeschooling ? "Yes" : "No",
          `"${reg.father_occupation || ""}"`,
          `"${reg.emergency_contact_name || ""}"`,
          `"${reg.emergency_contact_phone || ""}"`,
          `"${reg.emergency_contact_relationship || ""}"`,
          `"${reg.father_signature || ""}"`,
          `"${reg.mother_signature || ""}"`,
          `"${(reg.arrival_notes || "").replace(/"/g, '""')}"`,
          `"${(reg.payment_notes || "").replace(/"/g, '""')}"`,
          `"${familyMembers}"`,
        ].join(",")
      }),
    ]

    const csv = csvRows.join("\n")

    return new NextResponse(csv, {
      headers: {
        "Content-Type": "text/csv",
        "Content-Disposition": `attachment; filename="full-registration-data-${new Date().toISOString().split("T")[0]}.csv"`,
      },
    })
  } catch (error) {
    console.error("Error exporting full registration:", error)
    return NextResponse.json({ error: "Failed to export registration data" }, { status: 500 })
  }
}
