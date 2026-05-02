"use client"

import { useState, useEffect } from "react"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { useToast } from "@/hooks/use-toast"
import {
  ArrowLeftIcon,
  Loader2Icon,
  RefreshCwIcon,
  SaveIcon,
  DollarSignIcon,
  UsersIcon,
  ChevronDownIcon,
  ChevronUpIcon,
} from "lucide-react"

interface Rate {
  rate_key: string
  rate_name: string
  rate_value: number
  category: string
}

interface FamilyMember {
  id: number
  first_name: string
  age: number | null
  person_cost: number
  rate_key: string | null
}

interface Registration {
  id: number
  family_last_name: string
  lodging_type: string | null
  registration_fee: number
  lodging_total: number
  tshirt_total: number
  climbing_tower_total: number
  scholarship_donation: number
  site_nights: number
  family_members: FamilyMember[]
}

export default function PricingEditorPage() {
  const [registrations, setRegistrations] = useState<Registration[]>([])
  const [rates, setRates] = useState<Rate[]>([])
  const [loading, setLoading] = useState(true)
  const [expandedId, setExpandedId] = useState<number | null>(null)
  const [saving, setSaving] = useState<number | null>(null)
  const [edits, setEdits] = useState<Record<number, { members: Record<number, string>, siteNights: number, regFee: number }>>({})
  const { toast } = useToast()

  const fetchData = async () => {
    setLoading(true)
    try {
      const [regRes, rateRes] = await Promise.all([
        fetch("/api/pricing-editor"),
        fetch("/api/rate-chart")
      ])
      if (regRes.ok && rateRes.ok) {
        const regData = await regRes.json()
        const rateData = await rateRes.json()
        setRegistrations(regData.registrations || [])
        setRates(rateData.rates || [])
      }
    } catch (error) {
      console.error("Failed to fetch data", error)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchData()
  }, [])

  const getRatesByLodgingType = (lodgingType: string | null) => {
    const type = (lodgingType || "").toLowerCase()
    const isMotel = type.includes("motel")
    const isRV = type.includes("rv")
    const isTent = type.includes("tent")
    const isCommuting = type.includes("commut")
    const isDriveIn = type.includes("drive")

    if (isDriveIn) {
      return rates.filter(r => r.category === "drivein")
    }
    if (isCommuting) {
      return [{ rate_key: "commuting", rate_name: "Commuting (Free)", rate_value: 0, category: "commuting" }]
    }

    // Get applicable rates based on lodging type
    const applicableRates: Rate[] = []
    
    if (isMotel) {
      applicableRates.push(...rates.filter(r => r.category === "motel" || r.category.startsWith("special") && r.rate_key.includes("motel")))
    } else if (isRV) {
      applicableRates.push(...rates.filter(r => r.category === "rv" || r.category.startsWith("special") && (r.rate_key.includes("rv") || r.rate_key.includes("_rv"))))
    } else if (isTent) {
      applicableRates.push(...rates.filter(r => r.category === "tent" || r.category.startsWith("special") && r.rate_key.includes("tent")))
    }

    return applicableRates
  }

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat("en-US", { style: "currency", currency: "USD" }).format(amount)
  }

  const getEdit = (regId: number) => {
    return edits[regId] || { members: {}, siteNights: 4, regFee: 25 }
  }

  const setMemberRate = (regId: number, memberId: number, rateKey: string) => {
    const current = getEdit(regId)
    setEdits({
      ...edits,
      [regId]: {
        ...current,
        members: { ...current.members, [memberId]: rateKey }
      }
    })
  }

  const setSiteNights = (regId: number, nights: number) => {
    const current = getEdit(regId)
    setEdits({
      ...edits,
      [regId]: { ...current, siteNights: nights }
    })
  }

  const setRegFee = (regId: number, fee: number) => {
    const current = getEdit(regId)
    setEdits({
      ...edits,
      [regId]: { ...current, regFee: fee }
    })
  }

  const calculateNewTotal = (reg: Registration) => {
    const edit = getEdit(reg.id)
    const lodgingType = (reg.lodging_type || "").toLowerCase()
    const isRV = lodgingType.includes("rv")
    const isTent = lodgingType.includes("tent")
    const isDriveIn = lodgingType.includes("drive")
    const isCommuting = lodgingType.includes("commut")

    let memberTotal = 0
    reg.family_members.forEach(fm => {
      const selectedRateKey = edit.members[fm.id] || fm.rate_key
      if (selectedRateKey) {
        const rate = rates.find(r => r.rate_key === selectedRateKey)
        if (rate) {
          memberTotal += Number(rate.rate_value)
        }
      } else {
        memberTotal += Number(fm.person_cost) || 0
      }
    })

    // Site fee (not for drive-in or commuting)
    let siteFee = 0
    const nights = edit.siteNights || 4
    if (!isDriveIn && !isCommuting) {
      if (isRV) {
        const rvSiteRate = rates.find(r => r.rate_key === "rv_site_night")
        siteFee = (rvSiteRate?.rate_value || 30) * nights
      } else if (isTent) {
        const tentSiteRate = rates.find(r => r.rate_key === "tent_site_night")
        siteFee = (tentSiteRate?.rate_value || 20) * nights
      }
    }

    const regFee = edit.regFee ?? reg.registration_fee ?? 25
    const total = regFee + memberTotal + siteFee + (reg.tshirt_total || 0) + (reg.climbing_tower_total || 0) + (reg.scholarship_donation || 0)

    return { memberTotal, siteFee, regFee, total }
  }

  const saveRegistration = async (reg: Registration) => {
    setSaving(reg.id)
    const edit = getEdit(reg.id)
    const { memberTotal, siteFee, regFee, total } = calculateNewTotal(reg)

    try {
      const response = await fetch("/api/pricing-editor/save", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          registrationId: reg.id,
          regFee,
          lodgingTotal: memberTotal + siteFee,
          memberUpdates: reg.family_members.map(fm => ({
            id: fm.id,
            rate_key: edit.members[fm.id] || fm.rate_key,
            person_cost: rates.find(r => r.rate_key === (edit.members[fm.id] || fm.rate_key))?.rate_value || fm.person_cost
          }))
        })
      })

      if (response.ok) {
        toast({
          title: "Saved",
          description: `${reg.family_last_name} family updated. New total: ${formatCurrency(total)}`,
        })
        fetchData()
      } else {
        throw new Error("Failed")
      }
    } catch {
      toast({
        title: "Error",
        description: "Failed to save changes",
        variant: "destructive",
      })
    } finally {
      setSaving(null)
    }
  }

  const getOldTotal = (reg: Registration) => {
    return (reg.registration_fee || 0) + (reg.lodging_total || 0) + (reg.tshirt_total || 0) + (reg.climbing_tower_total || 0) + (reg.scholarship_donation || 0)
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
      <div className="container mx-auto p-4 md:p-6 max-w-6xl">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
          <div className="flex items-center gap-3">
            <Link href="/admin">
              <Button variant="ghost" size="icon">
                <ArrowLeftIcon className="size-4" />
              </Button>
            </Link>
            <div>
              <h1 className="text-2xl font-bold">Pricing Editor</h1>
              <p className="text-sm text-muted-foreground">Set individual rates per person</p>
            </div>
          </div>
          <div className="flex gap-2">
            <Link href="/admin/rate-chart">
              <Button variant="outline" size="sm">
                <DollarSignIcon className="size-4 mr-2" />
                View Rates
              </Button>
            </Link>
            <Button variant="outline" size="sm" onClick={fetchData} disabled={loading}>
              <RefreshCwIcon className={`size-4 mr-2 ${loading ? "animate-spin" : ""}`} />
              Refresh
            </Button>
          </div>
        </div>

        {/* Families List */}
        <div className="space-y-4">
          {registrations.map(reg => {
            const isExpanded = expandedId === reg.id
            const { memberTotal, siteFee, regFee, total: newTotal } = calculateNewTotal(reg)
            const oldTotal = getOldTotal(reg)
            const difference = newTotal - oldTotal
            const applicableRates = getRatesByLodgingType(reg.lodging_type)
            const edit = getEdit(reg.id)
            const lodgingType = (reg.lodging_type || "").toLowerCase()
            const showSiteFee = (lodgingType.includes("rv") || lodgingType.includes("tent")) && !lodgingType.includes("drive") && !lodgingType.includes("commut")

            return (
              <Card key={reg.id} className={difference !== 0 ? (difference > 0 ? "border-green-200" : "border-red-200") : ""}>
                <CardHeader 
                  className="cursor-pointer hover:bg-muted/30 transition-colors"
                  onClick={() => setExpandedId(isExpanded ? null : reg.id)}
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <CardTitle className="text-lg">{reg.family_last_name}</CardTitle>
                      <Badge variant="outline">{reg.lodging_type || "Unknown"}</Badge>
                      <Badge variant="secondary">
                        <UsersIcon className="size-3 mr-1" />
                        {reg.family_members.length}
                      </Badge>
                    </div>
                    <div className="flex items-center gap-4">
                      <div className="text-right">
                        <p className="text-sm text-muted-foreground">Old: {formatCurrency(oldTotal)}</p>
                        <p className={`font-bold ${difference !== 0 ? (difference > 0 ? "text-green-600" : "text-red-600") : ""}`}>
                          New: {formatCurrency(newTotal)}
                        </p>
                      </div>
                      {difference !== 0 && (
                        <Badge variant={difference > 0 ? "default" : "destructive"}>
                          {difference > 0 ? "+" : ""}{formatCurrency(difference)}
                        </Badge>
                      )}
                      {isExpanded ? <ChevronUpIcon className="size-5" /> : <ChevronDownIcon className="size-5" />}
                    </div>
                  </div>
                </CardHeader>

                {isExpanded && (
                  <CardContent className="border-t pt-4">
                    {/* Registration Fee */}
                    <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-4 p-3 bg-muted/30 rounded-lg">
                      <div>
                        <Label className="text-xs text-muted-foreground">Registration Fee</Label>
                        <Select
                          value={String(edit.regFee ?? reg.registration_fee ?? 25)}
                          onValueChange={(v) => setRegFee(reg.id, Number(v))}
                        >
                          <SelectTrigger className="mt-1">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="25">$25 - Regular</SelectItem>
                            <SelectItem value="50">$50 - Late Registration</SelectItem>
                            <SelectItem value="0">$0 - Waived</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                      {showSiteFee && (
                        <div>
                          <Label className="text-xs text-muted-foreground">Site Nights</Label>
                          <Input
                            type="number"
                            min={1}
                            max={7}
                            value={edit.siteNights || 4}
                            onChange={(e) => setSiteNights(reg.id, Number(e.target.value))}
                            className="mt-1"
                          />
                          <p className="text-xs text-muted-foreground mt-1">
                            Site Fee: {formatCurrency(siteFee)}
                          </p>
                        </div>
                      )}
                      <div>
                        <Label className="text-xs text-muted-foreground">T-Shirts</Label>
                        <p className="mt-1 font-medium">{formatCurrency(reg.tshirt_total || 0)}</p>
                      </div>
                      <div>
                        <Label className="text-xs text-muted-foreground">Climbing + Donation</Label>
                        <p className="mt-1 font-medium">{formatCurrency((reg.climbing_tower_total || 0) + (reg.scholarship_donation || 0))}</p>
                      </div>
                    </div>

                    {/* Family Members */}
                    <div className="space-y-3">
                      <Label className="text-sm font-medium">Family Members - Select Rate Per Person</Label>
                      <div className="border rounded-lg overflow-hidden">
                        <table className="w-full text-sm">
                          <thead>
                            <tr className="bg-muted/50 border-b">
                              <th className="text-left p-2 font-medium">Name</th>
                              <th className="text-center p-2 font-medium w-16">Age</th>
                              <th className="text-left p-2 font-medium">Rate Selection</th>
                              <th className="text-right p-2 font-medium w-24">Old Cost</th>
                              <th className="text-right p-2 font-medium w-24">New Cost</th>
                            </tr>
                          </thead>
                          <tbody>
                            {reg.family_members.map(fm => {
                              const selectedRateKey = edit.members[fm.id] || fm.rate_key || ""
                              const selectedRate = rates.find(r => r.rate_key === selectedRateKey)
                              const newCost = selectedRate?.rate_value ?? fm.person_cost ?? 0

                              return (
                                <tr key={fm.id} className="border-b last:border-0 hover:bg-muted/20">
                                  <td className="p-2 font-medium">{fm.first_name}</td>
                                  <td className="p-2 text-center">{fm.age ?? "?"}</td>
                                  <td className="p-2">
                                    <Select
                                      value={selectedRateKey}
                                      onValueChange={(v) => setMemberRate(reg.id, fm.id, v)}
                                    >
                                      <SelectTrigger className="w-full">
                                        <SelectValue placeholder="Select rate..." />
                                      </SelectTrigger>
                                      <SelectContent>
                                        {applicableRates.map(rate => (
                                          <SelectItem key={rate.rate_key} value={rate.rate_key}>
                                            {rate.rate_name} - {formatCurrency(rate.rate_value)}
                                          </SelectItem>
                                        ))}
                                      </SelectContent>
                                    </Select>
                                  </td>
                                  <td className="p-2 text-right font-mono text-muted-foreground">
                                    {formatCurrency(fm.person_cost || 0)}
                                  </td>
                                  <td className="p-2 text-right font-mono font-semibold text-blue-600">
                                    {formatCurrency(newCost)}
                                  </td>
                                </tr>
                              )
                            })}
                          </tbody>
                          <tfoot>
                            <tr className="bg-muted/30 font-medium">
                              <td colSpan={3} className="p-2 text-right">Member Subtotal:</td>
                              <td className="p-2 text-right font-mono text-muted-foreground">
                                {formatCurrency(reg.family_members.reduce((sum, fm) => sum + (fm.person_cost || 0), 0))}
                              </td>
                              <td className="p-2 text-right font-mono text-blue-600">
                                {formatCurrency(memberTotal)}
                              </td>
                            </tr>
                          </tfoot>
                        </table>
                      </div>
                    </div>

                    {/* Summary and Save */}
                    <div className="mt-4 flex items-center justify-between p-3 bg-blue-50 rounded-lg border border-blue-200">
                      <div>
                        <p className="text-sm text-muted-foreground">New Total for Email Billing:</p>
                        <p className="text-2xl font-bold text-blue-600">{formatCurrency(newTotal)}</p>
                      </div>
                      <Button
                        onClick={() => saveRegistration(reg)}
                        disabled={saving === reg.id}
                        className="bg-blue-600 hover:bg-blue-700"
                      >
                        {saving === reg.id ? (
                          <Loader2Icon className="size-4 mr-2 animate-spin" />
                        ) : (
                          <SaveIcon className="size-4 mr-2" />
                        )}
                        Save & Update Billing
                      </Button>
                    </div>
                  </CardContent>
                )}
              </Card>
            )
          })}
        </div>
      </div>
    </div>
  )
}
