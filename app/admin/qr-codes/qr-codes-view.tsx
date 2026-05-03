"use client"

import { useMemo, useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { PrinterIcon, SearchIcon, ListIcon, GridIcon } from "lucide-react"

interface QrRow {
  id: number
  family_last_name: string
  email: string
  checkin_qr_code: string
  family_member_count: number
}

function qrImageUrl(code: string, size = 220) {
  return `https://api.qrserver.com/v1/create-qr-code/?size=${size}x${size}&margin=4&data=${encodeURIComponent(code)}`
}

export function QrCodesView({ rows }: { rows: QrRow[] }) {
  const [search, setSearch] = useState("")
  const [layout, setLayout] = useState<"cards" | "list">("cards")

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase()
    if (!q) return rows
    return rows.filter(
      (r) =>
        r.family_last_name?.toLowerCase().includes(q) ||
        r.email?.toLowerCase().includes(q) ||
        r.checkin_qr_code?.toLowerCase().includes(q),
    )
  }, [rows, search])

  return (
    <>
      <style jsx global>{`
        @media print {
          @page {
            size: letter;
            margin: 0.4in;
          }
          html,
          body {
            background: white !important;
          }
          .no-print {
            display: none !important;
          }
          .print-grid {
            display: grid !important;
            grid-template-columns: repeat(2, 1fr) !important;
            gap: 0.25in !important;
          }
          .print-card {
            break-inside: avoid;
            page-break-inside: avoid;
            border: 1px solid #d1d5db !important;
            box-shadow: none !important;
            background: white !important;
          }
          .print-list-row {
            break-inside: avoid;
            page-break-inside: avoid;
          }
        }
      `}</style>

      <div className="no-print flex items-center justify-end gap-2 flex-wrap">
        <Button
          variant={layout === "cards" ? "default" : "outline"}
          size="sm"
          onClick={() => setLayout("cards")}
        >
          <GridIcon className="mr-2 size-4" />
          Cards
        </Button>
        <Button
          variant={layout === "list" ? "default" : "outline"}
          size="sm"
          onClick={() => setLayout("list")}
        >
          <ListIcon className="mr-2 size-4" />
          List
        </Button>
        <Button onClick={() => window.print()} size="sm">
          <PrinterIcon className="mr-2 size-4" />
          Print
        </Button>
      </div>

      <Card className="no-print">
        <CardHeader className="pb-3">
          <CardTitle className="text-base">Filter</CardTitle>
          <CardDescription>
            {filtered.length} of {rows.length} families
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="relative">
            <SearchIcon className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-muted-foreground" />
            <Input
              placeholder="Search by family name, email, or code..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-9"
            />
          </div>
        </CardContent>
      </Card>

      {filtered.length === 0 && (
        <Card className="no-print">
          <CardContent className="py-16 text-center text-muted-foreground">
            {rows.length === 0 ? "No registrations with QR codes found." : "No matches for your search."}
          </CardContent>
        </Card>
      )}

      {filtered.length > 0 && layout === "cards" && (
        <div className="print-grid grid gap-4 grid-cols-1 sm:grid-cols-2 lg:grid-cols-3">
          {filtered.map((r) => (
            <div
              key={r.id}
              className="print-card rounded-lg border bg-background p-4 flex flex-col items-center text-center"
            >
              <div className="font-bold text-base leading-tight">{r.family_last_name} Family</div>
              <div className="text-xs text-muted-foreground mt-0.5 break-all">{r.email}</div>
              <div className="text-[11px] text-muted-foreground mt-0.5">
                {r.family_member_count} {r.family_member_count === 1 ? "member" : "members"}
              </div>

              <div className="my-3">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={qrImageUrl(r.checkin_qr_code, 220)}
                  alt={`QR code for ${r.family_last_name}`}
                  width={180}
                  height={180}
                  className="size-[180px]"
                />
              </div>

              <div className="font-mono text-lg tracking-widest font-semibold">{r.checkin_qr_code}</div>
              <div className="text-[10px] uppercase tracking-wider text-muted-foreground mt-1">
                Check-In Code
              </div>
            </div>
          ))}
        </div>
      )}

      {filtered.length > 0 && layout === "list" && (
        <Card>
          <CardContent className="p-0">
            <div className="divide-y">
              {filtered.map((r) => (
                <div key={r.id} className="print-list-row flex items-center gap-4 p-3">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={qrImageUrl(r.checkin_qr_code, 120)}
                    alt={`QR code for ${r.family_last_name}`}
                    width={72}
                    height={72}
                    className="size-[72px] shrink-0"
                  />
                  <div className="flex-1 min-w-0">
                    <div className="font-semibold truncate">{r.family_last_name} Family</div>
                    <div className="text-xs text-muted-foreground truncate">{r.email}</div>
                    <div className="text-[11px] text-muted-foreground">
                      {r.family_member_count} {r.family_member_count === 1 ? "member" : "members"}
                    </div>
                  </div>
                  <div className="font-mono text-base tracking-widest font-semibold shrink-0">
                    {r.checkin_qr_code}
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </>
  )
}
