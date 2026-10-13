import { describe, it, expect } from "vitest";
import request from "supertest";
import app from "../src/app.js";
import Book from "../src/models/Book.js";
import User from "../src/models/User.js";
import Transaction from "../src/models/Transaction.js";
import Fine from "../src/models/Fine.js";
import Payment from "../src/models/Payment.js";
import { createTestUser, getAuthToken } from "./helpers.js";

describe("Fines & Payments Test Suite (/api/fines, /api/payments)", () => {
  it("should manually create a fine by staff and update user finesOwed", async () => {
    const librarian = await createTestUser("librarian");
    const patron = await createTestUser("patron", { finesOwed: 0 });

    const book = await Book.create({
      title: "Damaged Book",
      author: "Author",
      isbn: "ISBN-FINE-1",
      category: "Fiction",
      totalCopies: 1,
      availableCopies: 1,
    });

    const tx = await Transaction.create({
      userId: patron._id,
      bookId: book._id,
      type: "borrow",
      status: "returned",
      issueDate: new Date(),
      dueDate: new Date(),
    });

    const token = getAuthToken(librarian);

    const res = await request(app)
      .post("/api/fines")
      .set("Authorization", `Bearer ${token}`)
      .send({
        userId: patron._id.toString(),
        transactionId: tx._id.toString(),
        amount: 25,
        reason: "damaged",
        reasonNote: "Torn pages in chapter 2",
      });

    expect(res.status).toBe(201);
    expect(res.body.success).toBe(true);
    expect(res.body.data.amount).toBe(25);
    expect(res.body.data.isPaid).toBe(false);

    // Verify patron finesOwed updated
    const updatedPatron = await User.findById(patron._id);
    expect(updatedPatron.finesOwed).toBe(25);
  });

  it("should waive a fine by staff and reduce user finesOwed", async () => {
    const admin = await createTestUser("admin");
    const patron = await createTestUser("patron", { finesOwed: 30 });

    const book = await Book.create({
      title: "Waived Book",
      author: "Author",
      isbn: "ISBN-WAIVE-1",
      category: "Fiction",
      totalCopies: 1,
      availableCopies: 1,
    });

    const tx = await Transaction.create({
      userId: patron._id,
      bookId: book._id,
      type: "borrow",
      status: "returned",
      issueDate: new Date(),
      dueDate: new Date(),
    });

    const fine = await Fine.create({
      userId: patron._id,
      transactionId: tx._id,
      amount: 30,
      reason: "overdue",
      isPaid: false,
    });

    const token = getAuthToken(admin);

    const res = await request(app)
      .put(`/api/fines/${fine._id}/waive`)
      .set("Authorization", `Bearer ${token}`)
      .send({ reason: "First-time courtesy waiver" });

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.data.fine.waivedAt).toBeDefined();

    // Verify patron balance updated
    const updatedPatron = await User.findById(patron._id);
    expect(updatedPatron.finesOwed).toBe(0);
  });

  it("should pay fine via payment endpoint and mark fine as paid", async () => {
    const librarian = await createTestUser("librarian");
    const patron = await createTestUser("patron", { finesOwed: 20 });

    const book = await Book.create({
      title: "Paid Fine Book",
      author: "Author",
      isbn: "ISBN-PAY-1",
      category: "Fiction",
      totalCopies: 1,
      availableCopies: 1,
    });

    const tx = await Transaction.create({
      userId: patron._id,
      bookId: book._id,
      type: "borrow",
      status: "returned",
      issueDate: new Date(),
      dueDate: new Date(),
    });

    const fine = await Fine.create({
      userId: patron._id,
      transactionId: tx._id,
      amount: 20,
      reason: "lost",
      isPaid: false,
    });

    const token = getAuthToken(librarian);

    const res = await request(app)
      .post("/api/payments")
      .set("Authorization", `Bearer ${token}`)
      .send({
        userId: patron._id.toString(),
        fineId: fine._id.toString(),
        amount: 20,
        method: "cash",
        notes: "Paid at library desk",
      });

    expect(res.status).toBe(201);
    expect(res.body.success).toBe(true);
    expect(res.body.data.status).toBe("completed");

    // Verify fine marked as paid
    const updatedFine = await Fine.findById(fine._id);
    expect(updatedFine.isPaid).toBe(true);
    expect(updatedFine.datePaid).toBeDefined();

    // Verify patron balance reduced
    const updatedPatron = await User.findById(patron._id);
    expect(updatedPatron.finesOwed).toBe(0);
  });
});
