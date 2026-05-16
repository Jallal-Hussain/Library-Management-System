// User Types
export type UserRole = "admin" | "librarian" | "patron"

export interface User {
  id: string
  email: string
  name: string
  role: UserRole
  membershipId?: string
  phone?: string
  address?: string
  joinDate: string
  membershipExpiry?: string
  borrowingLimit: number
  currentBorrows: number
  finesOwed: number
  isActive: boolean
  approvalStatus?: "pending" | "approved" | "rejected"
}

// Book Types
export type BookStatus = "available" | "borrowed" | "reserved" | "lost" | "damaged"

export interface Book {
  id: string
  title: string
  author: string
  isbn: string
  category: string
  genre: string
  publisher: string
  publishYear: number
  description: string
  coverImage?: string
  totalCopies: number
  availableCopies: number
  status: BookStatus
  location: string
  addedDate: string
  deweyClassification?: string
  keywords?: string[]
  branchId?: string
}

// Transaction Types
export type TransactionType = "borrow" | "return" | "renew" | "reserve"
export type TransactionStatus = "active" | "returned" | "overdue" | "lost"

export interface Transaction {
  id: string
  userId: string
  userName: string
  bookId: string
  bookTitle: string
  type: TransactionType
  status: TransactionStatus
  issueDate: string
  dueDate: string
  returnDate?: string
  renewCount: number
  fine: number
  finePaid: boolean
  branchId?: string
}

// Reservation Types
export interface Reservation {
  id: string
  userId: string
  userName: string
  bookId: string
  bookTitle: string
  reserveDate: string
  queuePosition: number
  status: "pending" | "ready" | "cancelled" | "fulfilled"
  notificationSent: boolean
}

// Fine Types
export interface Fine {
  id: string
  userId: string
  transactionId: string
  amount: number
  reason: string
  dateIssued: string
  datePaid?: string
  isPaid: boolean
}

// Dashboard Stats
export interface DashboardStats {
  totalBooks: number
  totalMembers: number
  activeLoans: number
  overdueBooks: number
  reservations: number
  finesCollected: number
  newMembersThisMonth: number
  booksAddedThisMonth: number
}

// Category for filtering
export interface Category {
  id: string
  name: string
  count: number
}

// Fee Structure Types
export type FeeType = "overdue" | "lost" | "damaged" | "processing"

export interface FeeStructure {
  id: string
  type: FeeType
  name: string
  rate: number
  rateType: "per_day" | "fixed" | "percentage"
  maxAmount?: number
  isActive: boolean
}

// Invoice Types
export interface Invoice {
  id: string
  invoiceNumber: string
  acquisitionId: string
  vendorId: string
  vendorName: string
  amount: number
  issueDate: string
  dueDate: string
  paymentStatus: "pending" | "paid" | "overdue"
  paymentDate?: string
  paymentMethod?: "card" | "cash" | "check" | "transfer"
  notes?: string
}

// Branch Types
export interface Branch {
  id: string
  name: string
  address: string
  phone?: string
  email?: string
  isActive: boolean
}

// Integration Configuration Types
export interface IntegrationConfig {
  id: string
  name: string
  type: "payment_gateway" | "student_db" | "bibliographic_api" | "ill_api"
  provider: string
  apiKey?: string
  apiSecret?: string
  endpoint?: string
  isActive: boolean
  config?: Record<string, unknown>
}

// Budget Types
export interface Budget {
  id: string
  name: string
  category?: string
  totalAmount: number
  spentAmount: number
  startDate: string
  endDate: string
  isActive: boolean
}

// Acquisition Types (extended)
export interface Acquisition {
  id: string
  title: string
  author: string
  isbn: string
  vendor: string
  vendorId: string
  quantity: number
  unitPrice: number
  totalPrice: number
  status: "requested" | "approved" | "ordered" | "received"
  requestDate: string
  orderDate?: string
  receivedDate?: string
  invoiceId?: string
  notes?: string
  branchId?: string
}

// Vendor Quote Types
export interface VendorQuote {
  id: string
  acquisitionId: string
  vendorId: string
  vendorName: string
  price: number
  deliveryDays: number
  terms: string
  validUntil: string
  status: "pending" | "accepted" | "rejected"
  submittedDate: string
}

// Payment Types
export interface Payment {
  id: string
  userId: string
  fineId?: string
  amount: number
  method: "card" | "cash" | "check" | "transfer"
  status: "pending" | "completed" | "failed"
  transactionId?: string
  receiptNumber: string
  paymentDate: string
  notes?: string
}
