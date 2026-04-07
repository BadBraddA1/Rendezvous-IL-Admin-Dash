import { NextResponse } from "next/server"
import { getDb } from "@/lib/db"

// Families who HAVE ordered at least one t-shirt
export async function GET() {
  try {
    const sql = getDb()

    const rows = await sql`
      SELECT
        r.email,
        r.family_last_name,
        r.home_congregation,
        COALESCE(SUM(t.quantity), 0) AS tshirt_count,
        COALESCE(SUM(t.price * t.quantity), 0) AS tshirt_total
      FROM registrations r
      INNER JOIN tshirt_orders t ON t.registration_id = r.id
      WHERE r.email IS NOT NULL AND r.email <> ''
      GROUP BY r.id, r.email, r.family_last_name, r.home_congregation
      ORDER BY r.family_last_name
    `

    const headers = ["email", "first_name", "last_name", "congregation", "tshirt_count", "tshirt_total"]

    const csvRows = [
      headers.join(","),
      ...rows.map((r: any) => [
        `"${(r.email || "").replace(/"/g, '""')}"`,
        `"The"`,
        `"${(r.family_last_name || "").replace(/"/g, '""')} Family"`,
        `"${(r.home_congregation || "").replace(/"/g, '""')}"`,
        r.tshirt_count || 0,
        `"$${Number(r.tshirt_total || 0).toFixed(2)}"`,
      ].join(",")),
    ]

    return new NextResponse(csvRows.join("\n"), {
      headers: {
        "Content-Type": "text/csv",
        "Content-Disposition": `attachment; filename="resend-tshirt-ordered-${new Date().toISOString().split("T")[0]}.csv"`,
      },
    })
  } catch (error: any) {
    console.error("Error exporting t-shirt ordered list:", error?.message ?? error)
    return NextResponse.json({ error: String(error?.message ?? "Failed to export") }, { status: 500 })
  }
}
