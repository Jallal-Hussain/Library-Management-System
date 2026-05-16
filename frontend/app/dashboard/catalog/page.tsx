"use client"

import { useState, useMemo } from "react"
import { useRouter } from "next/navigation"
import { Header } from "@/components/header"
import { BookCard } from "@/components/book-card"
import { AdvancedSearchDialog, type AdvancedSearchFilters } from "@/components/advanced-search-dialog"
import { mockBooks, mockCategories, mockReservations } from "@/lib/mock-data"
import { useAuth } from "@/lib/auth-context"
import type { Book, Reservation } from "@/lib/types"
import { Input } from "@/components/ui/input"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Search, Filter, BookOpen } from "lucide-react"
import { toast } from "sonner"

export default function CatalogPage() {
  const router = useRouter()
  const { user } = useAuth()
  const [books] = useState<Book[]>(mockBooks)
  const [reservations, setReservations] = useState<Reservation[]>(mockReservations)
  const [searchQuery, setSearchQuery] = useState("")
  const [categoryFilter, setCategoryFilter] = useState<string>("all")
  const [advancedFilters, setAdvancedFilters] = useState<AdvancedSearchFilters>({})
  const [isAdvancedOpen, setIsAdvancedOpen] = useState(false)

  const filteredBooks = useMemo(() => {
    return books.filter((book) => {
      const matchesSearch =
        book.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        book.author.toLowerCase().includes(searchQuery.toLowerCase()) ||
        book.isbn.toLowerCase().includes(searchQuery.toLowerCase())

      const matchesCategory = categoryFilter === "all" || book.category === categoryFilter

      const matchesAdvanced =
        (!advancedFilters.title ||
          book.title.toLowerCase().includes(advancedFilters.title.toLowerCase())) &&
        (!advancedFilters.author ||
          book.author.toLowerCase().includes(advancedFilters.author.toLowerCase())) &&
        (!advancedFilters.category || book.category === advancedFilters.category) &&
        (!advancedFilters.isbn || book.isbn.toLowerCase().includes(advancedFilters.isbn.toLowerCase())) &&
        (!advancedFilters.keywords ||
          book.keywords?.some((kw) => kw.toLowerCase().includes(advancedFilters.keywords!.toLowerCase())))

      return matchesSearch && matchesCategory && matchesAdvanced
    })
  }, [books, searchQuery, categoryFilter, advancedFilters])

  const holdCountMap = useMemo(() => {
    const map: Record<string, number> = {}
    reservations.forEach((r) => {
      if (r.status === "pending") {
        map[r.bookId] = (map[r.bookId] || 0) + 1
      }
    })
    return map
  }, [reservations])

  const handleBorrow = (book: Book) => {
    if (!user) {
      toast.error("Please log in to borrow books")
      return
    }

    if (book.availableCopies > 0) {
      toast.success(`Borrow request submitted for "${book.title}"`)
    } else {
      // Add to reservation queue
      const existingReservation = reservations.find((r) => r.bookId === book.id && r.userId === user.id)
      if (existingReservation) {
        toast.info(`You already have a reservation for "${book.title}"`)
        return
      }

      const queuePosition = reservations.filter((r) => r.bookId === book.id && r.status === "pending").length + 1

      const newReservation: Reservation = {
        id: String(Date.now()),
        userId: user.id,
        userName: user.name,
        bookId: book.id,
        bookTitle: book.title,
        reserveDate: new Date().toISOString().split("T")[0],
        queuePosition,
        status: "pending",
        notificationSent: false,
      }

      setReservations([...reservations, newReservation])
      toast.success(`Added to reservation queue for "${book.title}" (Position: #${queuePosition})`)
    }
  }

  const handleView = (book: Book) => {
    router.push(`/dashboard/books/${book.id}`)
  }

  return (
    <div className="min-h-screen">
      <Header title="Browse Catalog" subtitle="Discover and borrow books from our collection" />

      <div className="p-6">
        {/* Category Pills */}
        <div className="mb-6 flex flex-wrap gap-2">
          <Badge
            variant={categoryFilter === "all" ? "default" : "outline"}
            className="cursor-pointer px-4 py-2 text-sm"
            onClick={() => setCategoryFilter("all")}
          >
            All
          </Badge>
          {mockCategories.slice(0, 6).map((cat) => (
            <Badge
              key={cat.id}
              variant={categoryFilter === cat.name ? "default" : "outline"}
              className="cursor-pointer px-4 py-2 text-sm"
              onClick={() => setCategoryFilter(cat.name)}
            >
              {cat.name}
            </Badge>
          ))}
        </div>

        {/* Search */}
        <Card className="mb-6">
          <CardContent className="p-4">
            <div className="flex flex-wrap items-center gap-4">
              <div className="relative flex-1 min-w-[200px]">
                <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                <Input
                  placeholder="Search by title, author, or ISBN..."
                  className="pl-9"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                />
              </div>
              <Select value={categoryFilter} onValueChange={setCategoryFilter}>
                <SelectTrigger className="w-[180px]">
                  <Filter className="mr-2 h-4 w-4" />
                  <SelectValue placeholder="Category" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Categories</SelectItem>
                  {mockCategories.map((cat) => (
                    <SelectItem key={cat.id} value={cat.name}>
                      {cat.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>

              <Button variant="outline" onClick={() => setIsAdvancedOpen(true)}>
                Advanced
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Results count */}
        <p className="mb-4 text-sm text-muted-foreground">
          Showing {filteredBooks.length} of {books.length} books
        </p>

        {/* Books Grid */}
        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {filteredBooks.map((book) => (
            <BookCard
              key={book.id}
              book={book}
              onBorrow={handleBorrow}
              onView={handleView}
              holdCount={holdCountMap[book.id] || 0}
            />
          ))}
        </div>

        {/* Empty State */}
        {filteredBooks.length === 0 && (
          <div className="flex flex-col items-center justify-center py-12 text-center">
            <div className="rounded-full bg-muted p-4">
              <BookOpen className="h-8 w-8 text-muted-foreground" />
            </div>
            <h3 className="mt-4 text-lg font-semibold">No books found</h3>
            <p className="mt-2 text-sm text-muted-foreground">Try adjusting your search or filter criteria</p>
          </div>
        )}
      </div>

      <AdvancedSearchDialog
        open={isAdvancedOpen}
        onOpenChange={setIsAdvancedOpen}
        onApply={(filters) => setAdvancedFilters(filters)}
        categories={mockCategories.map((c) => c.name)}
      />
    </div>
  )
}
