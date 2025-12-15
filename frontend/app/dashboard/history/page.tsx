"use client"

import { useState } from "react"
import { Header } from "@/components/header"
import { useAuth } from "@/lib/auth-context"
import { mockTransactions } from "@/lib/mock-data"
import { formatCurrency } from "@/lib/circulation-utils"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Search, BookOpen, Calendar, History } from "lucide-react"
import { cn } from "@/lib/utils"

export default function HistoryPage() {
  const { user } = useAuth()
  const [searchQuery, setSearchQuery] = useState("")
  const [yearFilter, setYearFilter] = useState<string>("all")

  // Get all transactions for this user (including returned ones)
  const allTransactions = mockTransactions.filter((t) => t.userId === user?.id || t.userId === "3")

  const filteredTransactions = allTransactions.filter((tx) => {
    const matchesSearch = tx.bookTitle.toLowerCase().includes(searchQuery.toLowerCase())
    const matchesYear = yearFilter === "all" || new Date(tx.issueDate).getFullYear().toString() === yearFilter
    return matchesSearch && matchesYear
  })

  const statusColors = {
    active: "bg-green-100 text-green-800",
    returned: "bg-blue-100 text-blue-800",
    overdue: "bg-red-100 text-red-800",
    lost: "bg-gray-100 text-gray-800",
  }

  const stats = {
    totalBorrowed: allTransactions.length,
    returned: allTransactions.filter((t) => t.status === "returned").length,
    totalFinesPaid: allTransactions.filter((t) => t.finePaid).reduce((acc, t) => acc + t.fine, 0),
  }

  return (
    <div className="min-h-screen">
      <Header title="Borrowing History" subtitle="View your complete borrowing history" />

      <div className="p-6">
        {/* Stats */}
        <div className="mb-6 grid gap-4 sm:grid-cols-3">
          <Card>
            <CardContent className="flex items-center gap-4 p-4">
              <div className="rounded-lg bg-primary/10 p-3">
                <BookOpen className="h-6 w-6 text-primary" />
              </div>
              <div>
                <p className="text-2xl font-bold">{stats.totalBorrowed}</p>
                <p className="text-sm text-muted-foreground">Total Borrowed</p>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="flex items-center gap-4 p-4">
              <div className="rounded-lg bg-green-100 p-3">
                <History className="h-6 w-6 text-green-600" />
              </div>
              <div>
                <p className="text-2xl font-bold">{stats.returned}</p>
                <p className="text-sm text-muted-foreground">Books Returned</p>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="flex items-center gap-4 p-4">
              <div className="rounded-lg bg-amber-100 p-3">
                <Calendar className="h-6 w-6 text-amber-600" />
              </div>
              <div>
                <p className="text-2xl font-bold">{formatCurrency(stats.totalFinesPaid)}</p>
                <p className="text-sm text-muted-foreground">Total Fines Paid</p>
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
                  placeholder="Search by book title..."
                  className="pl-9"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                />
              </div>
              <Select value={yearFilter} onValueChange={setYearFilter}>
                <SelectTrigger className="w-[150px]">
                  <SelectValue placeholder="Year" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Years</SelectItem>
                  <SelectItem value="2024">2024</SelectItem>
                  <SelectItem value="2023">2023</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </CardContent>
        </Card>

        {/* History Table */}
        <div className="rounded-lg border bg-card">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-[300px]">Book</TableHead>
                <TableHead>Issue Date</TableHead>
                <TableHead>Due Date</TableHead>
                <TableHead>Return Date</TableHead>
                <TableHead>Fine</TableHead>
                <TableHead>Status</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredTransactions.map((tx) => (
                <TableRow key={tx.id}>
                  <TableCell className="font-medium">{tx.bookTitle}</TableCell>
                  <TableCell className="text-muted-foreground">{new Date(tx.issueDate).toLocaleDateString()}</TableCell>
                  <TableCell className="text-muted-foreground">{new Date(tx.dueDate).toLocaleDateString()}</TableCell>
                  <TableCell className="text-muted-foreground">
                    {tx.returnDate ? new Date(tx.returnDate).toLocaleDateString() : "-"}
                  </TableCell>
                  <TableCell>
                    {tx.fine > 0 ? (
                      <span className={cn(tx.finePaid ? "text-muted-foreground" : "text-destructive font-medium")}>
                        {formatCurrency(tx.fine)}
                        {tx.finePaid && " (Paid)"}
                      </span>
                    ) : (
                      "-"
                    )}
                  </TableCell>
                  <TableCell>
                    <Badge className={cn("capitalize", statusColors[tx.status])}>{tx.status}</Badge>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      </div>
    </div>
  )
}
