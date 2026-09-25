/**
 * Seed Script — populates the DB with initial data for development.
 * Run with: npm run seed
 *
 * Creates:
 *  - 3 branches
 *  - 3 users (admin, librarian, patron)
 *  - 8 sample books
 *  - Default fee structures
 *  - Default settings
 */

import "dotenv/config";
import mongoose from "mongoose";
import User from "../src/models/User.js";
import Book from "../src/models/Book.js";
import Branch from "../src/models/Branch.js";
import FeeStructure from "../src/models/FeeStructure.js";
import Settings from "../src/models/Settings.js";

// ── Connect ───────────────────────────────────────────────────────────────────
const connect = async () => {
  await mongoose.connect(process.env.MONGO_URI);
  console.log("✅ DB connected");
};

// ── Seed Data ─────────────────────────────────────────────────────────────────

const branches = [
  { name: "Main Library",   address: "123 Library Lane, Booktown",    phone: "(555) 123-4567", email: "main@libraryhub.com",   isActive: true },
  { name: "North Branch",   address: "456 North Street, Booktown",    phone: "(555) 123-4568", email: "north@libraryhub.com",  isActive: true },
  { name: "South Branch",   address: "789 South Avenue, Booktown",    phone: "(555) 123-4569", email: "south@libraryhub.com",  isActive: true },
];

const users = [
  {
    name: "Admin User",
    email: "admin@library.com",
    passwordHash: "password123",    // pre-save hook hashes it
    role: "admin",
    membershipId: "ADM001",
    phone: "555-0100",
    address: "123 Library Lane",
    borrowingLimit: 20,
    isActive: true,
    approvalStatus: "approved",
  },
  {
    name: "Sarah Johnson",
    email: "librarian@library.com",
    passwordHash: "password123",
    role: "librarian",
    membershipId: "LIB001",
    phone: "555-0101",
    address: "456 Book Street",
    borrowingLimit: 15,
    isActive: true,
    approvalStatus: "approved",
  },
  {
    name: "John Smith",
    email: "john@email.com",
    passwordHash: "password123",
    role: "patron",
    membershipId: "PAT001",
    phone: "555-0102",
    address: "789 Reader Road",
    borrowingLimit: 5,
    isActive: true,
    approvalStatus: "approved",
  },
];

const books = [
  { title: "The Great Gatsby",               author: "F. Scott Fitzgerald", isbn: "978-0743273565", category: "Fiction",     genre: "Classic Literature", publisher: "Scribner",          publishYear: 1925, totalCopies: 5, availableCopies: 3, location: "A-12-3", deweyClassification: "813.52" },
  { title: "1984",                           author: "George Orwell",        isbn: "978-0451524935", category: "Fiction",     genre: "Dystopian",         publisher: "Signet Classic",     publishYear: 1949, totalCopies: 4, availableCopies: 1, location: "A-12-4", deweyClassification: "823.912" },
  { title: "To Kill a Mockingbird",          author: "Harper Lee",           isbn: "978-0060935467", category: "Fiction",     genre: "Southern Gothic",   publisher: "Harper Perennial",   publishYear: 1960, totalCopies: 6, availableCopies: 4, location: "A-13-1", deweyClassification: "813.54" },
  { title: "Clean Code",                     author: "Robert C. Martin",     isbn: "978-0132350884", category: "Technology",  genre: "Programming",       publisher: "Prentice Hall",      publishYear: 2008, totalCopies: 3, availableCopies: 0, location: "C-05-2", deweyClassification: "005.1", status: "borrowed" },
  { title: "A Brief History of Time",        author: "Stephen Hawking",      isbn: "978-0553380163", category: "Science",     genre: "Physics",           publisher: "Bantam",             publishYear: 1988, totalCopies: 2, availableCopies: 2, location: "B-08-3", deweyClassification: "523.1" },
  { title: "Pride and Prejudice",            author: "Jane Austen",          isbn: "978-0141439518", category: "Fiction",     genre: "Romance",           publisher: "Penguin Classics",   publishYear: 1813, totalCopies: 4, availableCopies: 3, location: "A-14-2", deweyClassification: "823.7" },
  { title: "The Design of Everyday Things",  author: "Don Norman",           isbn: "978-0465050659", category: "Design",      genre: "UX Design",         publisher: "Basic Books",        publishYear: 2013, totalCopies: 2, availableCopies: 1, location: "D-02-1", deweyClassification: "745.2" },
  { title: "Sapiens: A Brief History of Humankind", author: "Yuval Noah Harari", isbn: "978-0062316097", category: "History", genre: "World History",    publisher: "Harper",             publishYear: 2015, totalCopies: 5, availableCopies: 2, location: "B-03-4", deweyClassification: "909" },
];

const feeStructures = [
  { type: "overdue",    name: "Standard Overdue Fine",      rate: 50,    rateType: "per_day", maxAmount: 2500, isActive: true },
  { type: "lost",       name: "Lost Book Replacement Fee",  rate: 2800,  rateType: "fixed",   isActive: true },
  { type: "damaged",    name: "Book Damage Fee",            rate: 25,    rateType: "percentage", maxAmount: 1500, isActive: true },
  { type: "processing", name: "Processing Fee",             rate: 100,   rateType: "fixed",   isActive: true },
];

const defaultSettings = [
  { key: "loan_period_patron",    value: 14,   label: "Patron Loan Period (days)",     group: "circulation" },
  { key: "loan_period_librarian", value: 21,   label: "Librarian Loan Period (days)",  group: "circulation" },
  { key: "loan_period_admin",     value: 30,   label: "Admin Loan Period (days)",      group: "circulation" },
  { key: "max_books_patron",      value: 5,    label: "Max Books — Patron",            group: "circulation" },
  { key: "max_books_librarian",   value: 15,   label: "Max Books — Librarian",         group: "circulation" },
  { key: "max_books_admin",       value: 20,   label: "Max Books — Admin",             group: "circulation" },
  { key: "max_renewals",          value: 2,    label: "Maximum Renewals",              group: "circulation" },
  { key: "fine_rate_per_day",     value: 50,   label: "Fine Rate per Day (PKR)",       group: "fines" },
  { key: "fine_block_threshold",  value: 2500, label: "Fine Block Threshold (PKR)",    group: "fines" },
  { key: "reservation_hold_days", value: 3,    label: "Reservation Hold Days",         group: "circulation" },
  { key: "currency_symbol",       value: "Rs.",label: "Currency Symbol",               group: "general" },
  { key: "library_name",          value: "LibraryHub", label: "Library Name",          group: "general" },
];

// ── Main Seed Function ────────────────────────────────────────────────────────
const seed = async () => {
  await connect();

  console.log("\n🌱 Starting seed...\n");

  // ── Branches ────────────────────────────────────────────────────────────────
  await Branch.deleteMany({});
  const createdBranches = await Branch.insertMany(branches);
  const mainBranch = createdBranches[0];
  console.log(`✅ ${createdBranches.length} branches seeded`);

  // ── Users ───────────────────────────────────────────────────────────────────
  await User.deleteMany({});
  // Save individually so pre-save hook hashes passwords
  for (const userData of users) {
    const user = new User({ ...userData, branchId: mainBranch._id });
    await user.save();
  }
  console.log(`✅ ${users.length} users seeded`);
  console.log("   admin@library.com     / password123  (admin)");
  console.log("   librarian@library.com / password123  (librarian)");
  console.log("   john@email.com        / password123  (patron)");

  // ── Books ───────────────────────────────────────────────────────────────────
  await Book.deleteMany({});
  await Book.insertMany(books.map((b) => ({ ...b, branchId: mainBranch._id })));
  console.log(`✅ ${books.length} books seeded`);

  // ── Fee Structures ──────────────────────────────────────────────────────────
  await FeeStructure.deleteMany({});
  await FeeStructure.insertMany(feeStructures);
  console.log(`✅ ${feeStructures.length} fee structures seeded`);

  // ── Settings ────────────────────────────────────────────────────────────────
  await Settings.deleteMany({});
  await Settings.insertMany(defaultSettings);
  console.log(`✅ ${defaultSettings.length} settings seeded`);

  console.log("\n🎉 Seed complete!\n");
  process.exit(0);
};

seed().catch((err) => {
  console.error("❌ Seed failed:", err.message);
  process.exit(1);
});
