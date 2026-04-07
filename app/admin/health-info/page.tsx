"use client"

import { useEffect, useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { AlertCircleIcon, ArrowLeftIcon } from "lucide-react"
import Link from "next/link"

interface HealthInfo {
  id: number
  registration_id: number
  full_name: string
  condition: string
  medication_on_hand: boolean
  family_last_name: string
  email: string
  husband_phone: string | null
  wife_phone: string | null
}

export default function HealthInfoPage() {
  const [healthInfo, setHealthInfo] = useState<HealthInfo[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const fetchHealthInfo = async () => {
      try {
        const response = await fetch("/api/health-info")
        const data = await response.json()
        setHealthInfo(data)
      } catch (error) {
        console.error("[v0] Error fetching health info:", error)
      } finally {
        setLoading(false)
      }
    }

    fetchHealthInfo()
  }, [])

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary" />
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-muted/30 p-6">
      <div className="max-w-7xl mx-auto space-y-6">
        <div className="flex items-center gap-4">
          <Link href="/admin">
            <Button variant="ghost" size="sm">
              <ArrowLeftIcon className="mr-2 size-4" />
              Back to Dashboard
            </Button>
          </Link>
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Health Information</h1>
            <p className="text-muted-foreground mt-1">View all health conditions and medications</p>
          </div>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Health Conditions</CardTitle>
            <CardDescription>{healthInfo.length} health record(s) found</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="rounded-md border">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Full Name</TableHead>
                    <TableHead>Family</TableHead>
                    <TableHead>Condition</TableHead>
                    <TableHead>Medication On Hand</TableHead>
                    <TableHead>Contact</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {healthInfo.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={5} className="text-center py-8 text-muted-foreground">
                        No health information recorded
                      </TableCell>
                    </TableRow>
                  ) : (
                    healthInfo.map((info) => (
                      <TableRow key={info.id}>
                        <TableCell className="font-medium">
                          <div className="flex items-center gap-2">
                            <AlertCircleIcon className="size-4 text-red-500" />
                            {info.full_name}
                          </div>
                        </TableCell>
                        <TableCell>{info.family_last_name}</TableCell>
                        <TableCell>
                          <div className="max-w-md">{info.condition}</div>
                        </TableCell>
                        <TableCell>
                          <Badge variant={info.medication_on_hand ? "default" : "secondary"}>
                            {info.medication_on_hand ? "Yes" : "No"}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          <div className="text-sm">
                            <div>{info.email}</div>
                            <div className="text-muted-foreground">{info.husband_phone || info.wife_phone}</div>
                          </div>
                        </TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
