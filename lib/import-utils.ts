import type { Book } from "./types"

export interface ImportBookRow {
  title: string
  author: string
  isbn: string
  category?: string
  genre?: string
  publisher?: string
  publishYear?: string
  description?: string
  totalCopies?: string
  location?: string
  deweyClassification?: string
  keywords?: string
}

export interface ImportResult {
  success: boolean
  books: Partial<Book>[]
  errors: string[]
  warnings: string[]
}

export function parseCSV(csvText: string): ImportBookRow[] {
  const lines = csvText.split("\n").filter((line) => line.trim())
  if (lines.length === 0) return []

  // Parse header
  const headers = lines[0].split(",").map((h) => h.trim().toLowerCase().replace(/"/g, ""))
  const rows: ImportBookRow[] = []

  for (let i = 1; i < lines.length; i++) {
    const values = parseCSVLine(lines[i])
    if (values.length === 0) continue

    const row: ImportBookRow = {} as ImportBookRow
    headers.forEach((header, index) => {
      if (values[index]) {
        const value = values[index].trim().replace(/^"|"$/g, "")
        if (header === "title") row.title = value
        else if (header === "author") row.author = value
        else if (header === "isbn") row.isbn = value
        else if (header === "category") row.category = value
        else if (header === "genre") row.genre = value
        else if (header === "publisher") row.publisher = value
        else if (header === "publishyear" || header === "publish_year" || header === "year") row.publishYear = value
        else if (header === "description") row.description = value
        else if (header === "totalcopies" || header === "total_copies" || header === "copies") row.totalCopies = value
        else if (header === "location") row.location = value
        else if (header === "dewey" || header === "deweyclassification" || header === "dewey_classification")
          row.deweyClassification = value
        else if (header === "keywords" || header === "tags") row.keywords = value
      }
    })

    if (row.title && row.author && row.isbn) {
      rows.push(row)
    }
  }

  return rows
}

function parseCSVLine(line: string): string[] {
  const values: string[] = []
  let current = ""
  let inQuotes = false

  for (let i = 0; i < line.length; i++) {
    const char = line[i]

    if (char === '"') {
      if (inQuotes && line[i + 1] === '"') {
        current += '"'
        i++
      } else {
        inQuotes = !inQuotes
      }
    } else if (char === "," && !inQuotes) {
      values.push(current)
      current = ""
    } else {
      current += char
    }
  }
  values.push(current)

  return values
}

export function validateImportRow(row: ImportBookRow, index: number): { valid: boolean; errors: string[] } {
  const errors: string[] = []

  if (!row.title || row.title.trim() === "") {
    errors.push(`Row ${index + 1}: Title is required`)
  }
  if (!row.author || row.author.trim() === "") {
    errors.push(`Row ${index + 1}: Author is required`)
  }
  if (!row.isbn || row.isbn.trim() === "") {
    errors.push(`Row ${index + 1}: ISBN is required`)
  } else {
    const cleanIsbn = row.isbn.replace(/[-\s]/g, "")
    if (cleanIsbn.length !== 10 && cleanIsbn.length !== 13) {
      errors.push(`Row ${index + 1}: ISBN must be 10 or 13 digits`)
    }
  }

  if (row.publishYear) {
    const year = Number.parseInt(row.publishYear)
    if (isNaN(year) || year < 1000 || year > new Date().getFullYear() + 1) {
      errors.push(`Row ${index + 1}: Invalid publish year`)
    }
  }

  if (row.totalCopies) {
    const copies = Number.parseInt(row.totalCopies)
    if (isNaN(copies) || copies < 1) {
      errors.push(`Row ${index + 1}: Total copies must be a positive number`)
    }
  }

  return {
    valid: errors.length === 0,
    errors,
  }
}

export function convertRowToBook(row: ImportBookRow, index: number): { book: Partial<Book>; warnings: string[] } {
  const warnings: string[] = []
  const book: Partial<Book> = {
    title: row.title.trim(),
    author: row.author.trim(),
    isbn: row.isbn.replace(/[-\s]/g, ""),
    category: row.category?.trim() || "Uncategorized",
    genre: row.genre?.trim() || "",
    publisher: row.publisher?.trim() || "",
    publishYear: row.publishYear ? Number.parseInt(row.publishYear) : new Date().getFullYear(),
    description: row.description?.trim() || "",
    totalCopies: row.totalCopies ? Number.parseInt(row.totalCopies) : 1,
    availableCopies: row.totalCopies ? Number.parseInt(row.totalCopies) : 1,
    location: row.location?.trim() || "TBD",
    deweyClassification: row.deweyClassification?.trim() || "",
    keywords: row.keywords
      ? row.keywords
          .split(",")
          .map((k) => k.trim().toLowerCase())
          .filter((k) => k.length > 0)
      : [],
    status: "available",
    addedDate: new Date().toISOString().split("T")[0],
  }

  if (!row.category) {
    warnings.push(`Row ${index + 1}: No category specified, using "Uncategorized"`)
  }
  if (!row.location) {
    warnings.push(`Row ${index + 1}: No location specified, using "TBD"`)
  }

  return { book, warnings }
}

export function processImportData(rows: ImportBookRow[]): ImportResult {
  const books: Partial<Book>[] = []
  const errors: string[] = []
  const warnings: string[] = []

  rows.forEach((row, index) => {
    const validation = validateImportRow(row, index)
    if (!validation.valid) {
      errors.push(...validation.errors)
      return
    }

    const { book, warnings: rowWarnings } = convertRowToBook(row, index)
    books.push(book)
    warnings.push(...rowWarnings)
  })

  return {
    success: errors.length === 0,
    books,
    errors,
    warnings,
  }
}


