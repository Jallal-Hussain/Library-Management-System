"use client"

import { useState, useMemo } from "react"
import { Header } from "@/components/header"
import { ConfirmDialog } from "@/components/confirm-dialog"
import { mockTransactions, mockBooks, mockUsers } from "@/lib/mock-data"
import { MAX_BOOKS_PATRON, MAX_FINE_THRESHOLD, formatCurrency, CURRENCY_SYMBOL } from "@/lib/circulation-utils"
import { isMembershipExpired } from "@/lib/membership-utils"
import type { Transaction } from "@/lib/types"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Label } from "@/components/ui/label"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"
import {
  Plus,
  Search,
  MoreHorizontal,
  RotateCcw,
  RefreshCw,
  AlertTriangle,
  ArrowLeftRight,
  BookOpen,
  Clock,
  DollarSign,
} from "lucide-react"
import { cn } from "@/lib/utils"
import { toast } from "sonner"
import { DateRangePicker, type DateRangeValue } from "@/components/date-range-picker"
import { canCheckout } from "@/lib/circulation-utils"
import { getLoanPeriod } from "@/lib/circulation-utils"

export default function CirculationPage() {
  const [transactions, setTransactions] = useState<Transaction[]>(mockTransactions)
  const [searchQuery, setSearchQuery] = useState("")
  const [statusFilter, setStatusFilter] = useState<string>("all")
  const [dateRange, setDateRange] = useState<DateRangeValue>({ preset: "30d" })
  const [isIssueDialogOpen, setIsIssueDialogOpen] = useState(false)
  const [selectedBook, setSelectedBook] = useState("")
  const [selectedMember, setSelectedMember] = useState("")
  const [isReturnConfirmOpen, setIsReturnConfirmOpen] = useState(false)
  const [transactionToReturn, setTransactionToReturn] = useState<Transaction | null>(null)

  const filteredTransactions = useMemo(() => {
    const isInRange = (dateStr: string) => {
      if (dateRange.preset === "all") return true
      const date = new Date(dateStr)
      if (Number.isNaN(date.getTime())) return true

      const now = new Date()
      let start: Date | null = null

      switch (dateRange.preset) {
        case "7d":
          start = new Date(now)
          start.setDate(now.getDate() - 7)
          break
        case "30d":
          start = new Date(now)
          start.setDate(now.getDate() - 30)
          break
        case "90d":
          start = new Date(now)
          start.setDate(now.getDate() - 90)
          break
        case "180d":
          start = new Date(now)
          start.setDate(now.getDate() - 180)
          break
        case "365d":
          start = new Date(now)
          start.setDate(now.getDate() - 365)
          break
        case "custom":
          if (dateRange.start) {
            start = new Date(dateRange.start)
          }
          if (dateRange.end) {
            const end = new Date(dateRange.end)
            if (date > end) return false
          }
          break
        default:
          break
      }

      return start ? date >= start : true
    }

    return transactions.filter((tx) => {
      const matchesSearch =
        tx.bookTitle.toLowerCase().includes(searchQuery.toLowerCase()) ||
        tx.userName.toLowerCase().includes(searchQuery.toLowerCase())

      const matchesStatus = statusFilter === "all" || tx.status === statusFilter
      const matchesDate = isInRange(tx.issueDate)

      return matchesSearch && matchesStatus && matchesDate
    })
  }, [transactions, searchQuery, statusFilter, dateRange])

  const stats = useMemo(
    () => ({
      active: transactions.filter((t) => t.status === "active").length,
      overdue: transactions.filter((t) => t.status === "overdue").length,
      returned: transactions.filter((t) => t.status === "returned").length,
      totalFines: transactions.reduce((acc, t) => acc + (t.finePaid ? 0 : t.fine), 0),
    }),
    [transactions],
  )

  const statusColors = {
    active: "bg-green-100 text-green-800",
    returned: "bg-blue-100 text-blue-800",
    overdue: "bg-red-100 text-red-800",
    lost: "bg-gray-100 text-gray-800",
  }

  const handleReturn = (transaction: Transaction) => {
    setTransactionToReturn(transaction)
    setIsReturnConfirmOpen(true)
  }

  const confirmReturn = () => {
    if (!transactionToReturn) return
    setTransactions(
      transactions.map((t) =>
        t.id === transactionToReturn.id
          ? { ...t, status: "returned", returnDate: new Date().toISOString().split("T")[0] }
          : t,
      ),
    )
    toast.success(`"${transactionToReturn.bookTitle}" has been returned`)
    setIsReturnConfirmOpen(false)
    setTransactionToReturn(null)
  }

  const handleRenew = (transaction: Transaction) => {
    if (transaction.renewCount >= 2) {
      toast.error("Maximum renewals reached")
      return
    }
    const newDueDate = new Date()
    newDueDate.setDate(newDueDate.getDate() + 14)
    setTransactions(
      transactions.map((t) =>
        t.id === transaction.id
          ? { ...t, dueDate: newDueDate.toISOString().split("T")[0], renewCount: t.renewCount + 1 }
          : t,
      ),
    )
    toast.success(`Renewed until ${newDueDate.toLocaleDateString()}`)
  }

  const handleMarkLost = (transaction: Transaction) => {
    setTransactions(transactions.map((t) => (t.id === transaction.id ? { ...t, status: "lost", fine: 25 } : t)))
    toast.success(`"${transaction.bookTitle}" marked as lost. Fine of ${formatCurrency(25)} applied.`)
  }

  const handleIssueBook = () => {
    if (!selectedBook || !selectedMember) {
      toast.error("Please select both a book and a member")
      return
    }

    const book = mockBooks.find((b) => b.id === selectedBook)
    const member = mockUsers.find((u) => u.id === selectedMember)

    if (!book || !member) return

    // Check if checkout is allowed (includes borrowing limit, fines, etc.)
    const checkoutCheck = canCheckout(member)
    if (!checkoutCheck.allowed) {
      toast.error(checkoutCheck.reason || "Cannot checkout books")
      return
    }

    // Check if member has overdue books
    const hasOverdue = transactions.some((t) => t.userId === member.id && t.status === "overdue")
    if (hasOverdue) {
      toast.error(`${member.name} has overdue books. Please return them before issuing new books.`)
      return
    }

    // Check if membership is expired
    if (isMembershipExpired(member.membershipExpiry)) {
      toast.error(`${member.name}'s membership has expired. Please renew membership before issuing books.`)
      return
    }

    const newTransaction: Transaction = {
      id: String(Date.now()),
      userId: member.id,
      userName: member.name,
      bookId: book.id,
      bookTitle: book.title,
      type: "borrow",
      status: "active",
      issueDate: new Date().toISOString().split("T")[0],
      dueDate: (() => {
        const loanPeriod = getLoanPeriod(member.role)
        const dueDate = new Date()
        dueDate.setDate(dueDate.getDate() + loanPeriod)
        return dueDate.toISOString().split("T")[0]
      })(),
      renewCount: 0,
      fine: 0,
      finePaid: false,
    }

    setTransactions([newTransaction, ...transactions])
    setIsIssueDialogOpen(false)
    setSelectedBook("")
    setSelectedMember("")
    toast.success(`"${book.title}" issued to ${member.name}`)
  }

  const availableBooks = mockBooks.filter((b) => b.availableCopies > 0)

  return (
    <div className="min-h-screen">
      <Header title="Circulation" subtitle="Manage book check-outs and returns" />

      <div className="p-6">
        {/* Stats */}
        <div className="mb-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <Card>
            <CardContent className="flex items-center gap-4 p-4">
              <div className="rounded-lg bg-green-100 p-3">
                <BookOpen className="h-6 w-6 text-green-600" />
              </div>
              <div>
                <p className="text-2xl font-bold">{stats.active}</p>
                <p className="text-sm text-muted-foreground">Active Loans</p>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="flex items-center gap-4 p-4">
              <div className="rounded-lg bg-red-100 p-3">
                <AlertTriangle className="h-6 w-6 text-red-600" />
              </div>
              <div>
                <p className="text-2xl font-bold">{stats.overdue}</p>
                <p className="text-sm text-muted-foreground">Overdue</p>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="flex items-center gap-4 p-4">
              <div className="rounded-lg bg-blue-100 p-3">
                <Clock className="h-6 w-6 text-blue-600" />
              </div>
              <div>
                <p className="text-2xl font-bold">{stats.returned}</p>
                <p className="text-sm text-muted-foreground">Returned Today</p>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="flex items-center gap-4 p-4">
              <div className="rounded-lg bg-amber-100 p-3">
                <DollarSign className="h-6 w-6 text-amber-600" />
              </div>
              <div>
                <p className="text-2xl font-bold">{formatCurrency(stats.totalFines)}</p>
                <p className="text-sm text-muted-foreground">Pending Fines</p>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Filters */}
        <Card className="mb-6">
          <CardContent className="p-4 space-y-4">
            <div className="flex flex-wrap items-center gap-4">
              <div className="relative flex-1 min-w-[200px]">
                <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                <Input
                  placeholder="Search by book or member..."
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
                  <SelectItem value="active">Active</SelectItem>
                  <SelectItem value="overdue">Overdue</SelectItem>
                  <SelectItem value="returned">Returned</SelectItem>
                  <SelectItem value="lost">Lost</SelectItem>
                </SelectContent>
              </Select>

              <Button onClick={() => setIsIssueDialogOpen(true)}>
                <Plus className="mr-2 h-4 w-4" />
                Issue Book
              </Button>
            </div>

            <DateRangePicker value={dateRange} onChange={setDateRange} />
          </CardContent>
        </Card>

        {/* Transactions Table */}
        <div className="rounded-lg border bg-card">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-[250px]">Book</TableHead>
                <TableHead>Member</TableHead>
                <TableHead>Issue Date</TableHead>
                <TableHead>Due Date</TableHead>
                <TableHead>Renewals</TableHead>
                <TableHead>Fine</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="w-[70px]"></TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredTransactions.map((tx) => (
                <TableRow key={tx.id}>
                  <TableCell className="font-medium">{tx.bookTitle}</TableCell>
                  <TableCell>{tx.userName}</TableCell>
                  <TableCell className="text-muted-foreground">{new Date(tx.issueDate).toLocaleDateString()}</TableCell>
                  <TableCell className={cn(tx.status === "overdue" && "text-destructive font-medium")}>
                    {new Date(tx.dueDate).toLocaleDateString()}
                  </TableCell>
                  <TableCell>
                    <span className="font-medium">{tx.renewCount}</span>
                    <span className="text-muted-foreground"> / 2</span>
                  </TableCell>
                  <TableCell>
                    {tx.fine > 0 ? (
                      <span className="font-medium text-destructive">{formatCurrency(tx.fine)}</span>
                    ) : (
                      <span className="text-muted-foreground">-</span>
                    )}
                  </TableCell>
                  <TableCell>
                    <Badge className={cn("capitalize", statusColors[tx.status])}>{tx.status}</Badge>
                  </TableCell>
                  <TableCell>
                    {tx.status !== "returned" && tx.status !== "lost" && (
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="icon">
                            <MoreHorizontal className="h-4 w-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem onClick={() => handleReturn(tx)}>
                            <RotateCcw className="mr-2 h-4 w-4" />
                            Return Book
                          </DropdownMenuItem>
                          <DropdownMenuItem onClick={() => handleRenew(tx)} disabled={tx.renewCount >= 2}>
                            <RefreshCw className="mr-2 h-4 w-4" />
                            Renew ({2 - tx.renewCount} left)
                          </DropdownMenuItem>
                          <DropdownMenuItem onClick={() => handleMarkLost(tx)} className="text-destructive">
                            <AlertTriangle className="mr-2 h-4 w-4" />
                            Mark as Lost
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    )}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      </div>

      {/* Issue Book Dialog */}
      <Dialog open={isIssueDialogOpen} onOpenChange={setIsIssueDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <ArrowLeftRight className="h-5 w-5" />
              Issue Book
            </DialogTitle>
            <DialogDescription>Select a book and member to create a new loan.</DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="space-y-2">
              <Label>Book</Label>
              <Select value={selectedBook} onValueChange={setSelectedBook}>
                <SelectTrigger>
                  <SelectValue placeholder="Select a book" />
                </SelectTrigger>
                <SelectContent>
                  {availableBooks.map((book) => (
                    <SelectItem key={book.id} value={book.id}>
                      {book.title} ({book.availableCopies} available)
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Member</Label>
              <Select value={selectedMember} onValueChange={setSelectedMember}>
                <SelectTrigger>
                  <SelectValue placeholder="Select a member" />
                </SelectTrigger>
                <SelectContent>
                  {mockUsers
                    .filter((u) => u.role === "patron")
                    .map((user) => (
                      <SelectItem key={user.id} value={user.id}>
                        {user.name} ({user.currentBorrows}/{user.borrowingLimit} books)
                      </SelectItem>
                    ))}
                </SelectContent>
              </Select>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsIssueDialogOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleIssueBook}>Issue Book</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Return Confirmation Dialog */}
      <ConfirmDialog
        open={isReturnConfirmOpen}
        onOpenChange={setIsReturnConfirmOpen}
        title="Confirm Book Return"
        description={`Are you sure you want to mark "${transactionToReturn?.bookTitle}" as returned?${
          transactionToReturn?.fine && transactionToReturn.fine > 0
            ? ` This book has an outstanding fine of ${formatCurrency(transactionToReturn.fine)}.`
            : ""
        }`}
        confirmLabel="Return Book"
        type="info"
        icon="refresh"
        onConfirm={confirmReturn}
      />
    </div>
  )
}
