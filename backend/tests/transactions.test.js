import { describe, it, expect } from "vitest";
import request from "supertest";
import app from "../src/app.js";
import Book from "../src/models/Book.js";
import User from "../src/models/User.js";
import Transaction from "../src/models/Transaction.js";
import Fine from "../src/models/Fine.js";
import FeeStructure from "../src/models/FeeStructure.js";
import { createTestUser, getAuthToken } from "./helpers.js";

describe("Transactions Test Suite (/api/transactions)", () => {
  it("should borrow an available book, decrement availableCopies, and update status", async () => {
    const librarian = await createTestUser("librarian");
    const patron = await createTestUser("patron");
    const book = await Book.create({
      title: "JavaScript Basics",
      author: "Jane Coder",
      isbn: "ISBN-BORROW-1",
      category: "Programming",
      totalCopies: 2,
      availableCopies: 2,
      status: "available",
    });

    const token = getAuthToken(librarian);

    const res = await request(app)
      .post("/api/transactions/borrow")
      .set("Authorization", `Bearer ${token}`)
      .send({ userId: patron._id.toString(), bookId: book._id.toString() });

    expect(res.status).toBe(201);
    expect(res.body.success).toBe(true);
    expect(res.body.data.status).toBe("active");

    // Verify book copies decreased
    const updatedBook = await Book.findById(book._id);
    expect(updatedBook.availableCopies).toBe(1);

    // Verify patron currentBorrows increased
    const updatedPatron = await User.findById(patron._id);
    expect(updatedPatron.currentBorrows).toBe(1);
  });

  it("should enforce borrowing limit when patron reaches max borrows", async () => {
    const librarian = await createTestUser("librarian");
    const patron = await createTestUser("patron", { borrowingLimit: 1, currentBorrows: 1 });
    const book = await Book.create({
      title: "Another Book",
      author: "Author",
      isbn: "ISBN-LIMIT-1",
      category: "Tech",
      totalCopies: 3,
      availableCopies: 3,
      status: "available",
    });

    const token = getAuthToken(librarian);

    const res = await request(app)
      .post("/api/transactions/borrow")
      .set("Authorization", `Bearer ${token}`)
      .send({ userId: patron._id.toString(), bookId: book._id.toString() });

    expect(res.status).toBe(400);
    expect(res.body.message).toMatch(/borrowing limit/i);
  });

  it("should return a book and increment availableCopies", async () => {
    const librarian = await createTestUser("librarian");
    const patron = await createTestUser("patron", { currentBorrows: 1 });
    const book = await Book.create({
      title: "Return Book",
      author: "Author",
      isbn: "ISBN-RETURN-1",
      category: "Literature",
      totalCopies: 1,
      availableCopies: 0,
      status: "borrowed",
    });

    const tx = await Transaction.create({
      userId: patron._id,
      bookId: book._id,
      type: "borrow",
      status: "active",
      issueDate: new Date(),
      dueDate: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000), // due in 14 days
    });

    const token = getAuthToken(librarian);

    const res = await request(app)
      .put(`/api/transactions/return/${tx._id}`)
      .set("Authorization", `Bearer ${token}`)
      .send();

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.data.transaction.status).toBe("returned");

    // Verify book copies restored
    const updatedBook = await Book.findById(book._id);
    expect(updatedBook.availableCopies).toBe(1);
    expect(updatedBook.status).toBe("available");

    // Verify patron currentBorrows decremented
    const updatedPatron = await User.findById(patron._id);
    expect(updatedPatron.currentBorrows).toBe(0);
  });

  it("should generate late fine on returning overdue book and update patron finesOwed", async () => {
    // Seed active fee structure for overdue fine
    await FeeStructure.create({
      feeType: "overdue",
      name: "Standard Overdue Fine",
      amount: 5,
      frequency: "daily",
      isActive: true,
    });

    const librarian = await createTestUser("librarian");
    const patron = await createTestUser("patron", { currentBorrows: 1, finesOwed: 0 });
    const book = await Book.create({
      title: "Late Book",
      author: "Author",
      isbn: "ISBN-LATE-1",
      category: "Law",
      totalCopies: 1,
      availableCopies: 0,
      status: "borrowed",
    });

    // 4 days overdue
    const fourDaysAgo = new Date(Date.now() - 4 * 24 * 60 * 60 * 1000);
    const tx = await Transaction.create({
      userId: patron._id,
      bookId: book._id,
      type: "borrow",
      status: "overdue",
      issueDate: new Date(Date.now() - 18 * 24 * 60 * 60 * 1000),
      dueDate: fourDaysAgo,
    });

    const token = getAuthToken(librarian);

    const res = await request(app)
      .put(`/api/transactions/return/${tx._id}`)
      .set("Authorization", `Bearer ${token}`)
      .send();

    expect(res.status).toBe(200);
    expect(res.body.data.fineAmount).toBeGreaterThan(0);

    // Verify Fine document created
    const fineDoc = await Fine.findOne({ transactionId: tx._id });
    expect(fineDoc).not.toBeNull();
    expect(fineDoc.amount).toBe(res.body.data.fineAmount);

    // Verify patron finesOwed updated
    const updatedPatron = await User.findById(patron._id);
    expect(updatedPatron.finesOwed).toBe(fineDoc.amount);
  });
});
