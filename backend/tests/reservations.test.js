import { describe, it, expect } from "vitest";
import request from "supertest";
import app from "../src/app.js";
import Book from "../src/models/Book.js";
import Reservation from "../src/models/Reservation.js";
import Transaction from "../src/models/Transaction.js";
import Notification from "../src/models/Notification.js";
import { createTestUser, getAuthToken } from "./helpers.js";

describe("Reservations Test Suite (/api/reservations)", () => {
  it("should create reservation with queue position and prevent duplicate hold", async () => {
    const patron1 = await createTestUser("patron");
    const patron2 = await createTestUser("patron");

    const book = await Book.create({
      title: "Reserved Book",
      author: "Author",
      isbn: "ISBN-RES-1",
      category: "Fiction",
      totalCopies: 1,
      availableCopies: 0,
      status: "borrowed",
    });

    const token1 = getAuthToken(patron1);
    const token2 = getAuthToken(patron2);

    // Patron 1 reserves
    const res1 = await request(app)
      .post("/api/reservations")
      .set("Authorization", `Bearer ${token1}`)
      .send({ bookId: book._id.toString() });

    expect(res1.status).toBe(201);
    expect(res1.body.data.queuePosition).toBe(1);
    expect(res1.body.data.status).toBe("pending");

    // Patron 2 reserves same book
    const res2 = await request(app)
      .post("/api/reservations")
      .set("Authorization", `Bearer ${token2}`)
      .send({ bookId: book._id.toString() });

    expect(res2.status).toBe(201);
    expect(res2.body.data.queuePosition).toBe(2);

    // Patron 1 tries reserving again -> rejected
    const dupRes = await request(app)
      .post("/api/reservations")
      .set("Authorization", `Bearer ${token1}`)
      .send({ bookId: book._id.toString() });

    expect(dupRes.status).toBe(400);
    expect(dupRes.body.message).toMatch(/already have an active reservation/i);
  });

  it("should transition first reservation to ready when book is returned", async () => {
    const librarian = await createTestUser("librarian");
    const borrower = await createTestUser("patron");
    const reserver = await createTestUser("patron");

    const book = await Book.create({
      title: "Queue Book",
      author: "Author",
      isbn: "ISBN-QUEUE-1",
      category: "Fiction",
      totalCopies: 1,
      availableCopies: 0,
      status: "borrowed",
    });

    // Borrower has active transaction
    const tx = await Transaction.create({
      userId: borrower._id,
      bookId: book._id,
      type: "borrow",
      status: "active",
      issueDate: new Date(),
      dueDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
    });

    // Reserver has pending reservation
    const reservation = await Reservation.create({
      userId: reserver._id,
      bookId: book._id,
      queuePosition: 1,
      status: "pending",
    });

    const librarianToken = getAuthToken(librarian);

    // Return book
    const returnRes = await request(app)
      .put(`/api/transactions/return/${tx._id}`)
      .set("Authorization", `Bearer ${librarianToken}`)
      .send();

    expect(returnRes.status).toBe(200);

    // Check reservation updated to ready
    const updatedRes = await Reservation.findById(reservation._id);
    expect(updatedRes.status).toBe("ready");
    expect(updatedRes.expiryDate).toBeDefined();

    // Check book status is reserved
    const updatedBook = await Book.findById(book._id);
    expect(updatedBook.status).toBe("reserved");
    expect(updatedBook.availableCopies).toBe(0);

    // Check notification was sent to reserver
    const notice = await Notification.findOne({ userId: reserver._id, type: "reservation_ready" });
    expect(notice).not.toBeNull();
  });
});
