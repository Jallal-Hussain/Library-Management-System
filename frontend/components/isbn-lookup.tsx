"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Loader2, Search, BookOpen } from "lucide-react"
import { toast } from "sonner"

interface BookData {
  title: string
  author: string
  publisher: string
  publishYear: number
  description: string
  coverImage?: string
}

interface ISBNLookupProps {
  onBookFound: (book: BookData) => void
}

export function ISBNLookup({ onBookFound }: ISBNLookupProps) {
  const [isbn, setIsbn] = useState("")
  const [isLoading, setIsLoading] = useState(false)

  const handleLookup = async () => {
    if (!isbn.trim()) {
      toast.error("Please enter an ISBN")
      return
    }

    // Remove hyphens and spaces from ISBN
    const cleanIsbn = isbn.replace(/[-\s]/g, "")

    if (cleanIsbn.length !== 10 && cleanIsbn.length !== 13) {
      toast.error("ISBN must be 10 or 13 digits")
      return
    }

    setIsLoading(true)

    try {
      // Fetch from Open Library API
      const response = await fetch(`https://openlibrary.org/api/books?bibkeys=ISBN:${cleanIsbn}&format=json&jscmd=data`)
      const data = await response.json()

      const bookKey = `ISBN:${cleanIsbn}`

      if (data[bookKey]) {
        const book = data[bookKey]
        const bookData: BookData = {
          title: book.title || "",
          author: book.authors?.[0]?.name || "",
          publisher: book.publishers?.[0]?.name || "",
          publishYear: book.publish_date ? Number.parseInt(book.publish_date.match(/\d{4}/)?.[0] || "0") : 0,
          description: book.notes || book.subtitle || "",
          coverImage: book.cover?.medium || book.cover?.small,
        }

        onBookFound(bookData)
        toast.success("Book found!")
        setIsbn("")
      } else {
        toast.error("Book not found. Please enter details manually.")
      }
    } catch (error) {
      toast.error("Failed to lookup ISBN. Please try again.")
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="space-y-2">
      <Label>ISBN Lookup</Label>
      <div className="flex gap-2">
        <div className="relative flex-1">
          <BookOpen className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            placeholder="Enter ISBN (e.g., 978-0743273565)"
            value={isbn}
            onChange={(e) => setIsbn(e.target.value)}
            className="pl-9"
            onKeyDown={(e) => e.key === "Enter" && handleLookup()}
          />
        </div>
        <Button type="button" variant="secondary" onClick={handleLookup} disabled={isLoading}>
          {isLoading ? (
            <Loader2 className="h-4 w-4 animate-spin" />
          ) : (
            <>
              <Search className="h-4 w-4 mr-2" />
              Lookup
            </>
          )}
        </Button>
      </div>
      <p className="text-xs text-muted-foreground">Auto-fill book details using Open Library API</p>
    </div>
  )
}
