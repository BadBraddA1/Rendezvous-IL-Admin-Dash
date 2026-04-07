"use client"

import { useEffect, useState } from "react"
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { useToast } from "@/hooks/use-toast"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { PlusIcon, TrashIcon, Loader2Icon, PencilIcon, CheckIcon, XIcon } from "lucide-react"

interface TshirtOrder {
  id: number
  size: string
  color: string
  quantity: number
  price: number
  isNew?: boolean
}

interface TshirtDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  registrationId: number
  familyName?: string
  orders: TshirtOrder[]
  onSuccess: () => void
}

const SIZES = [
  "4T", "5T",
  "yXS", "yS", "yM", "yL", "yXL",
  "aS", "aM", "aL", "aXL", "a2XL", "a3XL",
  "wS", "wM", "wL", "wXL", "w2XL", "w3XL",
]
const SIZE_LABELS: Record<string, string> = {
  "4T": "4T", "5T": "5T",
  yXS: "Youth XS", yS: "Youth S", yM: "Youth M", yL: "Youth L", yXL: "Youth XL",
  aS: "Adult S", aM: "Adult M", aL: "Adult L", aXL: "Adult XL", a2XL: "Adult 2XL", a3XL: "Adult 3XL",
  wS: "Women S", wM: "Women M", wL: "Women L", wXL: "Women XL", w2XL: "Women 2XL", w3XL: "Women 3XL",
}

const EMPTY_ORDER = { size: "", color: "", quantity: "1", price: "" }

export function TshirtDialog({ open, onOpenChange, registrationId, familyName, orders, onSuccess }: TshirtDialogProps) {
  const [newOrder, setNewOrder] = useState(EMPTY_ORDER)
  const [localOrders, setLocalOrders] = useState<TshirtOrder[]>([])
  const [editingId, setEditingId] = useState<number | null>(null)
  const [editValues, setEditValues] = useState<Partial<TshirtOrder>>({})
  const [saving, setSaving] = useState(false)
  const { toast } = useToast()

  // Sync orders when dialog opens with fresh data
  useEffect(() => {
    if (open) {
      setLocalOrders(orders.map((o) => ({ ...o, price: Number(o.price) })))
      setNewOrder(EMPTY_ORDER)
      setEditingId(null)
    }
  }, [open, orders])

  const handleAddOrder = () => {
    if (!newOrder.size || !newOrder.color || !newOrder.quantity || newOrder.price === "") {
      toast({ title: "Missing fields", description: "Please fill in all fields.", variant: "destructive" })
      return
    }
    setLocalOrders((prev) => [
      ...prev,
      {
        id: Date.now(), // unique enough for local key, stripped before save
        size: newOrder.size,
        color: newOrder.color,
        quantity: parseInt(newOrder.quantity),
        price: parseFloat(newOrder.price),
        isNew: true,
      },
    ])
    setNewOrder(EMPTY_ORDER)
  }

  const handleRemoveOrder = (id: number) => {
    setLocalOrders((prev) => prev.filter((o) => o.id !== id))
  }

  const startEdit = (order: TshirtOrder) => {
    setEditingId(order.id)
    setEditValues({ size: order.size, color: order.color, quantity: order.quantity, price: order.price })
  }

  const commitEdit = (id: number) => {
    setLocalOrders((prev) =>
      prev.map((o) => (o.id === id ? { ...o, ...editValues, quantity: Number(editValues.quantity), price: Number(editValues.price) } : o))
    )
    setEditingId(null)
  }

  const handleSave = async () => {
    setSaving(true)
    try {
      const payload = localOrders.map(({ id, isNew, ...rest }) => rest)
      const response = await fetch(`/api/registrations/${registrationId}/tshirts`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ orders: payload }),
      })

      const result = await response.json()

      if (response.ok) {
        toast({ title: "T-shirt orders saved" })
        onOpenChange(false)
        onSuccess()
      } else {
        toast({ title: "Error", description: result.error || "Failed to update orders", variant: "destructive" })
      }
    } catch {
      toast({ title: "Error", description: "Failed to update t-shirt orders", variant: "destructive" })
    } finally {
      setSaving(false)
    }
  }

  const total = localOrders.reduce((sum, o) => sum + Number(o.price) * Number(o.quantity), 0)

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>T-Shirt Orders{familyName ? ` — ${familyName} Family` : ""}</DialogTitle>
          <DialogDescription>Add, edit, or remove t-shirt orders for this family</DialogDescription>
        </DialogHeader>

        <div className="space-y-5">
          {/* Add new order */}
          <div className="bg-muted/50 border rounded-xl p-4 space-y-3">
            <p className="text-sm font-semibold">Add New Order</p>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1">
                <Label className="text-xs">Size</Label>
                <Select value={newOrder.size} onValueChange={(val) => setNewOrder({ ...newOrder, size: val })}>
                  <SelectTrigger className="h-8 text-xs">
                    <SelectValue placeholder="Select size" />
                  </SelectTrigger>
                  <SelectContent>
                    {SIZES.map((s) => (
                      <SelectItem key={s} value={s}>{SIZE_LABELS[s] ?? s}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-1">
                <Label className="text-xs">Color</Label>
                <Input
                  value={newOrder.color}
                  onChange={(e) => setNewOrder({ ...newOrder, color: e.target.value })}
                  placeholder="e.g. Navy"
                  className="h-8 text-xs"
                />
              </div>
              <div className="space-y-1">
                <Label className="text-xs">Quantity</Label>
                <Input
                  type="number"
                  min="1"
                  value={newOrder.quantity}
                  onChange={(e) => setNewOrder({ ...newOrder, quantity: e.target.value })}
                  className="h-8 text-xs"
                />
              </div>
              <div className="space-y-1">
                <Label className="text-xs">Price ($)</Label>
                <Input
                  type="number"
                  min="0"
                  step="0.01"
                  value={newOrder.price}
                  onChange={(e) => setNewOrder({ ...newOrder, price: e.target.value })}
                  placeholder="10.00"
                  className="h-8 text-xs"
                />
              </div>
            </div>
            <Button size="sm" variant="outline" onClick={handleAddOrder} className="w-full gap-1">
              <PlusIcon className="size-3" />
              Add to Order
            </Button>
          </div>

          {/* Current orders table */}
          {localOrders.length > 0 ? (
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <p className="text-sm font-semibold">Current Orders</p>
                <span className="text-sm font-semibold text-primary">Total: ${total.toFixed(2)}</span>
              </div>
              <div className="rounded-xl border overflow-hidden">
                <Table>
                  <TableHeader>
                    <TableRow className="bg-muted/40">
                      <TableHead className="text-xs">Size</TableHead>
                      <TableHead className="text-xs">Color</TableHead>
                      <TableHead className="text-xs">Qty</TableHead>
                      <TableHead className="text-xs">Price</TableHead>
                      <TableHead className="text-xs">Subtotal</TableHead>
                      <TableHead className="text-xs w-16"></TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {localOrders.map((order) =>
                      editingId === order.id ? (
                        <TableRow key={order.id} className="bg-primary/5">
                          <TableCell className="p-1">
                            <Select value={editValues.size} onValueChange={(v) => setEditValues({ ...editValues, size: v })}>
                              <SelectTrigger className="h-7 text-xs"><SelectValue /></SelectTrigger>
                              <SelectContent>{SIZES.map((s) => <SelectItem key={s} value={s}>{SIZE_LABELS[s] ?? s}</SelectItem>)}</SelectContent>
                            </Select>
                          </TableCell>
                          <TableCell className="p-1">
                            <Input value={editValues.color} onChange={(e) => setEditValues({ ...editValues, color: e.target.value })} className="h-7 text-xs" />
                          </TableCell>
                          <TableCell className="p-1">
                            <Input type="number" min="1" value={editValues.quantity} onChange={(e) => setEditValues({ ...editValues, quantity: Number(e.target.value) })} className="h-7 text-xs w-14" />
                          </TableCell>
                          <TableCell className="p-1">
                            <Input type="number" min="0" step="0.01" value={editValues.price} onChange={(e) => setEditValues({ ...editValues, price: Number(e.target.value) })} className="h-7 text-xs w-16" />
                          </TableCell>
                          <TableCell className="text-xs font-semibold">
                            ${(Number(editValues.price) * Number(editValues.quantity)).toFixed(2)}
                          </TableCell>
                          <TableCell className="p-1">
                            <div className="flex gap-1">
                              <Button variant="ghost" size="sm" onClick={() => commitEdit(order.id)} className="h-6 w-6 p-0">
                                <CheckIcon className="size-3 text-green-600" />
                              </Button>
                              <Button variant="ghost" size="sm" onClick={() => setEditingId(null)} className="h-6 w-6 p-0">
                                <XIcon className="size-3 text-muted-foreground" />
                              </Button>
                            </div>
                          </TableCell>
                        </TableRow>
                      ) : (
                        <TableRow key={order.id} className={order.isNew ? "bg-green-50" : ""}>
                          <TableCell className="text-xs">{SIZE_LABELS[order.size] ?? order.size}</TableCell>
                          <TableCell className="text-xs">{order.color}</TableCell>
                          <TableCell className="text-xs">{order.quantity}</TableCell>
                          <TableCell className="text-xs">${Number(order.price).toFixed(2)}</TableCell>
                          <TableCell className="text-xs font-semibold">${(Number(order.price) * Number(order.quantity)).toFixed(2)}</TableCell>
                          <TableCell className="p-1">
                            <div className="flex gap-1">
                              <Button variant="ghost" size="sm" onClick={() => startEdit(order)} className="h-6 w-6 p-0">
                                <PencilIcon className="size-3 text-muted-foreground" />
                              </Button>
                              <Button variant="ghost" size="sm" onClick={() => handleRemoveOrder(order.id)} className="h-6 w-6 p-0">
                                <TrashIcon className="size-3 text-destructive" />
                              </Button>
                            </div>
                          </TableCell>
                        </TableRow>
                      )
                    )}
                  </TableBody>
                </Table>
              </div>
            </div>
          ) : (
            <div className="text-center py-8 border-2 border-dashed rounded-xl text-muted-foreground">
              <p className="text-sm font-medium">No t-shirt orders yet</p>
              <p className="text-xs mt-1">Use the form above to add orders.</p>
            </div>
          )}
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>Cancel</Button>
          <Button onClick={handleSave} disabled={saving}>
            {saving && <Loader2Icon className="size-3 animate-spin mr-1" />}
            Save Orders
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
