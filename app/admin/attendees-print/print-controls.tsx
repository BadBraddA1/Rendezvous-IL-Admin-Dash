"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { PrinterIcon, ArrowLeftIcon, MinimizeIcon, MaximizeIcon } from "lucide-react"
import Link from "next/link"

export function PrintControls() {
  const [compact, setCompact] = useState(false)

  const toggleCompact = () => {
    const next = !compact
    setCompact(next)
    if (typeof document !== "undefined") {
      const el = document.querySelector(".print-area")
      if (el) {
        if (next) el.setAttribute("data-compact", "true")
        else el.removeAttribute("data-compact")
      }
    }
  }

  return (
    <div className="no-print sticky top-0 z-10 flex items-center justify-between gap-2 border-b bg-white px-6 py-3 print:hidden">
      <Link href="/admin">
        <Button variant="ghost" size="sm">
          <ArrowLeftIcon className="mr-2 size-4" />
          Back to Dashboard
        </Button>
      </Link>
      <div className="flex items-center gap-2">
        <p className="text-sm text-muted-foreground hidden sm:block">
          Use your browser&apos;s print dialog to save as PDF or print.
        </p>
        <Button
          onClick={toggleCompact}
          size="sm"
          variant={compact ? "default" : "outline"}
          title="Shrink the table to fit on one page"
        >
          {compact ? (
            <>
              <MaximizeIcon className="mr-2 size-4" />
              Normal Size
            </>
          ) : (
            <>
              <MinimizeIcon className="mr-2 size-4" />
              Fit to One Page
            </>
          )}
        </Button>
        <Button onClick={() => window.print()} size="sm">
          <PrinterIcon className="mr-2 size-4" />
          Print
        </Button>
      </div>
    </div>
  )
}
