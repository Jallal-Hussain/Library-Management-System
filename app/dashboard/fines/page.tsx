"use client"

import { useState, useMemo } from "react"
import { Header } from "@/components/header"
import { mockTransactions } from "@/lib/mock-data"
import { formatCurrency, calculateFine } from "@/lib/circulation-utils"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { Search, AlertTriangle, CheckCircle, CreditCard, Receipt, Clock } from "lucide-react"
import { cn } from "@/lib/utils"
import { toast } from "sonner"
import { PaymentGatewayForm } from "@/components/payment-gateway-form"

interface FineRecord {
  id: string
  memberId: string
  memberName: string
  bookTitle: string
  amount: number
  reason: string
  dateIssued: string
  dueDate: string
  isPaid: boolean
  paidDate?: string
}

export default function FinesPage() {
  const [searchQuery, setSearchQuery] = useState("")
  const [statusFilter, setStatusFilter] = useState<string>("all")
  const [isPaymentDialogOpen, setIsPaymentDialogOpen] = useState(false)
  const [selectedFine, setSelectedFine] = useState<FineRecord | null>(null)

  // Generate fine records from transactions
  const [fines, setFines] = useState<FineRecord[]>(() => {
    const fineRecords: FineRecord[] = []
    mockTransactions.forEach((tx) => {
      if (tx.fine > 0 || tx.status === "overdue") {
        const calculatedFine = tx.fine > 0 ? tx.fine : calculateFine(tx.dueDate)
        if (calculatedFine > 0) {
          fineRecords.push({
            id: `fine-${tx.id}`,
            memberId: tx.userId,
            memberName: tx.userName,
            bookTitle: tx.bookTitle,
            amount: calculatedFine,
            reason: "Overdue return",
            dateIssued: tx.dueDate,
            dueDate: tx.dueDate,
            isPaid: tx.finePaid,
          })
        }
      }
    })
    // Add some additional mock fines
    fineRecords.push({
      id: "fine-lost-1",
      memberId: "5",
      memberName: "Michael Brown",
      bookTitle: "The Catcher in the Rye",
      amount: 25.0,
      reason: "Lost book",
      dateIssued: "2024-11-20",
      dueDate: "2024-11-01",
      isPaid: false,
    })
    return fineRecords
  })

  const filteredFines = useMemo(() => {
    return fines.filter((fine) => {
      const matchesSearch =
        fine.memberName.toLowerCase().includes(searchQuery.toLowerCase()) ||
        fine.bookTitle.toLowerCase().includes(searchQuery.toLowerCase())
      const matchesStatus =
        statusFilter === "all" ||
        (statusFilter === "paid" && fine.isPaid) ||
        (statusFilter === "unpaid" && !fine.isPaid)
      return matchesSearch && matchesStatus
    })
  }, [fines, searchQuery, statusFilter])

  const stats = useMemo(
    () => ({
      totalUnpaid: fines.filter((f) => !f.isPaid).reduce((acc, f) => acc + f.amount, 0),
      totalCollected: fines.filter((f) => f.isPaid).reduce((acc, f) => acc + f.amount, 0),
      unpaidCount: fines.filter((f) => !f.isPaid).length,
      paidCount: fines.filter((f) => f.isPaid).length,
    }),
    [fines],
  )

  const handlePayFine = (fine: FineRecord) => {
    setSelectedFine(fine)
    setIsPaymentDialogOpen(true)
  }

  const handlePaymentComplete = (paymentData: {
    amount: number
    method: "card" | "cash" | "check" | "transfer"
    receiptNumber: string
  }) => {
    if (!selectedFine) return

    setFines(
      fines.map((f) =>
        f.id === selectedFine.id
          ? { ...f, isPaid: true, paidDate: new Date().toISOString().split("T")[0] }
          : f,
      ),
    )

    toast.success(`Payment processed! Receipt: ${paymentData.receiptNumber}`)
    setIsPaymentDialogOpen(false)
    setSelectedFine(null)
  }

  const getInitials = (name: string) => {
    return name
      .split(" ")
      .map((n) => n[0])
      .join("")
      .toUpperCase()
      .slice(0, 2)
  }

  return (
    <div className="min-h-screen">
      <Header title="Fine Management" subtitle="Track and process library fines" />

      <div className="p-6">
        {/* Stats */}
        <div className="mb-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <Card>
            <CardContent className="flex items-center gap-4 p-4">
              <div className="rounded-lg bg-red-100 p-3">
                <AlertTriangle className="h-6 w-6 text-red-600" />
              </div>
              <div>
                <p className="text-2xl font-bold text-destructive">{formatCurrency(stats.totalUnpaid)}</p>
                <p className="text-sm text-muted-foreground">Outstanding Fines</p>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="flex items-center gap-4 p-4">
              <div className="rounded-lg bg-green-100 p-3">
                <CheckCircle className="h-6 w-6 text-green-600" />
              </div>
              <div>
                <p className="text-2xl font-bold text-green-600">{formatCurrency(stats.totalCollected)}</p>
                <p className="text-sm text-muted-foreground">Collected This Month</p>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="flex items-center gap-4 p-4">
              <div className="rounded-lg bg-amber-100 p-3">
                <Clock className="h-6 w-6 text-amber-600" />
              </div>
              <div>
                <p className="text-2xl font-bold">{stats.unpaidCount}</p>
                <p className="text-sm text-muted-foreground">Pending Fines</p>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="flex items-center gap-4 p-4">
              <div className="rounded-lg bg-blue-100 p-3">
                <Receipt className="h-6 w-6 text-blue-600" />
              </div>
              <div>
                <p className="text-2xl font-bold">{stats.paidCount}</p>
                <p className="text-sm text-muted-foreground">Processed Today</p>
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
                  placeholder="Search by member or book..."
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
                  <SelectItem value="all">All Fines</SelectItem>
                  <SelectItem value="unpaid">Unpaid</SelectItem>
                  <SelectItem value="paid">Paid</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </CardContent>
        </Card>

        {/* Fines Table */}
        <Card>
          <CardHeader>
            <CardTitle>Fine Records</CardTitle>
            <CardDescription>View and process outstanding fines</CardDescription>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-[200px]">Member</TableHead>
                  <TableHead>Book</TableHead>
                  <TableHead>Reason</TableHead>
                  <TableHead>Date Issued</TableHead>
                  <TableHead className="text-right">Amount</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="w-[100px]"></TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredFines.map((fine) => (
                  <TableRow key={fine.id}>
                    <TableCell>
                      <div className="flex items-center gap-3">
                        <Avatar className="h-8 w-8">
                          <AvatarFallback className="bg-primary/10 text-primary text-xs">
                            {getInitials(fine.memberName)}
                          </AvatarFallback>
                        </Avatar>
                        <span className="font-medium">{fine.memberName}</span>
                      </div>
                    </TableCell>
                    <TableCell className="text-muted-foreground">{fine.bookTitle}</TableCell>
                    <TableCell>{fine.reason}</TableCell>
                    <TableCell className="text-muted-foreground">
                      {new Date(fine.dateIssued).toLocaleDateString()}
                    </TableCell>
                    <TableCell className={cn("text-right font-medium", !fine.isPaid && "text-destructive")}>
                      {formatCurrency(fine.amount)}
                    </TableCell>
                    <TableCell>
                      <Badge variant={fine.isPaid ? "default" : "destructive"}>{fine.isPaid ? "Paid" : "Unpaid"}</Badge>
                    </TableCell>
                    <TableCell>
                      {!fine.isPaid && (
                        <Button size="sm" onClick={() => handlePayFine(fine)}>
                          <CreditCard className="h-4 w-4 mr-1" />
                          Pay
                        </Button>
                      )}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      </div>

      {/* Payment Dialog */}
      <Dialog open={isPaymentDialogOpen} onOpenChange={setIsPaymentDialogOpen}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <CreditCard className="h-5 w-5" />
              Process Fine Payment
            </DialogTitle>
            <DialogDescription>
              {selectedFine && `Paying fine for ${selectedFine.memberName} - ${selectedFine.bookTitle}`}
            </DialogDescription>
          </DialogHeader>
          {selectedFine && (
            <PaymentGatewayForm
              amount={selectedFine.amount}
              onPaymentComplete={handlePaymentComplete}
              onCancel={() => {
                setIsPaymentDialogOpen(false)
                setSelectedFine(null)
              }}
            />
          )}
        </DialogContent>
      </Dialog>
    </div>
  )
}
