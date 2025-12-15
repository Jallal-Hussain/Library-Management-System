"use client"

import type React from "react"

import { useState, useEffect } from "react"
import type { Book } from "@/lib/types"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Separator } from "@/components/ui/separator"
import { mockCategories } from "@/lib/mock-data"
import { ISBNLookup } from "@/components/isbn-lookup"
import { KeywordInput } from "@/components/keyword-input"

interface AddBookDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  onSubmit: (book: Partial<Book>) => void
  editBook?: Book | null
}

export function AddBookDialog({ open, onOpenChange, onSubmit, editBook }: AddBookDialogProps) {
  const [formData, setFormData] = useState<Partial<Book>>(
    editBook || {
      title: "",
      author: "",
      isbn: "",
      category: "",
      genre: "",
      publisher: "",
      publishYear: new Date().getFullYear(),
      description: "",
      totalCopies: 1,
      availableCopies: 1,
      location: "",
      deweyClassification: "",
      keywords: [],
    },
  )

  useEffect(() => {
    if (editBook) {
      setFormData(editBook)
    } else {
      setFormData({
        title: "",
        author: "",
        isbn: "",
        category: "",
        genre: "",
        publisher: "",
        publishYear: new Date().getFullYear(),
        description: "",
        totalCopies: 1,
        availableCopies: 1,
        location: "",
        deweyClassification: "",
        keywords: [],
      })
    }
  }, [editBook, open])

  const handleBookFound = (bookData: {
    title: string
    author: string
    publisher: string
    publishYear: number
    description: string
    coverImage?: string
  }) => {
    setFormData((prev) => ({
      ...prev,
      title: bookData.title || prev.title,
      author: bookData.author || prev.author,
      publisher: bookData.publisher || prev.publisher,
      publishYear: bookData.publishYear || prev.publishYear,
      description: bookData.description || prev.description,
      coverImage: bookData.coverImage || prev.coverImage,
    }))
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    onSubmit({
      ...formData,
      id: editBook?.id || String(Date.now()),
      status: "available",
      addedDate: editBook?.addedDate || new Date().toISOString().split("T")[0],
    })
    onOpenChange(false)
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-[600px]">
        <DialogHeader>
          <DialogTitle>{editBook ? "Edit Book" : "Add New Book"}</DialogTitle>
          <DialogDescription>
            {editBook ? "Update the book information below." : "Fill in the details to add a new book to the catalog."}
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit}>
          <div className="grid gap-4 py-4">
            {!editBook && (
              <>
                <ISBNLookup onBookFound={handleBookFound} />
                <Separator />
              </>
            )}

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="title">Title *</Label>
                <Input
                  id="title"
                  value={formData.title}
                  onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="author">Author *</Label>
                <Input
                  id="author"
                  value={formData.author}
                  onChange={(e) => setFormData({ ...formData, author: e.target.value })}
                  required
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="isbn">ISBN *</Label>
                <Input
                  id="isbn"
                  value={formData.isbn}
                  onChange={(e) => setFormData({ ...formData, isbn: e.target.value })}
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="category">Category *</Label>
                <Select
                  value={formData.category}
                  onValueChange={(value) => setFormData({ ...formData, category: value })}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select category" />
                  </SelectTrigger>
                  <SelectContent>
                    {mockCategories.map((cat) => (
                      <SelectItem key={cat.id} value={cat.name}>
                        {cat.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="genre">Genre</Label>
                <Input
                  id="genre"
                  value={formData.genre}
                  onChange={(e) => setFormData({ ...formData, genre: e.target.value })}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="publisher">Publisher</Label>
                <Input
                  id="publisher"
                  value={formData.publisher}
                  onChange={(e) => setFormData({ ...formData, publisher: e.target.value })}
                />
              </div>
            </div>

            <div className="grid grid-cols-3 gap-4">
              <div className="space-y-2">
                <Label htmlFor="publishYear">Publish Year</Label>
                <Input
                  id="publishYear"
                  type="number"
                  value={formData.publishYear}
                  onChange={(e) => setFormData({ ...formData, publishYear: Number(e.target.value) })}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="totalCopies">Total Copies *</Label>
                <Input
                  id="totalCopies"
                  type="number"
                  min="1"
                  value={formData.totalCopies}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      totalCopies: Number(e.target.value),
                      availableCopies: Number(e.target.value),
                    })
                  }
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="location">Location *</Label>
                <Input
                  id="location"
                  placeholder="e.g., A-12-3"
                  value={formData.location}
                  onChange={(e) => setFormData({ ...formData, location: e.target.value })}
                  required
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="dewey">Dewey Classification</Label>
              <Input
                id="dewey"
                value={formData.deweyClassification}
                onChange={(e) => setFormData({ ...formData, deweyClassification: e.target.value })}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="keywords">Keywords</Label>
              <KeywordInput
                keywords={formData.keywords || []}
                onChange={(keywords) => setFormData({ ...formData, keywords })}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="description">Description</Label>
              <Textarea
                id="description"
                rows={3}
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              />
            </div>
          </div>
          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
            <Button type="submit">{editBook ? "Save Changes" : "Add Book"}</Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
