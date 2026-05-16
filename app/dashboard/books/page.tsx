"use client"

import { useState, useMemo } from "react"
import { Header } from "@/components/header"
import { BookTable } from "@/components/book-table"
import { BookCard } from "@/components/book-card"
import { AddBookDialog } from "@/components/add-book-dialog"
import { BatchImportDialog } from "@/components/batch-import-dialog"
import { AdvancedSearchDialog, type AdvancedSearchFilters } from "@/components/advanced-search-dialog"
import { useAuth } from "@/lib/auth-context"
import { mockBooks, mockCategories, mockReservations } from "@/lib/mock-data"
import type { Book } from "@/lib/types"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Card, CardContent } from "@/components/ui/card"
import { Plus, Search, LayoutGrid, List, Filter, X, Upload } from "lucide-react"
import { toast } from "sonner"
import { useRouter } from "next/navigation"

export default function BooksPage() {
  const { hasRole } = useAuth()
  const isAdmin = hasRole(["admin", "librarian"])
  const router = useRouter()

  const [books, setBooks] = useState<Book[]>(mockBooks)
  const [searchQuery, setSearchQuery] = useState("")
  const [categoryFilter, setCategoryFilter] = useState<string>("all")
  const [statusFilter, setStatusFilter] = useState<string>("all")
  const [viewMode, setViewMode] = useState<"grid" | "table">("table")
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false)
  const [isBatchImportOpen, setIsBatchImportOpen] = useState(false)
  const [editingBook, setEditingBook] = useState<Book | null>(null)
  const [isAdvancedOpen, setIsAdvancedOpen] = useState(false)
  const [advancedFilters, setAdvancedFilters] = useState<AdvancedSearchFilters>({})
  const holdCountMap = useMemo(() => {
    const map: Record<string, number> = {}
    mockReservations.forEach((r) => {
      if (r.status === "pending") {
        map[r.bookId] = (map[r.bookId] || 0) + 1
      }
    })
    return map
  }, [])

  const filteredBooks = useMemo(() => {
    return books.filter((book) => {
      const matchesSearch =
        book.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        book.author.toLowerCase().includes(searchQuery.toLowerCase()) ||
        book.isbn.includes(searchQuery) ||
        book.keywords?.some((keyword) => keyword.toLowerCase().includes(searchQuery.toLowerCase()))

      const matchesCategory = categoryFilter === "all" || book.category === categoryFilter
      const matchesStatus = statusFilter === "all" || book.status === statusFilter

      const matchesAdvanced =
        (!advancedFilters.title ||
          book.title.toLowerCase().includes(advancedFilters.title.toLowerCase())) &&
        (!advancedFilters.author ||
          book.author.toLowerCase().includes(advancedFilters.author.toLowerCase())) &&
        (!advancedFilters.category || book.category === advancedFilters.category) &&
        (!advancedFilters.status || book.status === advancedFilters.status) &&
        (!advancedFilters.isbn || book.isbn.toLowerCase().includes(advancedFilters.isbn.toLowerCase())) &&
        (!advancedFilters.keywords ||
          book.keywords?.some((kw) => kw.toLowerCase().includes(advancedFilters.keywords!.toLowerCase())))

      return matchesSearch && matchesCategory && matchesStatus && matchesAdvanced
    })
  }, [books, searchQuery, categoryFilter, statusFilter, advancedFilters])

  const handleAddBook = (bookData: Partial<Book>) => {
    if (editingBook) {
      setBooks(books.map((b) => (b.id === editingBook.id ? ({ ...b, ...bookData } as Book) : b)))
      toast.success("Book updated successfully")
      setEditingBook(null)
    } else {
      const newBook: Book = {
        ...bookData,
        id: String(Date.now()),
        status: "available",
        addedDate: new Date().toISOString().split("T")[0],
        availableCopies: bookData.totalCopies || 1,
      } as Book
      setBooks([newBook, ...books])
      toast.success("Book added successfully")
    }
  }

  const handleBatchImport = (importedBooks: Partial<Book>[]) => {
    const newBooks: Book[] = importedBooks.map((bookData, index) => ({
      ...bookData,
      id: String(Date.now() + index),
      status: "available" as const,
      addedDate: new Date().toISOString().split("T")[0],
      availableCopies: bookData.totalCopies || 1,
    })) as Book[]
    setBooks([...newBooks, ...books])
  }

  const handleEditBook = (book: Book) => {
    setEditingBook(book)
    setIsAddDialogOpen(true)
  }

  const handleDeleteBook = (book: Book) => {
    setBooks(books.filter((b) => b.id !== book.id))
    toast.success("Book deleted successfully")
  }

  const handleViewBook = (book: Book) => {
    router.push(`/dashboard/books/${book.id}`)
    toast.info(`Viewing: ${book.title}`)
  }

  const handleBorrowBook = (book: Book) => {
    if (book.availableCopies > 0) {
      toast.success(`Borrowing: ${book.title}`)
    } else {
      toast.info(`Added to reservation queue: ${book.title}`)
    }
  }

  const clearFilters = () => {
    setSearchQuery("")
    setCategoryFilter("all")
    setStatusFilter("all")
    setAdvancedFilters({})
  }

  const hasActiveFilters = searchQuery || categoryFilter !== "all" || statusFilter !== "all"

  return (
    <div className="min-h-screen">
      <Header title="Book Catalog" subtitle={`${filteredBooks.length} of ${books.length} books`} />

      <div className="p-6">
        {/* Filters */}
        <Card className="mb-6">
          <CardContent className="p-4">
            <div className="flex flex-wrap items-center gap-4">
              {/* Search */}
              <div className="relative flex-1 min-w-[200px]">
                <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                <Input
                  placeholder="Search by title, author, or ISBN..."
                  className="pl-9"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                />
              </div>

              {/* Category Filter */}
              <Select value={categoryFilter} onValueChange={setCategoryFilter}>
                <SelectTrigger className="w-[180px]">
                  <Filter className="mr-2 h-4 w-4" />
                  <SelectValue placeholder="Category" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Categories</SelectItem>
                  {mockCategories.map((cat) => (
                    <SelectItem key={cat.id} value={cat.name}>
                      {cat.name} ({cat.count})
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>

              {/* Status Filter */}
              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger className="w-[150px]">
                  <SelectValue placeholder="Status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Status</SelectItem>
                  <SelectItem value="available">Available</SelectItem>
                  <SelectItem value="borrowed">Borrowed</SelectItem>
                  <SelectItem value="reserved">Reserved</SelectItem>
                </SelectContent>
              </Select>

              <Button variant="outline" onClick={() => setIsAdvancedOpen(true)}>
                <Filter className="mr-2 h-4 w-4" />
                Advanced
              </Button>

              {/* Clear Filters */}
              {hasActiveFilters && (
                <Button variant="ghost" size="sm" onClick={clearFilters}>
                  <X className="mr-1 h-4 w-4" />
                  Clear
                </Button>
              )}

              {/* View Toggle */}
              <Tabs value={viewMode} onValueChange={(v) => setViewMode(v as "grid" | "table")}>
                <TabsList>
                  <TabsTrigger value="table">
                    <List className="h-4 w-4" />
                  </TabsTrigger>
                  <TabsTrigger value="grid">
                    <LayoutGrid className="h-4 w-4" />
                  </TabsTrigger>
                </TabsList>
              </Tabs>

              {/* Add Book Button */}
              {isAdmin && (
                <>
                  <Button
                    variant="outline"
                    onClick={() => setIsBatchImportOpen(true)}
                  >
                    <Upload className="mr-2 h-4 w-4" />
                    Batch Import
                  </Button>
                  <Button
                    onClick={() => {
                      setEditingBook(null)
                      setIsAddDialogOpen(true)
                    }}
                  >
                    <Plus className="mr-2 h-4 w-4" />
                    Add Book
                  </Button>
                </>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Books Display */}
        {viewMode === "table" ? (
          <BookTable
            books={filteredBooks}
            isAdmin={isAdmin}
            onView={handleViewBook}
            onEdit={handleEditBook}
            onDelete={handleDeleteBook}
            onReserve={handleBorrowBook}
            holdCountMap={holdCountMap}
          />
        ) : (
          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
            {filteredBooks.map((book) => (
              <BookCard
                key={book.id}
                book={book}
                onView={handleViewBook}
                onBorrow={handleBorrowBook}
                holdCount={holdCountMap[book.id] || 0}
              />
            ))}
          </div>
        )}

        {/* Empty State */}
        {filteredBooks.length === 0 && (
          <div className="flex flex-col items-center justify-center py-12 text-center">
            <div className="rounded-full bg-muted p-4">
              <Search className="h-8 w-8 text-muted-foreground" />
            </div>
            <h3 className="mt-4 text-lg font-semibold">No books found</h3>
            <p className="mt-2 text-sm text-muted-foreground">Try adjusting your search or filter criteria</p>
            {hasActiveFilters && (
              <Button variant="outline" className="mt-4 bg-transparent" onClick={clearFilters}>
                Clear all filters
              </Button>
            )}
          </div>
        )}
      </div>

      {/* Add/Edit Book Dialog */}
      <AddBookDialog
        open={isAddDialogOpen}
        onOpenChange={(open) => {
          setIsAddDialogOpen(open)
          if (!open) setEditingBook(null)
        }}
        onSubmit={handleAddBook}
        editBook={editingBook}
      />

      {/* Batch Import Dialog */}
      <BatchImportDialog
        open={isBatchImportOpen}
        onOpenChange={setIsBatchImportOpen}
        onImport={handleBatchImport}
      />

      <AdvancedSearchDialog
        open={isAdvancedOpen}
        onOpenChange={setIsAdvancedOpen}
        onApply={(filters) => setAdvancedFilters(filters)}
        categories={mockCategories.map((c) => c.name)}
        statuses={["available", "borrowed", "reserved", "lost"]}
      />
    </div>
  )
}
