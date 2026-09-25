"use client"

import { useState } from "react"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Button } from "@/components/ui/button"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Separator } from "@/components/ui/separator"
import { Search } from "lucide-react"

export interface AdvancedSearchFilters {
  title?: string
  author?: string
  category?: string
  isbn?: string
  keywords?: string
  status?: string
}

interface AdvancedSearchDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  onApply: (filters: AdvancedSearchFilters) => void
  categories?: string[]
  statuses?: string[]
}

export function AdvancedSearchDialog({
  open,
  onOpenChange,
  onApply,
  categories = [],
  statuses = [],
}: AdvancedSearchDialogProps) {
  const [filters, setFilters] = useState<AdvancedSearchFilters>({})

  const handleApply = () => {
    onApply(filters)
    onOpenChange(false)
  }

  const handleClear = () => {
    setFilters({})
    onApply({})
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Search className="h-4 w-4" />
            Advanced Search
          </DialogTitle>
          <DialogDescription>Combine multiple filters to find books faster.</DialogDescription>
        </DialogHeader>

        <div className="grid gap-4 py-4">
          <div className="grid gap-2 sm:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="title">Title</Label>
              <Input
                id="title"
                placeholder="e.g., Clean Code"
                value={filters.title ?? ""}
                onChange={(e) => setFilters({ ...filters, title: e.target.value })}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="author">Author</Label>
              <Input
                id="author"
                placeholder="e.g., Robert C. Martin"
                value={filters.author ?? ""}
                onChange={(e) => setFilters({ ...filters, author: e.target.value })}
              />
            </div>
          </div>

          <div className="grid gap-2 sm:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="category">Category</Label>
              <Select
                value={filters.category ?? "all"}
                onValueChange={(value) => setFilters({ ...filters, category: value === "all" ? undefined : value })}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Any category" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Any category</SelectItem>
                  {categories.map((cat) => (
                    <SelectItem key={cat} value={cat}>
                      {cat}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="status">Status</Label>
              <Select
                value={filters.status ?? "all"}
                onValueChange={(value) => setFilters({ ...filters, status: value === "all" ? undefined : value })}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Any status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Any status</SelectItem>
                  {(statuses.length ? statuses : ["available", "checked_out", "reserved"]).map((status) => (
                    <SelectItem key={status} value={status}>
                      {status.replace("_", " ")}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          <Separator />

          <div className="grid gap-2 sm:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="isbn">ISBN</Label>
              <Input
                id="isbn"
                placeholder="ISBN-10 or ISBN-13"
                value={filters.isbn ?? ""}
                onChange={(e) => setFilters({ ...filters, isbn: e.target.value })}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="keywords">Keywords</Label>
              <Input
                id="keywords"
                placeholder="Comma separated keywords"
                value={filters.keywords ?? ""}
                onChange={(e) => setFilters({ ...filters, keywords: e.target.value })}
              />
            </div>
          </div>
        </div>

        <DialogFooter className="flex justify-between sm:justify-end sm:gap-2">
          <Button variant="outline" onClick={handleClear}>
            Clear
          </Button>
          <Button onClick={handleApply}>Apply Filters</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}

