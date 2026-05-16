"use client"

import Image from "next/image"
import { cn } from "@/lib/utils"
import type { Book } from "@/lib/types"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"
import { MoreHorizontal, Eye, Edit, Trash2, BookMarked } from "lucide-react"

interface BookTableProps {
  books: Book[]
  onView?: (book: Book) => void
  onEdit?: (book: Book) => void
  onDelete?: (book: Book) => void
  onReserve?: (book: Book) => void
  isAdmin?: boolean
  holdCountMap?: Record<string, number>
}

export function BookTable({
  books,
  onView,
  onEdit,
  onDelete,
  onReserve,
  isAdmin = false,
  holdCountMap,
}: BookTableProps) {
  const statusColors = {
    available: "bg-green-100 text-green-800",
    borrowed: "bg-amber-100 text-amber-800",
    reserved: "bg-blue-100 text-blue-800",
    lost: "bg-red-100 text-red-800",
    damaged: "bg-orange-100 text-orange-800",
  }

  return (
    <div className="rounded-lg border bg-card">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead className="w-[300px]">Book</TableHead>
            <TableHead>ISBN</TableHead>
            <TableHead>Category</TableHead>
            <TableHead>Keywords</TableHead>
            <TableHead>Location</TableHead>
            <TableHead className="text-center">Availability</TableHead>
            <TableHead>Status</TableHead>
            <TableHead className="w-[70px]"></TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {books.map((book) => (
            <TableRow key={book.id}>
              <TableCell>
                <div className="flex items-center gap-3">
                  <div className="relative h-12 w-9 overflow-hidden rounded bg-muted">
                    <Image
                      src={book.coverImage || "/placeholder.svg?height=48&width=36&query=book"}
                      alt={book.title}
                      fill
                      className="object-cover"
                    />
                  </div>
                  <div>
                    <p className="font-medium text-card-foreground">{book.title}</p>
                    <p className="text-sm text-muted-foreground">{book.author}</p>
                  </div>
                </div>
              </TableCell>
              <TableCell className="text-muted-foreground">{book.isbn}</TableCell>
              <TableCell>{book.category}</TableCell>
              <TableCell>
                {book.keywords && book.keywords.length > 0 ? (
                  <div className="flex flex-wrap gap-1">
                    {book.keywords.slice(0, 2).map((keyword) => (
                      <Badge key={keyword} variant="outline" className="text-xs">
                        {keyword}
                      </Badge>
                    ))}
                    {book.keywords.length > 2 && (
                      <Badge variant="outline" className="text-xs">
                        +{book.keywords.length - 2}
                      </Badge>
                    )}
                  </div>
                ) : (
                  <span className="text-muted-foreground text-sm">-</span>
                )}
              </TableCell>
              <TableCell className="text-muted-foreground">{book.location}</TableCell>
              <TableCell className="text-center">
                <span className="font-medium">{book.availableCopies}</span>
                <span className="text-muted-foreground"> / {book.totalCopies}</span>
                {holdCountMap && holdCountMap[book.id] ? (
                  <div className="mt-1 flex justify-center">
                    <Badge variant="outline" className="bg-amber-50 text-amber-700 border-amber-200">
                      {holdCountMap[book.id]} hold{holdCountMap[book.id] > 1 ? "s" : ""}
                    </Badge>
                  </div>
                ) : null}
              </TableCell>
              <TableCell>
                <Badge className={cn("capitalize", statusColors[book.status])}>{book.status}</Badge>
              </TableCell>
              <TableCell>
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="ghost" size="icon">
                      <MoreHorizontal className="h-4 w-4" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end">
                    <DropdownMenuItem onClick={() => onView?.(book)}>
                      <Eye className="mr-2 h-4 w-4" />
                      View Details
                    </DropdownMenuItem>
                    {isAdmin && (
                      <>
                        <DropdownMenuItem onClick={() => onEdit?.(book)}>
                          <Edit className="mr-2 h-4 w-4" />
                          Edit Book
                        </DropdownMenuItem>
                        <DropdownMenuItem onClick={() => onDelete?.(book)} className="text-destructive">
                          <Trash2 className="mr-2 h-4 w-4" />
                          Delete Book
                        </DropdownMenuItem>
                      </>
                    )}
                    {!isAdmin && book.availableCopies === 0 && (
                      <DropdownMenuItem onClick={() => onReserve?.(book)}>
                        <BookMarked className="mr-2 h-4 w-4" />
                        Reserve
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
  )
}
