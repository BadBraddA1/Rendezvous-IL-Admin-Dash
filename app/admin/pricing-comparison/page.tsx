"use client"

import { useEffect, useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { useToast } from "@/hooks/use-toast"
import Link from "next/link"
import {
  ArrowLeftIcon,
  Loader2Icon,
  RefreshCwIcon,
  TrendingUpIcon,
  TrendingDownIcon,
  MinusIcon,
  DollarSignIcon,
  UsersIcon,
  CheckIcon,
  ZapIcon,
} from "lucide-react"

interface FamilyMember {
  id: number
  first_name: string
  age: number | null
  person_cost: string
  expected_cost: number
  rate_category: string
}

interface Comparison {
  id: number
  family_last_name: string
  lodging_type: string | null
  member_count: number
  is_late_reg: boolean
  old_reg_fee: number
  expected_reg_fee: number
  old_lodging_total: number
  expected_lodging_total: number
  tshirt_total: number
  climbing_total: number
  donation: number
  old_total: number
  expected_total: number
  difference: number
  family_members: FamilyMember[]
}

export default function PricingComparisonPage() {
  const [comparisons, setComparisons] = useState<Comparison[]>([])
  const [loading, setLoading] = useState(true)
  const [expandedId, setExpandedId] = useState<number | null>(null)
  const [applying, setApplying] = useState<number | "all" | null>(null)
  const { toast } = useToast()

  const fetchData = async () => {
    setLoading(true)
    try {
      const response = await fetch("/api/pricing-comparison")
      if (response.ok) {
        const data = await response.json()
        setComparisons(data)
      } else {
        throw new Error("Failed to fetch")
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to load pricing comparison",
        variant: "destructive",
      })
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchData()
  }, [])

  const applyRates = async (comp: Comparison) => {
    setApplying(comp.id)
    try {
      const response = await fetch("/api/pricing-comparison/apply", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          registrationId: comp.id,
          expectedRegFee: comp.expected_reg_fee,
          expectedLodgingTotal: comp.expected_lodging_total,
          memberUpdates: comp.family_members.map(fm => ({
            id: fm.id,
            expected_cost: fm.expected_cost
          }))
        })
      })
      if (response.ok) {
        toast({
          title: "Success",
          description: `Applied new rates to ${comp.family_last_name} family`,
        })
        fetchData()
      } else {
        throw new Error("Failed")
      }
    } catch {
      toast({
        title: "Error",
        description: "Failed to apply rates",
        variant: "destructive",
      })
    } finally {
      setApplying(null)
    }
  }

  const applyAllRates = async () => {
    if (!confirm("Are you sure you want to apply new rates to ALL registrations? This will update all totals based on the current rate chart.")) {
      return
    }
    setApplying("all")
    try {
      const response = await fetch("/api/pricing-comparison/apply", {
        method: "PUT"
      })
      if (response.ok) {
        const data = await response.json()
        toast({
          title: "Success",
          description: `Applied new rates to ${data.updated} registrations`,
        })
        fetchData()
      } else {
        throw new Error("Failed")
      }
    } catch {
      toast({
        title: "Error",
        description: "Failed to apply rates",
        variant: "destructive",
      })
    } finally {
      setApplying(null)
    }
  }

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: "USD",
    }).format(value)
  }

  // Summary stats
  const totalOld = comparisons.reduce((sum, c) => sum + c.old_total, 0)
  const totalExpected = comparisons.reduce((sum, c) => sum + c.expected_total, 0)
  const totalDifference = totalExpected - totalOld
  const cheaperCount = comparisons.filter(c => c.difference < 0).length
  const moreExpensiveCount = comparisons.filter(c => c.difference > 0).length
  const sameCount = comparisons.filter(c => c.difference === 0).length

  return (
    <div className="min-h-screen bg-background p-4 md:p-8">
      <div className="max-w-6xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-center gap-4">
            <Link href="/admin">
              <Button variant="outline" size="icon">
                <ArrowLeftIcon className="size-4" />
              </Button>
            </Link>
            <div>
              <h1 className="text-2xl font-bold">Pricing Comparison</h1>
              <p className="text-muted-foreground">Compare old totals vs. rate chart expected totals</p>
            </div>
          </div>
          <div className="flex gap-2 flex-wrap">
            <Link href="/admin/rate-chart">
              <Button variant="outline" size="sm">
                <DollarSignIcon className="size-4 mr-2" />
                Edit Rates
              </Button>
            </Link>
            <Button variant="outline" size="sm" onClick={fetchData} disabled={loading}>
              <RefreshCwIcon className={`size-4 mr-2 ${loading ? "animate-spin" : ""}`} />
              Refresh
            </Button>
            <Button 
              variant="default" 
              size="sm" 
              onClick={applyAllRates} 
              disabled={applying === "all" || loading}
              className="bg-blue-600 hover:bg-blue-700"
            >
              {applying === "all" ? (
                <Loader2Icon className="size-4 mr-2 animate-spin" />
              ) : (
                <ZapIcon className="size-4 mr-2" />
              )}
              Apply All New Rates
            </Button>
          </div>
        </div>

        {/* Summary Cards */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <Card className="border-gray-300">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">Old Total (Database)</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-2xl font-bold">{formatCurrency(totalOld)}</p>
              <p className="text-xs text-muted-foreground">What was originally calculated</p>
            </CardContent>
          </Card>
          <Card className="border-blue-300">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-blue-600">New Expected (Rate Chart)</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-2xl font-bold text-blue-600">{formatCurrency(totalExpected)}</p>
              <p className="text-xs text-muted-foreground">Calculated from current rates</p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">Difference</CardTitle>
            </CardHeader>
            <CardContent>
              <p className={`text-2xl font-bold ${totalDifference > 0 ? "text-green-600" : totalDifference < 0 ? "text-red-600" : ""}`}>
                {totalDifference >= 0 ? "+" : ""}{formatCurrency(totalDifference)}
              </p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">Breakdown</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex gap-2 text-sm">
                <Badge variant="outline" className="bg-red-50 text-red-700 border-red-200">
                  {cheaperCount} cheaper
                </Badge>
                <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200">
                  {moreExpensiveCount} more
                </Badge>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Comparison Table */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <UsersIcon className="size-5" />
              Family Comparisons ({comparisons.length})
            </CardTitle>
          </CardHeader>
          <CardContent className="p-0">
            {loading ? (
              <div className="flex items-center justify-center p-12">
                <Loader2Icon className="size-8 animate-spin text-muted-foreground" />
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead className="sticky top-0 z-10">
                    <tr className="border-b bg-muted">
                      <th className="text-left p-3 font-medium">Family</th>
                      <th className="text-left p-3 font-medium">Lodging</th>
                      <th className="text-center p-3 font-medium">Members</th>
                      <th className="text-right p-3 font-medium">Old Total (DB)</th>
                      <th className="text-right p-3 font-medium text-blue-600">New Expected (Rates)</th>
                      <th className="text-right p-3 font-medium">Difference</th>
                    </tr>
                  </thead>
                  <tbody>
                    {comparisons.map((comp) => (
                      <>
                        <tr 
                          key={comp.id} 
                          className={`border-b hover:bg-muted/50 cursor-pointer ${
                            comp.difference < 0 ? "bg-red-50/50" : 
                            comp.difference > 0 ? "bg-green-50/50" : ""
                          }`}
                          onClick={() => setExpandedId(expandedId === comp.id ? null : comp.id)}
                        >
                          <td className="p-3">
                            <div className="flex items-center gap-2">
                              <span className="font-medium">{comp.family_last_name}</span>
                              {comp.is_late_reg && (
                                <Badge variant="outline" className="text-xs bg-amber-50 text-amber-700 border-amber-200">
                                  Late
                                </Badge>
                              )}
                            </div>
                          </td>
                          <td className="p-3">
                            <Badge variant="outline" className="text-xs capitalize">
                              {comp.lodging_type || "N/A"}
                            </Badge>
                          </td>
                          <td className="p-3 text-center">{comp.member_count}</td>
                          <td className="p-3 text-right font-mono text-gray-600">{formatCurrency(comp.old_total)}</td>
                          <td className="p-3 text-right font-mono text-blue-600 font-semibold">{formatCurrency(comp.expected_total)}</td>
                          <td className="p-3 text-right">
                            <div className="flex items-center justify-end gap-1">
                              {comp.difference > 0 ? (
                                <TrendingUpIcon className="size-4 text-green-600" />
                              ) : comp.difference < 0 ? (
                                <TrendingDownIcon className="size-4 text-red-600" />
                              ) : (
                                <MinusIcon className="size-4 text-muted-foreground" />
                              )}
                              <span className={`font-mono ${
                                comp.difference > 0 ? "text-green-600" : 
                                comp.difference < 0 ? "text-red-600" : ""
                              }`}>
                                {comp.difference >= 0 ? "+" : ""}{formatCurrency(comp.difference)}
                              </span>
                            </div>
                          </td>
                        </tr>
                        {expandedId === comp.id && (
                          <tr className="bg-muted/30">
                            <td colSpan={6} className="p-4">
                              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm mb-4">
                                <div>
                                  <p className="text-muted-foreground text-xs">Reg Fee</p>
                                  <p className="text-gray-500">Old: {formatCurrency(comp.old_reg_fee)}</p>
                                  <p className="text-blue-600 font-medium">New: {formatCurrency(comp.expected_reg_fee)}</p>
                                </div>
                                <div>
                                  <p className="text-muted-foreground text-xs">Lodging Total</p>
                                  <p className="text-gray-500">Old: {formatCurrency(comp.old_lodging_total)}</p>
                                  <p className="text-blue-600 font-medium">New: {formatCurrency(comp.expected_lodging_total)}</p>
                                </div>
                                <div>
                                  <p className="text-muted-foreground text-xs">T-Shirts</p>
                                  <p>{formatCurrency(comp.tshirt_total)}</p>
                                </div>
                                <div>
                                  <p className="text-muted-foreground text-xs">Climbing + Donation</p>
                                  <p>{formatCurrency(comp.climbing_total + comp.donation)}</p>
                                </div>
                              </div>
                              
                              {/* Family Members with Rate Details */}
                              <div className="border rounded-lg overflow-hidden mb-4">
                                <table className="w-full text-sm">
                                  <thead>
                                    <tr className="bg-muted/50 border-b">
                                      <th className="text-left p-2 font-medium">Name</th>
                                      <th className="text-center p-2 font-medium">Age</th>
                                      <th className="text-left p-2 font-medium">Rate Category</th>
                                      <th className="text-right p-2 font-medium text-gray-500">Old Cost</th>
                                      <th className="text-right p-2 font-medium text-blue-600">New Cost</th>
                                      <th className="text-right p-2 font-medium">Diff</th>
                                    </tr>
                                  </thead>
                                  <tbody>
                                    {comp.family_members.map((fm) => {
                                      const oldCost = Number(fm.person_cost) || 0
                                      const diff = fm.expected_cost - oldCost
                                      return (
                                        <tr key={fm.id} className="border-b last:border-0">
                                          <td className="p-2 font-medium">{fm.first_name}</td>
                                          <td className="p-2 text-center">{fm.age ?? "?"}</td>
                                          <td className="p-2">
                                            <Badge variant="outline" className="text-xs">
                                              {fm.rate_category}
                                            </Badge>
                                          </td>
                                          <td className="p-2 text-right font-mono text-gray-500">{formatCurrency(oldCost)}</td>
                                          <td className="p-2 text-right font-mono text-blue-600 font-semibold">{formatCurrency(fm.expected_cost)}</td>
                                          <td className={`p-2 text-right font-mono ${diff > 0 ? "text-green-600" : diff < 0 ? "text-red-600" : ""}`}>
                                            {diff !== 0 ? (diff > 0 ? "+" : "") + formatCurrency(diff) : "-"}
                                          </td>
                                        </tr>
                                      )
                                    })}
                                  </tbody>
                                </table>
                              </div>
                              
                              {/* Apply Button */}
                              <div className="flex justify-end">
                                <Button
                                  size="sm"
                                  onClick={(e) => {
                                    e.stopPropagation()
                                    applyRates(comp)
                                  }}
                                  disabled={applying === comp.id || comp.difference === 0}
                                  className="bg-blue-600 hover:bg-blue-700"
                                >
                                  {applying === comp.id ? (
                                    <Loader2Icon className="size-4 mr-2 animate-spin" />
                                  ) : (
                                    <CheckIcon className="size-4 mr-2" />
                                  )}
                                  Apply New Rates to {comp.family_last_name}
                                </Button>
                              </div>
                            </td>
                          </tr>
                        )}
                      </>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
