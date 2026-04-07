import { NextResponse } from "next/server"
import { getDb } from "@/lib/db"

export async function GET() {
  try {
    const sql = getDb()

    // Get all registrations with contact info
    const registrations = await sql`
      SELECT 
        r.family_last_name,
        r.address,
        r.city,
        r.state,
        r.zip,
        r.husband_phone,
        r.wife_phone,
        r.email,
        r.home_congregation,
        COUNT(fm.id) as family_count
      FROM registrations r
      LEFT JOIN family_members fm ON fm.registration_id = r.id
      GROUP BY r.id
      ORDER BY r.family_last_name
    `

    // Create CSV content
    const headers = ["Family Name", "Address", "City", "State", "Zip", "Phone", "Email", "Congregation", "Family Count"]

    const csvRows = [
      headers.join(","),
      ...registrations.map((reg: any) =>
        [
          `"${reg.family_last_name || ""}"`,
          `"${(reg.address || "").replace(/"/g, '""')}"`,
          `"${reg.city || ""}"`,
          `"${reg.state || ""}"`,
          `"${reg.zip || ""}"`,
          `"${reg.husband_phone || reg.wife_phone || ""}"`,
          `"${reg.email || ""}"`,
          `"${reg.home_congregation || ""}"`,
          reg.family_count || 0,
        ].join(","),
      ),
    ]

    const csv = csvRows.join("\n")

    return new NextResponse(csv, {
      headers: {
        "Content-Type": "text/csv",
        "Content-Disposition": `attachment; filename="contact-info-${new Date().toISOString().split("T")[0]}.csv"`,
      },
    })
  } catch (error) {
    console.error("Error exporting contact info:", error)
    return NextResponse.json({ error: "Failed to export contact info" }, { status: 500 })
  }
}
