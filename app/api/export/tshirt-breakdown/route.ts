import { NextResponse } from "next/server"
import { getDb } from "@/lib/db"

const SIZE_LABELS: Record<string, string> = {
  "4T": "4T", "5T": "5T",
  yXS: "Youth XS", yS: "Youth S", yM: "Youth M", yL: "Youth L", yXL: "Youth XL",
  aS: "Adult S", aM: "Adult M", aL: "Adult L", aXL: "Adult XL", a2XL: "Adult 2XL", a3XL: "Adult 3XL",
  wS: "Women S", wM: "Women M", wL: "Women L", wXL: "Women XL", w2XL: "Women 2XL", w3XL: "Women 3XL",
}

function sizeLabel(s: string) {
  return SIZE_LABELS[s] ?? s
}

export async function GET() {
  try {
    const sql = getDb()

    // One row per t-shirt order line item — we group in JS for the size breakdown
    const rows = await sql`
      SELECT
        r.family_last_name,
        r.home_congregation,
        r.email,
        t.size,
        t.color,
        SUM(t.quantity)::int   AS qty,
        t.price
      FROM registrations r
      INNER JOIN tshirt_orders t ON t.registration_id = r.id
      GROUP BY r.family_last_name, r.home_congregation, r.email, t.size, t.color, t.price
      ORDER BY r.family_last_name, t.size
    `

    // Group by family
    type FamilyRow = {
      family_last_name: string
      home_congregation: string
      email: string
      total_qty: number
      total_cost: number
      sizes: string[]
    }

    const families = new Map<string, FamilyRow>()

    for (const row of rows as any[]) {
      const key = row.email || row.family_last_name
      if (!families.has(key)) {
        families.set(key, {
          family_last_name: row.family_last_name || "",
          home_congregation: row.home_congregation || "",
          email: row.email || "",
          total_qty: 0,
          total_cost: 0,
          sizes: [],
        })
      }
      const fam = families.get(key)!
      const qty = Number(row.qty)
      fam.total_qty += qty
      fam.total_cost += qty * Number(row.price)
      const label = `${sizeLabel(row.size)}${row.color ? ` (${row.color})` : ""} x${qty}`
      fam.sizes.push(label)
    }

    const headers = ["family_last_name", "congregation", "email", "total_shirts", "total_cost", "size_breakdown"]

    const csvRows = [
      headers.join(","),
      ...[...families.values()].map((f) => [
        `"${f.family_last_name.replace(/"/g, '""')}"`,
        `"${f.home_congregation.replace(/"/g, '""')}"`,
        `"${f.email.replace(/"/g, '""')}"`,
        f.total_qty,
        `"$${f.total_cost.toFixed(2)}"`,
        `"${f.sizes.join(", ").replace(/"/g, '""')}"`,
      ].join(",")),
    ]

    return new NextResponse(csvRows.join("\n"), {
      headers: {
        "Content-Type": "text/csv",
        "Content-Disposition": `attachment; filename="tshirt-breakdown-${new Date().toISOString().split("T")[0]}.csv"`,
      },
    })
  } catch (error: any) {
    console.error("Error exporting t-shirt breakdown:", error?.message ?? error)
    return NextResponse.json({ error: String(error?.message ?? "Failed to export") }, { status: 500 })
  }
}
