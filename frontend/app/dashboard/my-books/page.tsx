"use client"

import { useState, useMemo } from "react"
import Link from "next/link"
import { Header } from "@/components/header"
import { useAuth } from "@/lib/auth-context"
import { mockTransactions, mockReservations } from "@/lib/mock-data"
import { calculateFine, getDaysUntilDue, formatCurrency, canRenew } from "@/lib/circulation-utils"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Progress } from "@/components/ui/progress"
import { BookOpen, Clock, AlertTriangle, BookMarked, RefreshCw, DollarSign, Users } from "lucide-react"
import { cn } from "@/lib/utils"
import { toast } from "sonner"

export default function MyBooksPage() {
  const { user } = useAuth()

  const [transactions, setTransactions] = useState(
    mockTransactions.filter((t) => t.userId === user?.id || t.userId === "3"),
  )
  const [reservations] = useState(mockReservations.filter((r) => r.userId === user?.id || r.userId === "3"))

  const currentLoans = useMemo(
    () => transactions.filter((t) => t.status === "active" || t.status === "overdue"),
    [transactions],
  )

  const totalFines = useMemo(
    () => currentLoans.reduce((acc, loan) => acc + calculateFine(loan.dueDate), 0),
    [currentLoans],
  )

  const handleRenew = (transactionId: string, bookId: string) => {
    // Check if book has active reservations/holds
    const bookReservations = reservations.filter((r) => r.bookId === bookId && r.status === "pending")
    if (bookReservations.length > 0) {
      toast.error(`Cannot renew: This book has ${bookReservations.length} hold(s) waiting. Please return it.`)
      return
    }

    const transaction = transactions.find((t) => t.id === transactionId)
    if (!transaction) return

    if (!canRenew(transaction.renewCount, bookReservations.length > 0)) {
      toast.error("Cannot renew: Maximum renewals reached or book has holds")
      return
    }

    setTransactions(
      transactions.map((t) => {
        if (t.id === transactionId) {
          const newDueDate = new Date(t.dueDate)
          newDueDate.setDate(newDueDate.getDate() + 14)
          return { ...t, dueDate: newDueDate.toISOString().split("T")[0], renewCount: t.renewCount + 1 }
        }
        return t
      }),
    )
    toast.success("Book renewed for another 14 days")
  }

  const borrowingLimit = user?.borrowingLimit || 5
  const currentBorrows = currentLoans.length
  const borrowingProgress = (currentBorrows / borrowingLimit) * 100

  return (
    <div className="min-h-screen">
      <Header title="My Books" subtitle="Manage your borrowed books and reservations" />

      <div className="p-6">
        {/* Summary Cards */}
        <div className="mb-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center gap-4">
                <div className="rounded-lg bg-primary/10 p-3">
                  <BookOpen className="h-6 w-6 text-primary" />
                </div>
                <div className="flex-1">
                  <p className="text-2xl font-bold">
                    {currentBorrows}/{borrowingLimit}
                  </p>
                  <p className="text-sm text-muted-foreground">Books Borrowed</p>
                  <Progress value={borrowingProgress} className="mt-2 h-2" />
                </div>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="flex items-center gap-4 p-4">
              <div className="rounded-lg bg-amber-100 p-3">
                <Clock className="h-6 w-6 text-amber-600" />
              </div>
              <div>
                <p className="text-2xl font-bold">
                  {currentLoans.filter((l) => getDaysUntilDue(l.dueDate) <= 3 && getDaysUntilDue(l.dueDate) > 0).length}
                </p>
                <p className="text-sm text-muted-foreground">Due Soon</p>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="flex items-center gap-4 p-4">
              <div className="rounded-lg bg-blue-100 p-3">
                <BookMarked className="h-6 w-6 text-blue-600" />
              </div>
              <div>
                <p className="text-2xl font-bold">{reservations.filter((r) => r.status === "pending").length}</p>
                <p className="text-sm text-muted-foreground">Reservations</p>
              </div>
            </CardContent>
          </Card>
          <Card className={cn(totalFines > 0 && "border-destructive/50")}>
            <CardContent className="flex items-center gap-4 p-4">
              <div className={cn("rounded-lg p-3", totalFines > 0 ? "bg-red-100" : "bg-green-100")}>
                <DollarSign className={cn("h-6 w-6", totalFines > 0 ? "text-red-600" : "text-green-600")} />
              </div>
              <div>
                <p className={cn("text-2xl font-bold", totalFines > 0 && "text-destructive")}>
                  {formatCurrency(totalFines)}
                </p>
                <p className="text-sm text-muted-foreground">Outstanding Fines</p>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Tabs */}
        <Tabs defaultValue="current" className="space-y-4">
          <TabsList>
            <TabsTrigger value="current">Current Loans ({currentLoans.length})</TabsTrigger>
            <TabsTrigger value="reservations">Reservations ({reservations.length})</TabsTrigger>
          </TabsList>

          <TabsContent value="current" className="space-y-4">
            {currentLoans.length === 0 ? (
              <Card>
                <CardContent className="flex flex-col items-center justify-center py-12">
                  <BookOpen className="h-12 w-12 text-muted-foreground/50" />
                  <h3 className="mt-4 text-lg font-semibold">No books borrowed</h3>
                  <p className="mt-2 text-sm text-muted-foreground">Visit the catalog to borrow your first book</p>
                  <Link href="/dashboard/catalog">
                    <Button className="mt-4">Browse Catalog</Button>
                  </Link>
                </CardContent>
              </Card>
            ) : (
              currentLoans.map((loan) => {
                const daysLeft = getDaysUntilDue(loan.dueDate)
                const fine = calculateFine(loan.dueDate)
                const isOverdue = daysLeft < 0
                const isDueSoon = daysLeft <= 3 && daysLeft > 0
                const bookReservations = reservations.filter((r) => r.bookId === loan.bookId && r.status === "pending")
                const hasHolds = bookReservations.length > 0
                const canRenewBook = canRenew(loan.renewCount, hasHolds)

                return (
                  <Card key={loan.id} className={cn(isOverdue && "border-destructive/50")}>
                    <CardContent className="p-4">
                      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                        <div className="flex-1">
                          <div className="flex items-start gap-3">
                            <div className="rounded-lg bg-primary/10 p-2">
                              <BookOpen className="h-5 w-5 text-primary" />
                            </div>
                            <div>
                              <h3 className="font-semibold">{loan.bookTitle}</h3>
                              <p className="text-sm text-muted-foreground">
                                Borrowed: {new Date(loan.issueDate).toLocaleDateString()}
                              </p>
                              {hasHolds && (
                                <Badge variant="outline" className="mt-1 bg-amber-50 text-amber-700 border-amber-200">
                                  <Users className="h-3 w-3 mr-1" />
                                  {bookReservations.length} hold(s) waiting
                                </Badge>
                              )}
                            </div>
                          </div>
                        </div>

                        <div className="flex flex-wrap items-center gap-4">
                          <div className="text-right">
                            <p className="text-sm text-muted-foreground">Due Date</p>
                            <p className={cn("font-medium", isOverdue && "text-destructive")}>
                              {new Date(loan.dueDate).toLocaleDateString()}
                            </p>
                          </div>

                          <div>
                            {isOverdue ? (
                              <Badge className="bg-red-100 text-red-800">
                                <AlertTriangle className="mr-1 h-3 w-3" />
                                {Math.abs(daysLeft)} days overdue
                              </Badge>
                            ) : isDueSoon ? (
                              <Badge className="bg-amber-100 text-amber-800">
                                <Clock className="mr-1 h-3 w-3" />
                                {daysLeft} days left
                              </Badge>
                            ) : (
                              <Badge className="bg-green-100 text-green-800">{daysLeft} days left</Badge>
                            )}
                          </div>

                          {fine > 0 && (
                            <div className="text-right">
                              <p className="text-sm text-muted-foreground">Fine</p>
                              <p className="font-medium text-destructive">{formatCurrency(fine)}</p>
                            </div>
                          )}

                          <div className="flex flex-col gap-1">
                            <Button
                              variant="outline"
                              size="sm"
                              disabled={!canRenewBook}
                              onClick={() => handleRenew(loan.id, loan.bookId)}
                              className="bg-transparent"
                            >
                              <RefreshCw className="mr-2 h-4 w-4" />
                              Renew ({2 - loan.renewCount} left)
                            </Button>
                            {hasHolds && (
                              <p className="text-xs text-amber-600 text-center">
                                Cannot renew: holds waiting
                              </p>
                            )}
                          </div>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                )
              })
            )}
          </TabsContent>

          <TabsContent value="reservations" className="space-y-4">
            {reservations.length === 0 ? (
              <Card>
                <CardContent className="flex flex-col items-center justify-center py-12">
                  <BookMarked className="h-12 w-12 text-muted-foreground/50" />
                  <h3 className="mt-4 text-lg font-semibold">No reservations</h3>
                  <p className="mt-2 text-sm text-muted-foreground">Reserve books that are currently unavailable</p>
                </CardContent>
              </Card>
            ) : (
              reservations.map((res) => (
                <Card key={res.id}>
                  <CardContent className="p-4">
                    <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                      <div className="flex items-start gap-3">
                        <div className="rounded-lg bg-blue-100 p-2">
                          <BookMarked className="h-5 w-5 text-blue-600" />
                        </div>
                        <div>
                          <h3 className="font-semibold">{res.bookTitle}</h3>
                          <p className="text-sm text-muted-foreground">
                            Reserved: {new Date(res.reserveDate).toLocaleDateString()}
                          </p>
                        </div>
                      </div>

                      <div className="flex items-center gap-4">
                        <div className="text-right">
                          <p className="text-sm text-muted-foreground">Queue Position</p>
                          <p className="font-medium">#{res.queuePosition}</p>
                        </div>
                        <Badge
                          className={cn(
                            res.status === "ready"
                              ? "bg-green-100 text-green-800"
                              : res.status === "pending"
                                ? "bg-amber-100 text-amber-800"
                                : "bg-gray-100 text-gray-800",
                          )}
                        >
                          {res.status === "ready" ? "Ready for Pickup" : res.status}
                        </Badge>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))
            )}
          </TabsContent>
        </Tabs>
      </div>
    </div>
  )
}
