// Circulation and Fine Calculation Utilities

export const CURRENCY_SYMBOL = "Rs."
export const CURRENCY_RATE_PKR = 280 // 1 USD = 280 PKR
export const FINE_RATE_PER_DAY = 50 // Rs.50 per day overdue
export const MAX_RENEWALS = 2
export const LOAN_PERIOD_DAYS = 14
export const MAX_BOOKS_PATRON = 5
export const MAX_BOOKS_LIBRARIAN = 15
export const MAX_FINE_THRESHOLD = 2500 // Block checkouts if fines exceed this amount Rs.2500.00

export function calculateFine(dueDate: string, returnDate?: string): number {
  const due = new Date(dueDate)
  const returned = returnDate ? new Date(returnDate) : new Date()

  const diffTime = returned.getTime() - due.getTime()
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24))

  if (diffDays <= 0) return 0
  return Math.round(diffDays * FINE_RATE_PER_DAY * 100) / 100
}

export function getDueDate(issueDate: string = new Date().toISOString()): string {
  const issue = new Date(issueDate)
  issue.setDate(issue.getDate() + LOAN_PERIOD_DAYS)
  return issue.toISOString().split("T")[0]
}

export function isOverdue(dueDate: string): boolean {
  return new Date(dueDate) < new Date()
}

export function getDaysUntilDue(dueDate: string): number {
  const due = new Date(dueDate)
  const today = new Date()
  const diffTime = due.getTime() - today.getTime()
  return Math.ceil(diffTime / (1000 * 60 * 60 * 24))
}

export function canRenew(renewCount: number, hasHolds = false): boolean {
  return renewCount < MAX_RENEWALS && !hasHolds
}

export function formatCurrency(amountUSD: number): string {
  const amountPKR = amountUSD * CURRENCY_RATE_PKR
  const formatted = new Intl.NumberFormat("en-PK", {
    style: "currency",
    currency: "PKR",
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(amountPKR)

  // Ensure symbol shown as Rs. for consistency
  return formatted.replace("₨", `${CURRENCY_SYMBOL} `)
}

// Role-based policy functions
export type UserRole = "admin" | "librarian" | "patron"

// Default role-based policies (can be overridden by settings)
const DEFAULT_ROLE_POLICIES: Record<UserRole, { loanPeriod: number; maxBooks: number }> = {
  patron: { loanPeriod: 14, maxBooks: 5 },
  librarian: { loanPeriod: 21, maxBooks: 15 },
  admin: { loanPeriod: 30, maxBooks: 20 },
}

// Store role policies (in production, this would come from backend/settings)
let rolePolicies: Record<UserRole, { loanPeriod: number; maxBooks: number }> = DEFAULT_ROLE_POLICIES

export function setRolePolicies(policies: Record<UserRole, { loanPeriod: number; maxBooks: number }>) {
  rolePolicies = policies
}

export function getLoanPeriod(role: UserRole): number {
  return rolePolicies[role]?.loanPeriod || DEFAULT_ROLE_POLICIES[role].loanPeriod
}

export function getMaxBooks(role: UserRole): number {
  return rolePolicies[role]?.maxBooks || DEFAULT_ROLE_POLICIES[role].maxBooks
}

export function canCheckout(user: { role: UserRole; currentBorrows: number; finesOwed: number; membershipExpiry?: string }): { allowed: boolean; reason?: string } {
  if (user.finesOwed > MAX_FINE_THRESHOLD) {
    return { allowed: false, reason: `Excessive fines (${CURRENCY_SYMBOL}${user.finesOwed.toFixed(2)}). Please pay before checking out.` }
  }
  
  const maxBooks = getMaxBooks(user.role)
  if (user.currentBorrows >= maxBooks) {
    return { allowed: false, reason: `Borrowing limit reached (${user.currentBorrows}/${maxBooks} books).` }
  }

  return { allowed: true }
}
