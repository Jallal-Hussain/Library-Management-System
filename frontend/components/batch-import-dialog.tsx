"use client"

import { useState } from "react"
import { Upload, FileText, AlertCircle, CheckCircle, X, Loader2 } from "lucide-react"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { parseCSV, processImportData, type ImportResult } from "@/lib/import-utils"
import type { Book } from "@/lib/types"
import { toast } from "sonner"

interface BatchImportDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  onImport: (books: Partial<Book>[]) => void
}

export function BatchImportDialog({ open, onOpenChange, onImport }: BatchImportDialogProps) {
  const [csvText, setCsvText] = useState("")
  const [importResult, setImportResult] = useState<ImportResult | null>(null)
  const [isProcessing, setIsProcessing] = useState(false)
  const [file, setFile] = useState<File | null>(null)

  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0]
    if (!selectedFile) return

    if (!selectedFile.name.endsWith(".csv")) {
      toast.error("Please select a CSV file")
      return
    }

    setFile(selectedFile)
    const reader = new FileReader()
    reader.onload = (event) => {
      const text = event.target?.result as string
      setCsvText(text)
    }
    reader.readAsText(selectedFile)
  }

  const handlePreview = () => {
    if (!csvText.trim()) {
      toast.error("Please upload a CSV file or paste CSV data")
      return
    }

    setIsProcessing(true)
    try {
      const rows = parseCSV(csvText)
      const result = processImportData(rows)
      setImportResult(result)
    } catch (error) {
      toast.error("Failed to parse CSV file")
      console.error(error)
    } finally {
      setIsProcessing(false)
    }
  }

  const handleImport = () => {
    if (!importResult || importResult.books.length === 0) {
      toast.error("No valid books to import")
      return
    }

    onImport(importResult.books)
    toast.success(`Successfully imported ${importResult.books.length} book(s)`)
    handleReset()
    onOpenChange(false)
  }

  const handleReset = () => {
    setCsvText("")
    setImportResult(null)
    setFile(null)
  }

  const csvTemplate = `title,author,isbn,category,genre,publisher,publishYear,description,totalCopies,location,deweyClassification,keywords
"The Great Gatsby","F. Scott Fitzgerald","978-0743273565","Fiction","Classic Literature","Scribner","1925","A story of decadence and excess","5","A-12-3","813.52","fiction,classic,literature"
"1984","George Orwell","978-0451524935","Fiction","Dystopian","Signet Classic","1949","A dystopian social science fiction novel","4","A-12-4","823.912","fiction,dystopian,sci-fi"`

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Batch Import Books</DialogTitle>
          <DialogDescription>Import multiple books from a CSV file</DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          {/* File Upload */}
          <div className="space-y-2">
            <Label>Upload CSV File</Label>
            <div className="flex items-center gap-4">
              <div className="relative flex-1">
                <input
                  type="file"
                  accept=".csv"
                  onChange={handleFileSelect}
                  className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                />
                <Button variant="outline" className="w-full" type="button">
                  <Upload className="mr-2 h-4 w-4" />
                  {file ? file.name : "Choose CSV File"}
                </Button>
              </div>
              <Button onClick={handlePreview} disabled={!csvText || isProcessing}>
                {isProcessing ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Processing...
                  </>
                ) : (
                  <>
                    <FileText className="mr-2 h-4 w-4" />
                    Preview
                  </>
                )}
              </Button>
            </div>
          </div>

          {/* CSV Input */}
          <div className="space-y-2">
            <Label htmlFor="csv-text">Or Paste CSV Data</Label>
            <textarea
              id="csv-text"
              value={csvText}
              onChange={(e) => setCsvText(e.target.value)}
              placeholder="Paste CSV data here or upload a file..."
              className="w-full min-h-[150px] p-3 border rounded-md font-mono text-sm"
            />
          </div>

          {/* Template */}
          <Card>
            <CardHeader>
              <CardTitle className="text-sm">CSV Template</CardTitle>
              <CardDescription className="text-xs">
                Your CSV should include these columns: title, author, isbn (required), category, genre, publisher,
                publishYear, description, totalCopies, location, deweyClassification, keywords
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Button
                variant="outline"
                size="sm"
                onClick={() => {
                  setCsvText(csvTemplate)
                  toast.info("Template loaded")
                }}
              >
                Load Template
              </Button>
            </CardContent>
          </Card>

          {/* Preview Results */}
          {importResult && (
            <div className="space-y-4">
              {/* Summary */}
              <div className="grid grid-cols-3 gap-4">
                <Card>
                  <CardContent className="p-4">
                    <div className="flex items-center gap-2">
                      <CheckCircle className="h-5 w-5 text-green-600" />
                      <div>
                        <p className="text-2xl font-bold">{importResult.books.length}</p>
                        <p className="text-sm text-muted-foreground">Valid Books</p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
                <Card>
                  <CardContent className="p-4">
                    <div className="flex items-center gap-2">
                      <AlertCircle className="h-5 w-5 text-red-600" />
                      <div>
                        <p className="text-2xl font-bold">{importResult.errors.length}</p>
                        <p className="text-sm text-muted-foreground">Errors</p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
                <Card>
                  <CardContent className="p-4">
                    <div className="flex items-center gap-2">
                      <AlertCircle className="h-5 w-5 text-amber-600" />
                      <div>
                        <p className="text-2xl font-bold">{importResult.warnings.length}</p>
                        <p className="text-sm text-muted-foreground">Warnings</p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </div>

              {/* Errors */}
              {importResult.errors.length > 0 && (
                <Alert variant="destructive">
                  <AlertCircle className="h-4 w-4" />
                  <AlertTitle>Import Errors</AlertTitle>
                  <AlertDescription>
                    <ul className="list-disc list-inside mt-2 space-y-1">
                      {importResult.errors.slice(0, 10).map((error, index) => (
                        <li key={index} className="text-sm">
                          {error}
                        </li>
                      ))}
                      {importResult.errors.length > 10 && (
                        <li className="text-sm">... and {importResult.errors.length - 10} more errors</li>
                      )}
                    </ul>
                  </AlertDescription>
                </Alert>
              )}

              {/* Warnings */}
              {importResult.warnings.length > 0 && (
                <Alert>
                  <AlertCircle className="h-4 w-4" />
                  <AlertTitle>Warnings</AlertTitle>
                  <AlertDescription>
                    <ul className="list-disc list-inside mt-2 space-y-1">
                      {importResult.warnings.slice(0, 5).map((warning, index) => (
                        <li key={index} className="text-sm">
                          {warning}
                        </li>
                      ))}
                      {importResult.warnings.length > 5 && (
                        <li className="text-sm">... and {importResult.warnings.length - 5} more warnings</li>
                      )}
                    </ul>
                  </AlertDescription>
                </Alert>
              )}

              {/* Preview Table */}
              {importResult.books.length > 0 && (
                <Card>
                  <CardHeader>
                    <CardTitle className="text-sm">Preview ({importResult.books.length} books)</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="max-h-[300px] overflow-y-auto">
                      <Table>
                        <TableHeader>
                          <TableRow>
                            <TableHead>Title</TableHead>
                            <TableHead>Author</TableHead>
                            <TableHead>ISBN</TableHead>
                            <TableHead>Category</TableHead>
                            <TableHead>Copies</TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {importResult.books.slice(0, 10).map((book, index) => (
                            <TableRow key={index}>
                              <TableCell className="font-medium">{book.title}</TableCell>
                              <TableCell>{book.author}</TableCell>
                              <TableCell className="text-muted-foreground">{book.isbn}</TableCell>
                              <TableCell>{book.category}</TableCell>
                              <TableCell>{book.totalCopies}</TableCell>
                            </TableRow>
                          ))}
                        </TableBody>
                      </Table>
                      {importResult.books.length > 10 && (
                        <p className="text-sm text-muted-foreground mt-2 text-center">
                          ... and {importResult.books.length - 10} more books
                        </p>
                      )}
                    </div>
                  </CardContent>
                </Card>
              )}
            </div>
          )}
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={handleReset}>
            <X className="mr-2 h-4 w-4" />
            Reset
          </Button>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button onClick={handleImport} disabled={!importResult || importResult.books.length === 0}>
            <CheckCircle className="mr-2 h-4 w-4" />
            Import {importResult?.books.length || 0} Books
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}


