"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { useToast } from "@/hooks/use-toast"
import Link from "next/link"
import {
  ArrowLeftIcon,
  Loader2Icon,
  DollarSignIcon,
  SaveIcon,
  RefreshCwIcon,
} from "lucide-react"

interface Rate {
  id: number
  rate_key: string
  rate_name: string
  rate_value: number
  category: string
  sort_order: number
  updated_at: string
}

const CATEGORY_LABELS: Record<string, string> = {
  registration: "Registration Fees",
  lodging: "Lodging Rates (Per Person)",
  site_fees: "Site Fees",
  motel: "Motel Room Surcharges",
  activities: "Activities",
}

const CATEGORY_ORDER = ["registration", "lodging", "site_fees", "motel", "activities"]

export default function RateChartPage() {
  const [rates, setRates] = useState<Rate[]>([])
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState<string | null>(null)
  const [editedValues, setEditedValues] = useState<Record<string, string>>({})
  const { toast } = useToast()

  const fetchRates = async () => {
    setLoading(true)
    try {
      const response = await fetch("/api/rate-chart")
      if (response.ok) {
        const data = await response.json()
        setRates(data)
        // Initialize edited values
        const values: Record<string, string> = {}
        data.forEach((rate: Rate) => {
          values[rate.rate_key] = rate.rate_value.toString()
        })
        setEditedValues(values)
      }
    } catch (error) {
      console.error("Error fetching rates:", error)
      toast({
        title: "Error",
        description: "Failed to load rate chart",
        variant: "destructive",
      })
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchRates()
  }, [])

  const handleSave = async (rate_key: string) => {
    const newValue = parseFloat(editedValues[rate_key])
    if (isNaN(newValue) || newValue < 0) {
      toast({
        title: "Invalid Value",
        description: "Please enter a valid positive number",
        variant: "destructive",
      })
      return
    }

    setSaving(rate_key)
    try {
      const response = await fetch("/api/rate-chart", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ rate_key, rate_value: newValue }),
      })

      if (response.ok) {
        const updated = await response.json()
        setRates(rates.map(r => r.rate_key === rate_key ? updated : r))
        toast({
          title: "Saved",
          description: "Rate updated successfully",
        })
      } else {
        throw new Error("Failed to save")
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to save rate",
        variant: "destructive",
      })
    } finally {
      setSaving(null)
    }
  }

  const groupedRates = CATEGORY_ORDER.map(category => ({
    category,
    label: CATEGORY_LABELS[category] || category,
    rates: rates.filter(r => r.category === category),
  })).filter(g => g.rates.length > 0)

  const hasChanges = (rate_key: string) => {
    const rate = rates.find(r => r.rate_key === rate_key)
    if (!rate) return false
    return parseFloat(editedValues[rate_key] || "0") !== rate.rate_value
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <Loader2Icon className="size-8 animate-spin text-muted-foreground" />
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto px-4 py-6 max-w-4xl">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
          <div className="flex items-center gap-4">
            <Link href="/admin">
              <Button variant="ghost" size="icon">
                <ArrowLeftIcon className="size-5" />
              </Button>
            </Link>
            <div>
              <h1 className="text-2xl font-bold flex items-center gap-2">
                <DollarSignIcon className="size-6 text-green-600" />
                Rate Chart
              </h1>
              <p className="text-sm text-muted-foreground">
                Edit pricing for lodging, activities, and fees
              </p>
            </div>
          </div>
          <Button variant="outline" size="sm" onClick={fetchRates}>
            <RefreshCwIcon className="size-4 mr-2" />
            Refresh
          </Button>
        </div>

        {/* Rate Categories */}
        <div className="space-y-6">
          {groupedRates.map(group => (
            <Card key={group.category}>
              <CardHeader className="pb-3">
                <CardTitle className="text-lg">{group.label}</CardTitle>
                <CardDescription>
                  {group.category === "registration" && "Fee charged per family registration"}
                  {group.category === "lodging" && "Per-person rates based on age and lodging type"}
                  {group.category === "site_fees" && "Additional fees for RV and tent sites"}
                  {group.category === "motel" && "Room type surcharges added to base rate"}
                  {group.category === "activities" && "Optional activity fees"}
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid gap-4">
                  {group.rates.map(rate => (
                    <div key={rate.rate_key} className="flex items-center gap-4">
                      <Label className="flex-1 min-w-[200px]">{rate.rate_name}</Label>
                      <div className="flex items-center gap-2">
                        <span className="text-muted-foreground">$</span>
                        <Input
                          type="number"
                          step="0.01"
                          min="0"
                          value={editedValues[rate.rate_key] || ""}
                          onChange={(e) => setEditedValues({
                            ...editedValues,
                            [rate.rate_key]: e.target.value
                          })}
                          className="w-28 text-right"
                        />
                        <Button
                          size="sm"
                          variant={hasChanges(rate.rate_key) ? "default" : "outline"}
                          onClick={() => handleSave(rate.rate_key)}
                          disabled={saving === rate.rate_key || !hasChanges(rate.rate_key)}
                          className="w-20"
                        >
                          {saving === rate.rate_key ? (
                            <Loader2Icon className="size-4 animate-spin" />
                          ) : (
                            <>
                              <SaveIcon className="size-4 mr-1" />
                              Save
                            </>
                          )}
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Info */}
        <Card className="mt-6 bg-amber-50 border-amber-200">
          <CardContent className="pt-6">
            <p className="text-sm text-amber-800">
              <strong>Note:</strong> Changes to rates will apply to new calculations. 
              Existing registrations will keep their original pricing unless manually recalculated.
              These rates are used when sending confirmation emails with QR codes.
            </p>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
