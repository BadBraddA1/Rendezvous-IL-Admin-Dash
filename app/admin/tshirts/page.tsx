"use client"

import { useEffect, useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Badge } from "@/components/ui/badge"
import { ShirtIcon, ArrowLeftIcon, PencilIcon, Loader2Icon } from "lucide-react"
import Link from "next/link"
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { useToast } from "@/hooks/use-toast"

interface TshirtOrder {
  id: number
  registration_id: number
  name: string
  size: string
  color: string
  quantity: number
  cost: number
  family_last_name: string
  email: string
  husband_phone: string | null
  wife_phone: string | null
}

export default function TshirtsPage() {
  const [tshirts, setTshirts] = useState<TshirtOrder[]>([])
  const [loading, setLoading] = useState(true)
  const [priceDialog, setPriceDialog] = useState<{ open: boolean; size?: string }>({ open: false })
  const [newPrice, setNewPrice] = useState("")
  const [updatingPrice, setUpdatingPrice] = useState(false)
  const { toast } = useToast()

  useEffect(() => {
    fetchTshirts()
  }, [])

  const fetchTshirts = async () => {
    try {
      const response = await fetch("/api/tshirts")
      const data = await response.json()
      setTshirts(Array.isArray(data) ? data : [])
    } catch (error) {
      console.error("Error fetching t-shirts:", error)
      setTshirts([])
    } finally {
      setLoading(false)
    }
  }

  const handleOpenPriceDialog = (size: string) => {
    const sizeTshirts = tshirts.filter((t) => t.size === size)
    const avgPrice = sizeTshirts.length > 0 ? sizeTshirts[0].cost : 0
    setNewPrice(String(avgPrice))
    setPriceDialog({ open: true, size })
  }

  const handleUpdatePrice = async () => {
    if (!priceDialog.size) return

    const price = parseFloat(newPrice)
    if (isNaN(price) || price < 0) {
      toast({ title: "Invalid price", variant: "destructive" })
      return
    }

    setUpdatingPrice(true)
    try {
      const response = await fetch("/api/tshirts/update-price", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ size: priceDialog.size, price }),
      })

      const result = await response.json()

      if (response.ok) {
        toast({ title: "Success", description: `Price for ${priceDialog.size} updated to $${price.toFixed(2)}` })
        setPriceDialog({ open: false })
        fetchTshirts()
      } else {
        toast({ title: "Error", description: result.error || "Failed to update price", variant: "destructive" })
      }
    } catch (error) {
      toast({ title: "Error", description: "Failed to update price", variant: "destructive" })
    } finally {
      setUpdatingPrice(false)
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary" />
      </div>
    )
  }

  // Group by size
  const groupedBySizes = tshirts.reduce(
    (acc, shirt) => {
      const size = shirt.size || "Unknown"
      if (!acc[size]) {
        acc[size] = []
      }
      acc[size].push(shirt)
      return acc
    },
    {} as Record<string, TshirtOrder[]>,
  )

  const sizeOrder = ["Youth S", "Youth M", "Youth L", "Adult S", "Adult M", "Adult L", "Adult XL", "Adult 2XL", "Adult 3XL"]
  const sortedSizes = Object.keys(groupedBySizes).sort((a, b) => {
    const aIndex = sizeOrder.indexOf(a)
    const bIndex = sizeOrder.indexOf(b)
    if (aIndex !== -1 && bIndex !== -1) return aIndex - bIndex
    if (aIndex !== -1) return -1
    if (bIndex !== -1) return 1
    return a.localeCompare(b)
  })

  const totalCost = tshirts.reduce((sum, shirt) => sum + shirt.cost * shirt.quantity, 0)
  const totalShirts = tshirts.reduce((sum, shirt) => sum + (shirt.quantity || 0), 0)

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
            <h1 className="text-3xl font-bold tracking-tight">T-Shirt Orders</h1>
            <p className="text-muted-foreground mt-1">View all t-shirt orders by size</p>
          </div>
        </div>

        <div className="grid gap-4 md:grid-cols-3">
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium">Total Shirts</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{totalShirts}</div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium">Total Cost</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">${totalCost.toFixed(2)}</div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium">Unique Sizes</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{sortedSizes.length}</div>
            </CardContent>
          </Card>
        </div>

        {/* All T-Shirts Table */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <ShirtIcon className="size-5" />
              All T-Shirt Orders
            </CardTitle>
            <CardDescription>{totalShirts} shirt(s) across {tshirts.length} order row(s)</CardDescription>
          </CardHeader>
          <CardContent>
            {tshirts.length === 0 ? (
              <p className="text-muted-foreground text-sm">No t-shirt orders yet</p>
            ) : (
              <div className="rounded-md border">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Name</TableHead>
                      <TableHead>Size</TableHead>
                      <TableHead>Color</TableHead>
                      <TableHead>Qty</TableHead>
                      <TableHead>Unit Price</TableHead>
                      <TableHead>Subtotal</TableHead>
                      <TableHead>Family</TableHead>
                      <TableHead>Email</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {tshirts.map((shirt) => (
                      <TableRow key={shirt.id}>
                          <TableCell className="font-medium">{shirt.name}</TableCell>
                          <TableCell><Badge variant="secondary">{shirt.size}</Badge></TableCell>
                          <TableCell>{shirt.color}</TableCell>
                          <TableCell className="font-semibold">{shirt.quantity}</TableCell>
                          <TableCell>${shirt.cost.toFixed(2)}</TableCell>
                          <TableCell className="font-semibold">${(shirt.cost * shirt.quantity).toFixed(2)}</TableCell>
                          <TableCell>{shirt.family_last_name}</TableCell>
                          <TableCell className="text-sm">{shirt.email}</TableCell>
                        </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Grouped by Size */}
        {sortedSizes.map((size) => {
          const shirts = groupedBySizes[size]
          const sizeTotal = shirts.reduce((sum, shirt) => sum + shirt.cost * shirt.quantity, 0)
          const sizeShirtCount = shirts.reduce((sum, shirt) => sum + (shirt.quantity || 0), 0)
          return (
            <Card key={size}>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <ShirtIcon className="size-5" />
                    <div>
                      <CardTitle>{size}</CardTitle>
                      <CardDescription>{sizeShirtCount} shirt(s) - ${sizeTotal.toFixed(2)} total</CardDescription>
                    </div>
                  </div>
                  <Button size="sm" variant="outline" onClick={() => handleOpenPriceDialog(size)}>
                    <PencilIcon className="size-3 mr-1" />
                    Edit Price
                  </Button>
                </div>
              </CardHeader>
              <CardContent>
                <div className="rounded-md border">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Name</TableHead>
                        <TableHead>Color</TableHead>
                        <TableHead>Qty</TableHead>
                        <TableHead>Cost</TableHead>
                        <TableHead>Family</TableHead>
                        <TableHead>Email</TableHead>
                        <TableHead>Phone</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {shirts.map((shirt) => (
                        <TableRow key={shirt.id}>
                          <TableCell className="font-medium">{shirt.name}</TableCell>
                          <TableCell>{shirt.color}</TableCell>
                          <TableCell>{shirt.quantity}</TableCell>
                          <TableCell>${shirt.cost.toFixed(2)}</TableCell>
                          <TableCell>{shirt.family_last_name}</TableCell>
                          <TableCell className="text-sm">{shirt.email}</TableCell>
                          <TableCell>{shirt.husband_phone || shirt.wife_phone || "N/A"}</TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              </CardContent>
            </Card>
          )
        })}
      </div>

      <Dialog open={priceDialog.open} onOpenChange={(open) => setPriceDialog({ open })}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Edit Price for {priceDialog.size}</DialogTitle>
            <DialogDescription>Set the price for all t-shirts of this size</DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label>Price ($)</Label>
              <Input
                type="number"
                min="0"
                step="0.01"
                value={newPrice}
                onChange={(e) => setNewPrice(e.target.value)}
                placeholder="0.00"
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setPriceDialog({ open: false })}>
              Cancel
            </Button>
            <Button onClick={handleUpdatePrice} disabled={updatingPrice}>
              {updatingPrice ? <Loader2Icon className="size-3 animate-spin mr-1" /> : null}
              Update Price
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
