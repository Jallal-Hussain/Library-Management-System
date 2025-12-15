"use client"

import type React from "react"

import { useState } from "react"
import { Header } from "@/components/header"
import { formatCurrency } from "@/lib/circulation-utils"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Progress } from "@/components/ui/progress"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"
import { Textarea } from "@/components/ui/textarea"
import {
  Plus,
  Search,
  MoreHorizontal,
  Package,
  CheckCircle,
  Clock,
  DollarSign,
  Building,
  ShoppingCart,
  FileText,
  Eye,
  Scale,
  AlertTriangle,
} from "lucide-react"
import { cn } from "@/lib/utils"
import { toast } from "sonner"
import { VendorQuoteComparison } from "@/components/vendor-quote-comparison"
import type { VendorQuote } from "@/lib/types"

interface Acquisition {
  id: string
  title: string
  author: string
  isbn: string
  vendor: string
  vendorId?: string
  quantity: number
  unitPrice: number
  totalPrice: number
  status: "requested" | "approved" | "ordered" | "received"
  requestDate: string
  orderDate?: string
  receivedDate?: string
  invoiceId?: string
  invoiceNumber?: string
  invoiceDate?: string
  invoiceDueDate?: string
  invoicePaymentStatus?: "pending" | "paid" | "overdue"
  invoicePaymentDate?: string
  invoicePaymentMethod?: "card" | "cash" | "check" | "transfer"
  notes?: string
}

const mockAcquisitions: Acquisition[] = [
  {
    id: "1",
    title: "The Midnight Library",
    author: "Matt Haig",
    isbn: "978-0525559474",
    vendor: "Penguin Books",
    vendorId: "VEN001",
    quantity: 3,
    unitPrice: 14.99,
    totalPrice: 44.97,
    status: "ordered",
    requestDate: "2024-12-01",
    orderDate: "2024-12-02",
    invoiceNumber: "INV-2024-001",
    invoiceDate: "2024-12-02",
    invoiceDueDate: "2024-12-16",
    invoicePaymentStatus: "pending",
  },
  {
    id: "2",
    title: "Atomic Habits",
    author: "James Clear",
    isbn: "978-0735211292",
    vendor: "Avery Publishing",
    vendorId: "VEN002",
    quantity: 5,
    unitPrice: 11.98,
    totalPrice: 59.9,
    status: "received",
    requestDate: "2024-11-15",
    orderDate: "2024-11-16",
    receivedDate: "2024-11-20",
    invoiceNumber: "INV-2024-002",
    invoiceDate: "2024-11-16",
    invoiceDueDate: "2024-11-30",
    invoicePaymentStatus: "paid",
    invoicePaymentDate: "2024-11-25",
    invoicePaymentMethod: "check",
  },
  {
    id: "3",
    title: "Project Hail Mary",
    author: "Andy Weir",
    isbn: "978-0593135204",
    vendor: "Ballantine Books",
    vendorId: "VEN003",
    quantity: 2,
    unitPrice: 18.0,
    totalPrice: 36.0,
    status: "requested",
    requestDate: "2024-12-05",
  },
]

const vendors = ["Penguin Books", "HarperCollins", "Simon & Schuster", "Avery Publishing", "Ballantine Books", "Other"]

export default function AcquisitionsPage() {
  const [acquisitions, setAcquisitions] = useState<Acquisition[]>(mockAcquisitions)
  const [searchQuery, setSearchQuery] = useState("")
  const [statusFilter, setStatusFilter] = useState<string>("all")
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false)
  const [isDetailDialogOpen, setIsDetailDialogOpen] = useState(false)
  const [isQuoteComparisonOpen, setIsQuoteComparisonOpen] = useState(false)
  const [selectedAcquisition, setSelectedAcquisition] = useState<Acquisition | null>(null)
  const [newAcquisition, setNewAcquisition] = useState({
    title: "",
    author: "",
    isbn: "",
    vendor: "",
    quantity: 1,
    unitPrice: 0,
    notes: "",
  })

  const filteredAcquisitions = acquisitions.filter((acq) => {
    const matchesSearch =
      acq.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      acq.vendor.toLowerCase().includes(searchQuery.toLowerCase())
    const matchesStatus = statusFilter === "all" || acq.status === statusFilter
    return matchesSearch && matchesStatus
  })

  // Mock budget tracking
  const currentBudget = {
    totalAmount: 50000,
    spentAmount: acquisitions
      .filter((a) => a.status === "ordered" || a.status === "received")
      .reduce((acc, a) => acc + a.totalPrice, 0),
  }
  const budgetPercentage = (currentBudget.spentAmount / currentBudget.totalAmount) * 100
  const budgetWarning = budgetPercentage >= 80

  const stats = {
    requested: acquisitions.filter((a) => a.status === "requested").length,
    ordered: acquisitions.filter((a) => a.status === "ordered").length,
    received: acquisitions.filter((a) => a.status === "received").length,
    totalBudget: currentBudget.totalAmount,
    spentBudget: currentBudget.spentAmount,
    remainingBudget: currentBudget.totalAmount - currentBudget.spentAmount,
  }

  const statusColors = {
    requested: "bg-amber-100 text-amber-800",
    approved: "bg-blue-100 text-blue-800",
    ordered: "bg-purple-100 text-purple-800",
    received: "bg-green-100 text-green-800",
  }

  const handleAddAcquisition = (e: React.FormEvent) => {
    e.preventDefault()
    const newItem: Acquisition = {
      id: String(Date.now()),
      ...newAcquisition,
      totalPrice: newAcquisition.quantity * newAcquisition.unitPrice,
      status: "requested",
      requestDate: new Date().toISOString().split("T")[0],
    }
    setAcquisitions([newItem, ...acquisitions])
    setIsAddDialogOpen(false)
    setNewAcquisition({ title: "", author: "", isbn: "", vendor: "", quantity: 1, unitPrice: 0, notes: "" })
    toast.success("Acquisition request submitted")
  }

  const handleStatusChange = (id: string, newStatus: Acquisition["status"]) => {
    const updates: Partial<Acquisition> = { status: newStatus }
    if (newStatus === "ordered" && !acquisitions.find((a) => a.id === id)?.orderDate) {
      updates.orderDate = new Date().toISOString().split("T")[0]
      updates.invoiceNumber = `INV-${new Date().getFullYear()}-${String(Date.now()).slice(-6)}`
      updates.invoiceDate = new Date().toISOString().split("T")[0]
      const dueDate = new Date()
      dueDate.setDate(dueDate.getDate() + 14)
      updates.invoiceDueDate = dueDate.toISOString().split("T")[0]
      updates.invoicePaymentStatus = "pending"
    }
    if (newStatus === "received" && !acquisitions.find((a) => a.id === id)?.receivedDate) {
      updates.receivedDate = new Date().toISOString().split("T")[0]
    }
    setAcquisitions(acquisitions.map((a) => (a.id === id ? { ...a, ...updates } : a)))
    toast.success(`Status updated to ${newStatus}`)
  }

  const handleViewDetails = (acquisition: Acquisition) => {
    setSelectedAcquisition(acquisition)
    setIsDetailDialogOpen(true)
  }

  const handleInvoicePayment = (id: string, method: "card" | "cash" | "check" | "transfer") => {
    setAcquisitions(
      acquisitions.map((a) =>
        a.id === id
          ? {
              ...a,
              invoicePaymentStatus: "paid",
              invoicePaymentDate: new Date().toISOString().split("T")[0],
              invoicePaymentMethod: method,
            }
          : a,
      ),
    )
    toast.success("Invoice marked as paid")
  }

  // Mock quotes for comparison
  const [quotes] = useState<VendorQuote[]>([
    {
      id: "quote-1",
      acquisitionId: "1",
      vendorId: "VEN001",
      vendorName: "Penguin Books",
      price: 44.97,
      deliveryDays: 7,
      terms: "Net 30, Free shipping on orders over Rs. 14,000",
      validUntil: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split("T")[0],
      status: "pending",
      submittedDate: "2024-12-02",
    },
    {
      id: "quote-2",
      acquisitionId: "1",
      vendorId: "VEN004",
      vendorName: "HarperCollins",
      price: 42.50,
      deliveryDays: 10,
      terms: "Net 15, Standard shipping",
      validUntil: new Date(Date.now() + 20 * 24 * 60 * 60 * 1000).toISOString().split("T")[0],
      status: "pending",
      submittedDate: "2024-12-03",
    },
    {
      id: "quote-3",
      acquisitionId: "1",
      vendorId: "VEN005",
      vendorName: "Simon & Schuster",
      price: 45.00,
      deliveryDays: 5,
      terms: "Net 30, Express shipping available",
      validUntil: new Date(Date.now() + 25 * 24 * 60 * 60 * 1000).toISOString().split("T")[0],
      status: "pending",
      submittedDate: "2024-12-03",
    },
  ])

  const handleSelectQuote = (quoteId: string) => {
    const quote = quotes.find((q) => q.id === quoteId)
    if (quote && selectedAcquisition) {
      setAcquisitions(
        acquisitions.map((a) =>
          a.id === selectedAcquisition.id
            ? {
                ...a,
                vendor: quote.vendorName,
                vendorId: quote.vendorId,
                unitPrice: quote.price / (selectedAcquisition.quantity || 1),
                totalPrice: quote.price,
              }
            : a,
        ),
      )
      toast.success(`Quote from ${quote.vendorName} selected`)
      setIsQuoteComparisonOpen(false)
    }
  }

  const handleRequestQuote = (vendorId: string) => {
    toast.info("Quote request sent to vendors")
  }

  return (
    <div className="min-h-screen">
      <Header title="Acquisitions" subtitle="Manage book purchases and procurement" />

      <div className="p-6">
        {/* Stats */}
        <div className="mb-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <Card>
            <CardContent className="flex items-center gap-4 p-4">
              <div className="rounded-lg bg-amber-100 p-3">
                <Clock className="h-6 w-6 text-amber-600" />
              </div>
              <div>
                <p className="text-2xl font-bold">{stats.requested}</p>
                <p className="text-sm text-muted-foreground">Requested</p>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="flex items-center gap-4 p-4">
              <div className="rounded-lg bg-purple-100 p-3">
                <Package className="h-6 w-6 text-purple-600" />
              </div>
              <div>
                <p className="text-2xl font-bold">{stats.ordered}</p>
                <p className="text-sm text-muted-foreground">On Order</p>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="flex items-center gap-4 p-4">
              <div className="rounded-lg bg-green-100 p-3">
                <CheckCircle className="h-6 w-6 text-green-600" />
              </div>
              <div>
                <p className="text-2xl font-bold">{stats.received}</p>
                <p className="text-sm text-muted-foreground">Received</p>
              </div>
            </CardContent>
          </Card>
          <Card className={cn(budgetWarning && "border-amber-200")}>
            <CardContent className="flex items-center gap-4 p-4">
              <div className="rounded-lg bg-blue-100 p-3">
                <DollarSign className="h-6 w-6 text-blue-600" />
              </div>
              <div className="flex-1">
                <div className="flex items-center justify-between mb-1">
                  <p className="text-2xl font-bold">{formatCurrency(stats.spentBudget)}</p>
                  <Badge variant={budgetWarning ? "destructive" : "secondary"} className="text-xs">
                    {budgetPercentage.toFixed(1)}%
                  </Badge>
                </div>
                <p className="text-sm text-muted-foreground">
                  Spent of {formatCurrency(stats.totalBudget)} budget
                </p>
                <div className="mt-2">
                  <Progress value={budgetPercentage} className={cn("h-2", budgetWarning && "bg-amber-500")} />
                </div>
                {budgetWarning && (
                  <p className="text-xs text-amber-600 mt-1 flex items-center gap-1">
                    <AlertTriangle className="h-3 w-3" />
                    Approaching budget limit
                  </p>
                )}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Filters */}
        <Card className="mb-6">
          <CardContent className="p-4">
            <div className="flex flex-wrap items-center gap-4">
              <div className="relative flex-1 min-w-[200px]">
                <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                <Input
                  placeholder="Search by title or vendor..."
                  className="pl-9"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                />
              </div>
              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger className="w-[150px]">
                  <SelectValue placeholder="Status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Status</SelectItem>
                  <SelectItem value="requested">Requested</SelectItem>
                  <SelectItem value="approved">Approved</SelectItem>
                  <SelectItem value="ordered">Ordered</SelectItem>
                  <SelectItem value="received">Received</SelectItem>
                </SelectContent>
              </Select>
              <Button onClick={() => setIsAddDialogOpen(true)}>
                <Plus className="mr-2 h-4 w-4" />
                New Request
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Acquisitions Table */}
        <div className="rounded-lg border bg-card">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-[250px]">Book</TableHead>
                <TableHead>Vendor</TableHead>
                <TableHead className="text-center">Qty</TableHead>
                <TableHead className="text-right">Unit Price</TableHead>
                <TableHead className="text-right">Total</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Invoice</TableHead>
                <TableHead>Request Date</TableHead>
                <TableHead className="w-[70px]"></TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredAcquisitions.map((acq) => (
                <TableRow key={acq.id}>
                  <TableCell>
                    <div>
                      <p className="font-medium">{acq.title}</p>
                      <p className="text-sm text-muted-foreground">{acq.author}</p>
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center gap-2">
                      <Building className="h-4 w-4 text-muted-foreground" />
                      {acq.vendor}
                    </div>
                  </TableCell>
                  <TableCell className="text-center">{acq.quantity}</TableCell>
                  <TableCell className="text-right">{formatCurrency(acq.unitPrice)}</TableCell>
                  <TableCell className="text-right font-medium">{formatCurrency(acq.totalPrice)}</TableCell>
                  <TableCell>
                    <Badge className={cn("capitalize", statusColors[acq.status])}>{acq.status}</Badge>
                  </TableCell>
                  <TableCell>
                    {acq.invoiceNumber ? (
                      <div className="flex flex-col gap-1">
                        <span className="text-sm font-mono">{acq.invoiceNumber}</span>
                        {acq.invoicePaymentStatus && (
                          <Badge
                            variant={
                              acq.invoicePaymentStatus === "paid"
                                ? "default"
                                : acq.invoicePaymentStatus === "overdue"
                                  ? "destructive"
                                  : "secondary"
                            }
                            className="w-fit text-xs"
                          >
                            {acq.invoicePaymentStatus}
                          </Badge>
                        )}
                      </div>
                    ) : (
                      <span className="text-sm text-muted-foreground">-</span>
                    )}
                  </TableCell>
                  <TableCell className="text-muted-foreground">
                    {new Date(acq.requestDate).toLocaleDateString()}
                  </TableCell>
                  <TableCell>
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="icon">
                          <MoreHorizontal className="h-4 w-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem onClick={() => handleViewDetails(acq)}>
                          <Eye className="mr-2 h-4 w-4" />
                          View Details
                        </DropdownMenuItem>
                        {acq.status === "requested" && (
                          <DropdownMenuItem onClick={() => handleStatusChange(acq.id, "approved")}>
                            Mark as Approved
                          </DropdownMenuItem>
                        )}
                        {acq.status === "approved" && (
                          <DropdownMenuItem onClick={() => handleStatusChange(acq.id, "ordered")}>
                            Mark as Ordered
                          </DropdownMenuItem>
                        )}
                        {acq.status === "ordered" && (
                          <DropdownMenuItem onClick={() => handleStatusChange(acq.id, "received")}>
                            Mark as Received
                          </DropdownMenuItem>
                        )}
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      </div>

      {/* Add Acquisition Dialog */}
      <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <ShoppingCart className="h-5 w-5" />
              New Acquisition Request
            </DialogTitle>
            <DialogDescription>Submit a request to purchase new books</DialogDescription>
          </DialogHeader>
          <form onSubmit={handleAddAcquisition}>
            <div className="grid gap-4 py-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="title">Book Title *</Label>
                  <Input
                    id="title"
                    value={newAcquisition.title}
                    onChange={(e) => setNewAcquisition({ ...newAcquisition, title: e.target.value })}
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="author">Author *</Label>
                  <Input
                    id="author"
                    value={newAcquisition.author}
                    onChange={(e) => setNewAcquisition({ ...newAcquisition, author: e.target.value })}
                    required
                  />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="isbn">ISBN</Label>
                  <Input
                    id="isbn"
                    value={newAcquisition.isbn}
                    onChange={(e) => setNewAcquisition({ ...newAcquisition, isbn: e.target.value })}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="vendor">Vendor *</Label>
                  <Select
                    value={newAcquisition.vendor}
                    onValueChange={(value) => setNewAcquisition({ ...newAcquisition, vendor: value })}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select vendor" />
                    </SelectTrigger>
                    <SelectContent>
                      {vendors.map((v) => (
                        <SelectItem key={v} value={v}>
                          {v}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="quantity">Quantity *</Label>
                  <Input
                    id="quantity"
                    type="number"
                    min="1"
                    value={newAcquisition.quantity}
                    onChange={(e) => setNewAcquisition({ ...newAcquisition, quantity: Number(e.target.value) })}
                    required
                  />
                </div>
              <div className="space-y-2">
                <Label htmlFor="unitPrice">Unit Price (Rs.) *</Label>
                  <Input
                    id="unitPrice"
                    type="number"
                    min="0"
                    step="0.01"
                    value={newAcquisition.unitPrice}
                    onChange={(e) => setNewAcquisition({ ...newAcquisition, unitPrice: Number(e.target.value) })}
                    required
                  />
                </div>
              </div>
              <div className="space-y-2">
                <Label htmlFor="notes">Notes</Label>
                <Textarea
                  id="notes"
                  value={newAcquisition.notes}
                  onChange={(e) => setNewAcquisition({ ...newAcquisition, notes: e.target.value })}
                  placeholder="Any additional notes..."
                />
              </div>
            </div>
            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setIsAddDialogOpen(false)}>
                Cancel
              </Button>
              <Button type="submit">Submit Request</Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Acquisition Detail Dialog */}
      <Dialog open={isDetailDialogOpen} onOpenChange={setIsDetailDialogOpen}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <FileText className="h-5 w-5" />
              Acquisition Details
            </DialogTitle>
            <DialogDescription>
              {selectedAcquisition && `View details for ${selectedAcquisition.title}`}
            </DialogDescription>
          </DialogHeader>
          {selectedAcquisition && (
            <div className="space-y-6 py-4">
              {/* Book Information */}
              <div className="space-y-4">
                <h3 className="font-semibold">Book Information</h3>
                <div className="grid gap-4 sm:grid-cols-2">
                  <div>
                    <Label className="text-muted-foreground">Title</Label>
                    <p className="font-medium">{selectedAcquisition.title}</p>
                  </div>
                  <div>
                    <Label className="text-muted-foreground">Author</Label>
                    <p className="font-medium">{selectedAcquisition.author}</p>
                  </div>
                  <div>
                    <Label className="text-muted-foreground">ISBN</Label>
                    <p className="font-mono text-sm">{selectedAcquisition.isbn}</p>
                  </div>
                  <div>
                    <Label className="text-muted-foreground">Vendor</Label>
                    <p className="font-medium">{selectedAcquisition.vendor}</p>
                  </div>
                  <div>
                    <Label className="text-muted-foreground">Quantity</Label>
                    <p className="font-medium">{selectedAcquisition.quantity}</p>
                  </div>
                  <div>
                    <Label className="text-muted-foreground">Unit Price</Label>
                    <p className="font-medium">{formatCurrency(selectedAcquisition.unitPrice)}</p>
                  </div>
                </div>
                <div className="rounded-lg border p-4 bg-muted/50">
                  <div className="flex justify-between items-center">
                    <span className="font-semibold">Total Price</span>
                    <span className="text-2xl font-bold">{formatCurrency(selectedAcquisition.totalPrice)}</span>
                  </div>
                </div>
              </div>

              {/* Status Timeline */}
              <div className="space-y-4">
                <h3 className="font-semibold">Status Timeline</h3>
                <div className="space-y-2">
                  <div className="flex items-center gap-2">
                    <CheckCircle className="h-4 w-4 text-green-600" />
                    <span className="text-sm">Requested: {new Date(selectedAcquisition.requestDate).toLocaleDateString()}</span>
                  </div>
                  {selectedAcquisition.orderDate && (
                    <div className="flex items-center gap-2">
                      <CheckCircle className="h-4 w-4 text-blue-600" />
                      <span className="text-sm">Ordered: {new Date(selectedAcquisition.orderDate).toLocaleDateString()}</span>
                    </div>
                  )}
                  {selectedAcquisition.receivedDate && (
                    <div className="flex items-center gap-2">
                      <CheckCircle className="h-4 w-4 text-green-600" />
                      <span className="text-sm">Received: {new Date(selectedAcquisition.receivedDate).toLocaleDateString()}</span>
                    </div>
                  )}
                </div>
              </div>

              {/* Invoice Information */}
              {selectedAcquisition.invoiceNumber && (
                <div className="space-y-4">
                  <h3 className="font-semibold">Invoice Information</h3>
                  <div className="rounded-lg border p-4 space-y-3">
                    <div className="grid gap-4 sm:grid-cols-2">
                      <div>
                        <Label className="text-muted-foreground">Invoice Number</Label>
                        <p className="font-mono font-medium">{selectedAcquisition.invoiceNumber}</p>
                      </div>
                      <div>
                        <Label className="text-muted-foreground">Invoice Date</Label>
                        <p className="font-medium">
                          {selectedAcquisition.invoiceDate
                            ? new Date(selectedAcquisition.invoiceDate).toLocaleDateString()
                            : "-"}
                        </p>
                      </div>
                      <div>
                        <Label className="text-muted-foreground">Due Date</Label>
                        <p className="font-medium">
                          {selectedAcquisition.invoiceDueDate
                            ? new Date(selectedAcquisition.invoiceDueDate).toLocaleDateString()
                            : "-"}
                        </p>
                      </div>
                      <div>
                        <Label className="text-muted-foreground">Payment Status</Label>
                        <Badge
                          variant={
                            selectedAcquisition.invoicePaymentStatus === "paid"
                              ? "default"
                              : selectedAcquisition.invoicePaymentStatus === "overdue"
                                ? "destructive"
                                : "secondary"
                          }
                        >
                          {selectedAcquisition.invoicePaymentStatus || "pending"}
                        </Badge>
                      </div>
                      {selectedAcquisition.invoicePaymentDate && (
                        <div>
                          <Label className="text-muted-foreground">Payment Date</Label>
                          <p className="font-medium">
                            {new Date(selectedAcquisition.invoicePaymentDate).toLocaleDateString()}
                          </p>
                        </div>
                      )}
                      {selectedAcquisition.invoicePaymentMethod && (
                        <div>
                          <Label className="text-muted-foreground">Payment Method</Label>
                          <p className="font-medium capitalize">{selectedAcquisition.invoicePaymentMethod}</p>
                        </div>
                      )}
                    </div>
                    {selectedAcquisition.invoicePaymentStatus === "pending" && (
                      <div className="pt-4 border-t">
                        <p className="text-sm text-muted-foreground mb-2">Mark invoice as paid:</p>
                        <div className="flex gap-2">
                          {(["card", "cash", "check", "transfer"] as const).map((method) => (
                            <Button
                              key={method}
                              size="sm"
                              variant="outline"
                              onClick={() => handleInvoicePayment(selectedAcquisition.id, method)}
                            >
                              {method.charAt(0).toUpperCase() + method.slice(1)}
                            </Button>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              )}

              {selectedAcquisition.notes && (
                <div className="space-y-2">
                  <Label className="text-muted-foreground">Notes</Label>
                  <p className="text-sm">{selectedAcquisition.notes}</p>
                </div>
              )}
            </div>
          )}
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsDetailDialogOpen(false)}>
              Close
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Quote Comparison Dialog */}
      <Dialog open={isQuoteComparisonOpen} onOpenChange={setIsQuoteComparisonOpen}>
        <DialogContent className="max-w-6xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Scale className="h-5 w-5" />
              Compare Vendor Quotes
            </DialogTitle>
            <DialogDescription>
              {selectedAcquisition && `Compare quotes for ${selectedAcquisition.title}`}
            </DialogDescription>
          </DialogHeader>
          {selectedAcquisition && (
            <VendorQuoteComparison
              acquisitionId={selectedAcquisition.id}
              quotes={quotes.filter((q) => q.acquisitionId === selectedAcquisition.id)}
              onSelectQuote={handleSelectQuote}
              onRequestQuote={handleRequestQuote}
            />
          )}
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsQuoteComparisonOpen(false)}>
              Close
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
