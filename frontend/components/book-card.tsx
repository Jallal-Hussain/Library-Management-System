"use client"

import Image from "next/image"
import Link from "next/link"
import { cn } from "@/lib/utils"
import type { Book } from "@/lib/types"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { BookOpen, MapPin, Users } from "lucide-react"

interface BookCardProps {
  book: Book
  onView?: (book: Book) => void
  onBorrow?: (book: Book) => void
  showActions?: boolean
  compact?: boolean
  holdCount?: number
}

export function BookCard({ book, onView, onBorrow, showActions = true, compact = false, holdCount = 0 }: BookCardProps) {
  const statusColors = {
    available: "bg-green-100 text-green-800",
    borrowed: "bg-amber-100 text-amber-800",
    reserved: "bg-blue-100 text-blue-800",
    lost: "bg-red-100 text-red-800",
    damaged: "bg-orange-100 text-orange-800",
  }

  if (compact) {
    return (
      <Card className="overflow-hidden transition-shadow hover:shadow-md">
        <CardContent className="flex gap-4 p-4">
          <div className="relative h-20 w-14 flex-shrink-0 overflow-hidden rounded">
            <Image
              src={book.coverImage || "/placeholder.svg?height=80&width=56&query=book cover"}
              alt={book.title}
              fill
              className="object-cover"
            />
          </div>
          <div className="flex flex-1 flex-col justify-between overflow-hidden">
            <div>
              <h3 className="truncate font-medium text-card-foreground">{book.title}</h3>
              <p className="truncate text-sm text-muted-foreground">{book.author}</p>
            </div>
            <div className="flex items-center justify-between">
              <Badge className={cn("text-xs", statusColors[book.status])}>
                {book.availableCopies}/{book.totalCopies} available
              </Badge>
            </div>
          </div>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card className="overflow-hidden transition-shadow hover:shadow-lg">
      <div className="relative aspect-[7/8] w-full overflow-hidden bg-muted">
        <Image
          src={book.coverImage || "/placeholder.svg?height=300&width=200&query=book cover"}
          alt={book.title}
          fill
          className="object-cover transition-transform hover:scale-105"
        />
        <Badge className={cn("absolute right-2 top-2", statusColors[book.status])}>{book.status}</Badge>
        {holdCount > 0 && (
          <Badge className="absolute left-2 top-2 bg-amber-500 text-white">
            <Users className="h-3 w-3 mr-1" />
            {holdCount} hold{holdCount > 1 ? "s" : ""}
          </Badge>
        )}
      </div>
      <CardContent className="p-4">
        <h3 className="mb-1 line-clamp-1 font-semibold text-card-foreground" title={book.title}>
          {book.title}
        </h3>
        <p className="mb-2 text-sm text-muted-foreground">{book.author}</p>
        <div className="mb-3 flex items-center gap-4 text-xs text-muted-foreground">
          <span className="flex items-center gap-1">
            <BookOpen className="h-3 w-3" />
            {book.category}
          </span>
          <span className="flex items-center gap-1">
            <MapPin className="h-3 w-3" />
            {book.location}
          </span>
        </div>
        {book.keywords && book.keywords.length > 0 && (
          <div className="mb-3 flex flex-wrap gap-1">
            {book.keywords.slice(0, 3).map((keyword) => (
              <Badge key={keyword} variant="outline" className="text-xs">
                {keyword}
              </Badge>
            ))}
            {book.keywords.length > 3 && (
              <Badge variant="outline" className="text-xs">
                +{book.keywords.length - 3}
              </Badge>
            )}
          </div>
        )}
        <div className="mb-3 flex items-center justify-between text-sm">
          <span className="text-muted-foreground">Available:</span>
          <span className="font-medium text-card-foreground">
            {book.availableCopies} of {book.totalCopies}
          </span>
        </div>
        {showActions && (
          <div className="flex gap-2">
            <Link href={`/dashboard/books/${book.id}`} className="flex-1">
              <Button variant="outline" size="sm" className="w-full bg-transparent">
                Details
              </Button>
            </Link>
            <Button size="sm" className="flex-1" disabled={book.availableCopies === 0} onClick={() => onBorrow?.(book)}>
              {book.availableCopies === 0 ? "Reserve" : "Borrow"}
            </Button>
          </div>
        )}
      </CardContent>
    </Card>
  )
}
