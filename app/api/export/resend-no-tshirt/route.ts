import { NextResponse } from "next/server"
import { getDb } from "@/lib/db"

// Families who have NOT ordered any t-shirts
export async function GET() {
  try {
    const sql = getDb()

    const rows = await sql`
      SELECT
        r.email,
        r.family_last_name,
        r.home_congregation,
        r.husband_phone,
        r.wife_phone
      FROM registrations r
      WHERE r.email IS NOT NULL AND r.email <> ''
        AND NOT EXISTS (
          SELECT 1 FROM tshirt_orders t WHERE t.registration_id = r.id
        )
      ORDER BY r.family_last_name
    `

    const headers = ["email", "first_name", "last_name", "congregation"]

    const csvRows = [
      headers.join(","),
      ...rows.map((r: any) => [
        `"${(r.email || "").replace(/"/g, '""')}"`,
        `"The"`,
        `"${(r.family_last_name || "").replace(/"/g, '""')} Family"`,
        `"${(r.home_congregation || "").replace(/"/g, '""')}"`,
      ].join(",")),
    ]

    return new NextResponse(csvRows.join("\n"), {
      headers: {
        "Content-Type": "text/csv",
        "Content-Disposition": `attachment; filename="resend-no-tshirt-${new Date().toISOString().split("T")[0]}.csv"`,
      },
    })
  } catch (error: any) {
    console.error("Error exporting no-tshirt list:", error?.message ?? error)
    return NextResponse.json({ error: String(error?.message ?? "Failed to export") }, { status: 500 })
  }
}
