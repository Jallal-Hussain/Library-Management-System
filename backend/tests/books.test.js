import { describe, it, expect } from "vitest";
import request from "supertest";
import app from "../src/app.js";
import Book from "../src/models/Book.js";
import { createTestUser, getAuthToken } from "./helpers.js";

describe("Books Test Suite (/api/books)", () => {
  const sampleBook = {
    title: "Clean Architecture",
    author: "Robert C. Martin",
    isbn: "9780134494166",
    category: "Technology",
    totalCopies: 5,
    availableCopies: 5,
  };

  it("should allow librarian to create a book and reject duplicate ISBN", async () => {
    const librarian = await createTestUser("librarian");
    const token = getAuthToken(librarian);

    // Create book
    const res = await request(app)
      .post("/api/books")
      .set("Authorization", `Bearer ${token}`)
      .send(sampleBook);

    expect(res.status).toBe(201);
    expect(res.body.success).toBe(true);
    expect(res.body.data.title).toBe(sampleBook.title);
    expect(res.body.data.isbn).toBe(sampleBook.isbn);

    // Try creating duplicate ISBN
    const duplicateRes = await request(app)
      .post("/api/books")
      .set("Authorization", `Bearer ${token}`)
      .send({ ...sampleBook, title: "Different Title" });

    expect(duplicateRes.status).toBe(409);
    expect(duplicateRes.body.success).toBe(false);
  });

  it("should prevent patron from creating a book (403)", async () => {
    const patron = await createTestUser("patron");
    const token = getAuthToken(patron);

    const res = await request(app)
      .post("/api/books")
      .set("Authorization", `Bearer ${token}`)
      .send({ ...sampleBook, isbn: "9781234567890" });

    expect(res.status).toBe(403);
  });

  it("should filter books by category and status and support pagination", async () => {
    // Seed books
    await Book.create([
      { title: "Tech Book 1", author: "Author A", isbn: "ISBN-001", category: "Tech", status: "available", totalCopies: 2, availableCopies: 2 },
      { title: "Tech Book 2", author: "Author B", isbn: "ISBN-002", category: "Tech", status: "available", totalCopies: 1, availableCopies: 1 },
      { title: "Fiction Book", author: "Author C", isbn: "ISBN-003", category: "Fiction", status: "available", totalCopies: 3, availableCopies: 3 },
    ]);

    // Query Tech books
    const filterRes = await request(app)
      .get("/api/books?category=Tech")
      .expect(200);

    expect(filterRes.body.data.length).toBe(2);
    expect(filterRes.body.pagination.total).toBe(2);

    // Query with pagination limit=1
    const pageRes = await request(app)
      .get("/api/books?limit=1&page=1")
      .expect(200);

    expect(pageRes.body.data.length).toBe(1);
    expect(pageRes.body.pagination.page).toBe(1);
    expect(pageRes.body.pagination.totalPages).toBe(3);
  });

  it("should update a book successfully", async () => {
    const admin = await createTestUser("admin");
    const token = getAuthToken(admin);

    const book = await Book.create({
      title: "Original Title",
      author: "Original Author",
      isbn: "ISBN-UPDATE-1",
      category: "Science",
      totalCopies: 4,
      availableCopies: 4,
    });

    const updateRes = await request(app)
      .put(`/api/books/${book._id}`)
      .set("Authorization", `Bearer ${token}`)
      .send({ title: "Updated Title", totalCopies: 6 });

    expect(updateRes.status).toBe(200);
    expect(updateRes.body.data.title).toBe("Updated Title");
    expect(updateRes.body.data.totalCopies).toBe(6);
  });

  it("should soft delete a book (isActive: false) by admin", async () => {
    const admin = await createTestUser("admin");
    const token = getAuthToken(admin);

    const book = await Book.create({
      title: "Delete Me",
      author: "Author",
      isbn: "ISBN-DELETE-1",
      category: "History",
      totalCopies: 1,
      availableCopies: 1,
    });

    const delRes = await request(app)
      .delete(`/api/books/${book._id}`)
      .set("Authorization", `Bearer ${token}`);

    expect(delRes.status).toBe(200);

    // Confirm book is no longer listed in active books
    const getRes = await request(app).get(`/api/books/${book._id}`);
    expect(getRes.status).toBe(404);

    // Confirm book still exists in DB with isActive: false
    const rawBook = await Book.findById(book._id);
    expect(rawBook.isActive).toBe(false);
  });
});
