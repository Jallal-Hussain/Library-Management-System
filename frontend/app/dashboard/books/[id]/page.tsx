"use client"

import { useState, useEffect } from "react"
import { useParams, useRouter } from "next/navigation"
import Image from "next/image"
import { Header } from "@/components/header"
import { useAuth } from "@/lib/auth-context"
import { mockBooks, mockTransactions, mockReservations } from "@/lib/mock-data"
import type { Book, Transaction, Reservation } from "@/lib/types"
import { calculateFine, getDaysUntilDue, formatCurrency, LOAN_PERIOD_DAYS } from "@/lib/circulation-utils"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Separator } from "@/components/ui/separator"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import {
  ArrowLeft,
  BookOpen,
  MapPin,
  Calendar,
  Hash,
  Building,
  Tag,
  Clock,
  Users,
  BookMarked,
  AlertTriangle,
} from "lucide-react"
import { cn } from "@/lib/utils"
import { toast } from "sonner"

export default function BookDetailPage() {
  const params = useParams()
  const router = useRouter()
  const { user, hasRole } = useAuth()
  const isAdmin = hasRole(["admin", "librarian"])

  const [book, setBook] = useState<Book | null>(null)
  const [transactions, setTransactions] = useState<Transaction[]>([])
  const [reservations, setReservations] = useState<Reservation[]>([])
  const [isBorrowDialogOpen, setIsBorrowDialogOpen] = useState(false)
  const [isReserveDialogOpen, setIsReserveDialogOpen] = useState(false)

  useEffect(() => {
    const foundBook = mockBooks.find((b) => b.id === params.id)
    if (foundBook) {
      setBook(foundBook)
      setTransactions(mockTransactions.filter((t) => t.bookId === params.id))
      setReservations(mockReservations.filter((r) => r.bookId === params.id))
    }
  }, [params.id])

  if (!book) {
    return (
      <div className="flex h-screen items-center justify-center">
        <p className="text-muted-foreground">Book not found</p>
      </div>
    )
  }

  const statusColors = {
    available: "bg-green-100 text-green-800",
    borrowed: "bg-amber-100 text-amber-800",
    reserved: "bg-blue-100 text-blue-800",
    lost: "bg-red-100 text-red-800",
    damaged: "bg-orange-100 text-orange-800",
  }

  const handleBorrow = () => {
    const dueDate = new Date()
    dueDate.setDate(dueDate.getDate() + LOAN_PERIOD_DAYS)
    toast.success(`Book borrowed! Due date: ${dueDate.toLocaleDateString()}`)
    setIsBorrowDialogOpen(false)
  }

  const handleReserve = () => {
    const position = reservations.length + 1
    toast.success(`Added to reservation queue. Position: ${position}`)
    setIsReserveDialogOpen(false)
  }

  const activeLoans = transactions.filter((t) => t.status === "active" || t.status === "overdue")
  const pendingReservations = reservations.filter((r) => r.status === "pending")

  return (
    <div className="min-h-screen">
      <Header title="Book Details" />

      <div className="p-6">
        <Button variant="ghost" className="mb-6" onClick={() => router.back()}>
          <ArrowLeft className="mr-2 h-4 w-4" />
          Back to Catalog
        </Button>

        <div className="grid gap-6 lg:grid-cols-3">
          {/* Book Cover & Actions */}
          <div className="space-y-4">
            <Card>
              <CardContent className="p-4">
                <div className="relative aspect-[7/8] w-full overflow-hidden rounded-lg bg-muted">
                  <Image
                    src={book.coverImage || "/placeholder.svg?height=400&width=300&query=book cover"}
                    alt={book.title}
                    fill
                    className="object-cover"
                  />
                </div>
                <div className="mt-4 space-y-2">
                  <Badge className={cn("w-full justify-center py-1", statusColors[book.status])}>
                    {book.availableCopies} of {book.totalCopies} copies available
                  </Badge>
                  {pendingReservations.length > 0 && (
                    <Badge className="w-full justify-center bg-amber-500 text-white">
                      <Users className="mr-2 h-4 w-4" />
                      {pendingReservations.length} active hold{pendingReservations.length > 1 ? "s" : ""}
                    </Badge>
                  )}
                  {book.availableCopies > 0 ? (
                    <Button className="w-full" onClick={() => setIsBorrowDialogOpen(true)}>
                      <BookOpen className="mr-2 h-4 w-4" />
                      Borrow This Book
                    </Button>
                  ) : (
                    <Button className="w-full" variant="secondary" onClick={() => setIsReserveDialogOpen(true)}>
                      <BookMarked className="mr-2 h-4 w-4" />
                      Reserve ({pendingReservations.length} in queue)
                    </Button>
                  )}
                </div>
              </CardContent>
            </Card>

            {/* Quick Stats */}
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium">Availability Info</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="flex items-center justify-between text-sm">
                  <span className="text-muted-foreground">Total Copies</span>
                  <span className="font-medium">{book.totalCopies}</span>
                </div>
                <div className="flex items-center justify-between text-sm">
                  <span className="text-muted-foreground">Available</span>
                  <span className="font-medium text-green-600">{book.availableCopies}</span>
                </div>
                <div className="flex items-center justify-between text-sm">
                  <span className="text-muted-foreground">On Loan</span>
                  <span className="font-medium">{activeLoans.length}</span>
                </div>
                <div className="flex items-center justify-between text-sm">
                  <span className="text-muted-foreground">Reserved</span>
                  <span className="font-medium">{pendingReservations.length}</span>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Book Details */}
          <div className="lg:col-span-2 space-y-6">
            <Card>
              <CardContent className="p-6">
                <h1 className="text-2xl font-bold text-card-foreground">{book.title}</h1>
                <p className="mt-1 text-lg text-muted-foreground">by {book.author}</p>

                <div className="mt-6 grid gap-4 sm:grid-cols-2">
                  <div className="flex items-center gap-3">
                    <div className="rounded-lg bg-primary/10 p-2">
                      <Hash className="h-4 w-4 text-primary" />
                    </div>
                    <div>
                      <p className="text-xs text-muted-foreground">ISBN</p>
                      <p className="font-medium">{book.isbn}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <div className="rounded-lg bg-primary/10 p-2">
                      <Tag className="h-4 w-4 text-primary" />
                    </div>
                    <div>
                      <p className="text-xs text-muted-foreground">Category</p>
                      <p className="font-medium">{book.category}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <div className="rounded-lg bg-primary/10 p-2">
                      <Building className="h-4 w-4 text-primary" />
                    </div>
                    <div>
                      <p className="text-xs text-muted-foreground">Publisher</p>
                      <p className="font-medium">{book.publisher}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <div className="rounded-lg bg-primary/10 p-2">
                      <Calendar className="h-4 w-4 text-primary" />
                    </div>
                    <div>
                      <p className="text-xs text-muted-foreground">Published</p>
                      <p className="font-medium">{book.publishYear}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <div className="rounded-lg bg-primary/10 p-2">
                      <MapPin className="h-4 w-4 text-primary" />
                    </div>
                    <div>
                      <p className="text-xs text-muted-foreground">Location</p>
                      <p className="font-medium">{book.location}</p>
                    </div>
                  </div>
                  {book.deweyClassification && (
                    <div className="flex items-center gap-3">
                      <div className="rounded-lg bg-primary/10 p-2">
                        <BookOpen className="h-4 w-4 text-primary" />
                      </div>
                      <div>
                        <p className="text-xs text-muted-foreground">Dewey Classification</p>
                        <p className="font-medium">{book.deweyClassification}</p>
                      </div>
                    </div>
                  )}
                </div>

                <Separator className="my-6" />

                <div>
                  <h3 className="font-semibold mb-2">Description</h3>
                  <p className="text-muted-foreground leading-relaxed">{book.description}</p>
                </div>
              </CardContent>
            </Card>

            {/* Active Loans - Admin Only */}
            {isAdmin && activeLoans.length > 0 && (
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Clock className="h-5 w-5 text-primary" />
                    Active Loans
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Member</TableHead>
                        <TableHead>Issue Date</TableHead>
                        <TableHead>Due Date</TableHead>
                        <TableHead>Status</TableHead>
                        <TableHead className="text-right">Fine</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {activeLoans.map((loan) => {
                        const fine = calculateFine(loan.dueDate)
                        const daysLeft = getDaysUntilDue(loan.dueDate)
                        return (
                          <TableRow key={loan.id}>
                            <TableCell className="font-medium">{loan.userName}</TableCell>
                            <TableCell>{new Date(loan.issueDate).toLocaleDateString()}</TableCell>
                            <TableCell className={cn(daysLeft < 0 && "text-destructive font-medium")}>
                              {new Date(loan.dueDate).toLocaleDateString()}
                              {daysLeft < 0 && (
                                <span className="ml-2 text-xs">({Math.abs(daysLeft)} days overdue)</span>
                              )}
                            </TableCell>
                            <TableCell>
                              <Badge
                                className={cn(daysLeft < 0 ? "bg-red-100 text-red-800" : "bg-green-100 text-green-800")}
                              >
                                {daysLeft < 0 ? "Overdue" : "Active"}
                              </Badge>
                            </TableCell>
                            <TableCell className="text-right">
                              {fine > 0 ? (
                                <span className="text-destructive font-medium">{formatCurrency(fine)}</span>
                              ) : (
                                "-"
                              )}
                            </TableCell>
                          </TableRow>
                        )
                      })}
                    </TableBody>
                  </Table>
                </CardContent>
              </Card>
            )}

            {/* Reservation Queue - Admin Only */}
            {isAdmin && pendingReservations.length > 0 && (
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Users className="h-5 w-5 text-primary" />
                    Reservation Queue
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Position</TableHead>
                        <TableHead>Member</TableHead>
                        <TableHead>Reserve Date</TableHead>
                        <TableHead>Status</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {pendingReservations.map((res) => (
                        <TableRow key={res.id}>
                          <TableCell className="font-medium">#{res.queuePosition}</TableCell>
                          <TableCell>{res.userName}</TableCell>
                          <TableCell>{new Date(res.reserveDate).toLocaleDateString()}</TableCell>
                          <TableCell>
                            <Badge variant="outline" className="capitalize">
                              {res.status}
                            </Badge>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </CardContent>
              </Card>
            )}
          </div>
        </div>
      </div>

      {/* Borrow Dialog */}
      <Dialog open={isBorrowDialogOpen} onOpenChange={setIsBorrowDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Borrow Book</DialogTitle>
            <DialogDescription>Confirm borrowing "{book.title}"</DialogDescription>
          </DialogHeader>
          <div className="py-4 space-y-4">
            <div className="rounded-lg bg-muted p-4">
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Loan Period</span>
                <span className="font-medium">{LOAN_PERIOD_DAYS} days</span>
              </div>
              <div className="flex justify-between text-sm mt-2">
                <span className="text-muted-foreground">Due Date</span>
                <span className="font-medium">
                  {new Date(Date.now() + LOAN_PERIOD_DAYS * 24 * 60 * 60 * 1000).toLocaleDateString()}
                </span>
              </div>
            </div>
            <div className="flex items-start gap-2 text-sm text-muted-foreground">
              <AlertTriangle className="h-4 w-4 mt-0.5 text-amber-500" />
              <p>Late returns will incur a fine of {formatCurrency(0.5)} per day.</p>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsBorrowDialogOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleBorrow}>Confirm Borrow</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Reserve Dialog */}
      <Dialog open={isReserveDialogOpen} onOpenChange={setIsReserveDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Reserve Book</DialogTitle>
            <DialogDescription>Join the waiting list for "{book.title}"</DialogDescription>
          </DialogHeader>
          <div className="py-4 space-y-4">
            <div className="rounded-lg bg-muted p-4">
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Current Queue</span>
                <span className="font-medium">{pendingReservations.length} people waiting</span>
              </div>
              <div className="flex justify-between text-sm mt-2">
                <span className="text-muted-foreground">Your Position</span>
                <span className="font-medium">#{pendingReservations.length + 1}</span>
              </div>
            </div>
            <p className="text-sm text-muted-foreground">
              You will be notified via email when the book becomes available for pickup.
            </p>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsReserveDialogOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleReserve}>Confirm Reservation</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
