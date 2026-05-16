import { mockBooks, mockUsers, mockTransactions } from "./mock-data"
import type { Book, Transaction, User } from "./types"

export interface SearchResults {
  books: Book[]
  members: User[]
  transactions: Transaction[]
}

export function performSearch(query: string): SearchResults {
  const term = query.trim().toLowerCase()
  if (!term) return { books: [], members: [], transactions: [] }

  const books = mockBooks.filter(
    (book) =>
      book.title.toLowerCase().includes(term) ||
      book.author.toLowerCase().includes(term) ||
      (book.keywords && book.keywords.some((k) => k.toLowerCase().includes(term))),
  )

  const members = mockUsers.filter(
    (user) => user.name.toLowerCase().includes(term) || user.email.toLowerCase().includes(term),
  )

  const transactions = mockTransactions.filter(
    (tx) =>
      tx.bookTitle.toLowerCase().includes(term) ||
      tx.userName.toLowerCase().includes(term) ||
      tx.type.toLowerCase().includes(term) ||
      tx.status.toLowerCase().includes(term),
  )

  return { books, members, transactions }
}

