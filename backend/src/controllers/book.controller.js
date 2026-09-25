import Book from "../models/Book.js";
import { sendSuccess, createError } from "../utils/apiResponse.js";

// ── Helpers ───────────────────────────────────────────────────────────────────

/** Build a Mongoose query filter from request query params */
const buildFilter = (query) => {
  const filter = { isActive: true };

  // Full-text search via MongoDB $text index
  if (query.q && query.q.trim()) {
    filter.$text = { $search: query.q.trim() };
  }

  if (query.category) filter.category = query.category;
  if (query.status)   filter.status   = query.status;
  if (query.genre)    filter.genre     = query.genre;
  if (query.branchId) filter.branchId  = query.branchId;

  // Availability quick filter
  if (query.available === "true") {
    filter.availableCopies = { $gt: 0 };
  }

  // Publish year range
  if (query.yearFrom || query.yearTo) {
    filter.publishYear = {};
    if (query.yearFrom) filter.publishYear.$gte = Number(query.yearFrom);
    if (query.yearTo)   filter.publishYear.$lte = Number(query.yearTo);
  }

  return filter;
};

// ─────────────────────────────────────────────────────────────────────────────
// GET /api/books
// Query params: q, category, status, genre, branchId, available, yearFrom,
//               yearTo, page, limit, sort
// ─────────────────────────────────────────────────────────────────────────────
export const getBooks = async (req, res, next) => {
  try {
    const page  = Math.max(1, parseInt(req.query.page)  || 1);
    const limit = Math.min(100, Math.max(1, parseInt(req.query.limit) || 20));
    const skip  = (page - 1) * limit;

    const filter = buildFilter(req.query);

    // Sort — if full-text search, default to relevance score
    let sort = {};
    if (req.query.q && req.query.q.trim()) {
      sort = { score: { $meta: "textScore" } };
    } else {
      const ALLOWED_SORTS = {
        title:       { title: 1 },
        "-title":    { title: -1 },
        author:      { author: 1 },
        "-author":   { author: -1 },
        newest:      { createdAt: -1 },
        oldest:      { createdAt: 1 },
        publishYear: { publishYear: -1 },
      };
      sort = ALLOWED_SORTS[req.query.sort] || { createdAt: -1 };
    }

    // Run count + data queries in parallel
    const projection = req.query.q && req.query.q.trim()
      ? { score: { $meta: "textScore" } }
      : {};

    const [total, books] = await Promise.all([
      Book.countDocuments(filter),
      Book.find(filter, projection)
          .sort(sort)
          .skip(skip)
          .limit(limit)
          .lean(),
    ]);

    const totalPages = Math.ceil(total / limit);

    return sendSuccess(res, 200, "Books fetched successfully.", books, {
      total,
      page,
      limit,
      totalPages,
      hasNextPage: page < totalPages,
      hasPrevPage: page > 1,
    });
  } catch (err) {
    next(err);
  }
};

// ─────────────────────────────────────────────────────────────────────────────
// GET /api/books/categories
// ─────────────────────────────────────────────────────────────────────────────
export const getCategories = async (req, res, next) => {
  try {
    const categories = await Book.aggregate([
      { $match: { isActive: true } },
      { $group: { _id: "$category", count: { $sum: 1 } } },
      { $sort: { count: -1 } },
      { $project: { _id: 0, name: "$_id", count: 1 } },
    ]);

    return sendSuccess(res, 200, "Categories fetched successfully.", categories);
  } catch (err) {
    next(err);
  }
};

// ─────────────────────────────────────────────────────────────────────────────
// GET /api/books/:id
// ─────────────────────────────────────────────────────────────────────────────
export const getBookById = async (req, res, next) => {
  try {
    const book = await Book.findOne({ _id: req.params.id, isActive: true }).lean();
    if (!book) return next(createError("Book not found.", 404));

    return sendSuccess(res, 200, "Book fetched successfully.", book);
  } catch (err) {
    next(err);
  }
};

// ─────────────────────────────────────────────────────────────────────────────
// POST /api/books   (admin | librarian only)
// ─────────────────────────────────────────────────────────────────────────────
export const createBook = async (req, res, next) => {
  try {
    const {
      title, author, isbn, category, genre, publisher, publishYear,
      description, coverImage, totalCopies, availableCopies,
      location, deweyClassification, keywords, branchId,
    } = req.body;

    // ISBN uniqueness check with a helpful message
    const existing = await Book.findOne({ isbn: isbn.trim() });
    if (existing) {
      return next(createError(`A book with ISBN "${isbn}" already exists.`, 409));
    }

    const book = await Book.create({
      title, author, isbn, category, genre, publisher, publishYear,
      description, coverImage,
      totalCopies:     totalCopies ?? 1,
      availableCopies: availableCopies ?? totalCopies ?? 1,
      location, deweyClassification,
      keywords: keywords ?? [],
      branchId: branchId || undefined,
    });

    return sendSuccess(res, 201, "Book created successfully.", book);
  } catch (err) {
    next(err);
  }
};

// ─────────────────────────────────────────────────────────────────────────────
// PUT /api/books/:id   (admin | librarian only)
// ─────────────────────────────────────────────────────────────────────────────
export const updateBook = async (req, res, next) => {
  try {
    const book = await Book.findOne({ _id: req.params.id, isActive: true });
    if (!book) return next(createError("Book not found.", 404));

    // If ISBN is being changed, ensure it's still unique
    if (req.body.isbn && req.body.isbn !== book.isbn) {
      const conflict = await Book.findOne({ isbn: req.body.isbn.trim() });
      if (conflict) {
        return next(createError(`ISBN "${req.body.isbn}" is already used by another book.`, 409));
      }
    }

    const UPDATABLE_FIELDS = [
      "title", "author", "isbn", "category", "genre", "publisher", "publishYear",
      "description", "coverImage", "totalCopies", "availableCopies",
      "location", "deweyClassification", "keywords", "branchId", "status",
    ];

    UPDATABLE_FIELDS.forEach((field) => {
      if (req.body[field] !== undefined) {
        book[field] = req.body[field];
      }
    });

    await book.save(); // triggers pre-save hook (auto-status update)

    return sendSuccess(res, 200, "Book updated successfully.", book);
  } catch (err) {
    next(err);
  }
};

// ─────────────────────────────────────────────────────────────────────────────
// DELETE /api/books/:id   (admin only — soft delete)
// ─────────────────────────────────────────────────────────────────────────────
export const deleteBook = async (req, res, next) => {
  try {
    const book = await Book.findOne({ _id: req.params.id, isActive: true });
    if (!book) return next(createError("Book not found.", 404));

    book.isActive = false;
    await book.save();

    return sendSuccess(res, 200, "Book deleted successfully.");
  } catch (err) {
    next(err);
  }
};
