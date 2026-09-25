import Transaction from "../models/Transaction.js";
import Book from "../models/Book.js";
import User from "../models/User.js";
import { sendSuccess, createError } from "../utils/apiResponse.js";
import mongoose from "mongoose";

// ─────────────────────────────────────────────────────────────────────────────
// GET /api/transactions
// ─────────────────────────────────────────────────────────────────────────────
export const getTransactions = async (req, res, next) => {
  try {
    const page = Math.max(1, parseInt(req.query.page) || 1);
    const limit = Math.min(100, Math.max(1, parseInt(req.query.limit) || 20));
    const skip = (page - 1) * limit;

    const filter = {};
    if (req.query.status) filter.status = req.query.status;
    if (req.query.userId) filter.userId = req.query.userId;
    if (req.query.bookId) filter.bookId = req.query.bookId;
    
    // If not admin/librarian, only allow viewing own transactions
    if (req.user.role === "patron") {
      filter.userId = req.user._id;
    }

    const sort = req.query.sort === "oldest" ? { createdAt: 1 } : { createdAt: -1 };

    const [total, transactions] = await Promise.all([
      Transaction.countDocuments(filter),
      Transaction.find(filter)
        .populate("userId", "name email membershipId")
        .populate("bookId", "title author isbn coverImage")
        .sort(sort)
        .skip(skip)
        .limit(limit)
        .lean(),
    ]);

    const totalPages = Math.ceil(total / limit);

    return sendSuccess(res, 200, "Transactions fetched successfully.", transactions, {
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
// GET /api/transactions/:id
// ─────────────────────────────────────────────────────────────────────────────
export const getTransactionById = async (req, res, next) => {
  try {
    const transaction = await Transaction.findById(req.params.id)
      .populate("userId", "name email membershipId")
      .populate("bookId", "title author isbn");
      
    if (!transaction) return next(createError("Transaction not found.", 404));

    if (req.user.role === "patron" && transaction.userId._id.toString() !== req.user._id.toString()) {
      return next(createError("Access denied.", 403));
    }

    return sendSuccess(res, 200, "Transaction fetched successfully.", transaction);
  } catch (err) {
    next(err);
  }
};

// ─────────────────────────────────────────────────────────────────────────────
// POST /api/transactions/borrow
// ─────────────────────────────────────────────────────────────────────────────
export const borrowBook = async (req, res, next) => {
  const session = await mongoose.startSession();
  session.startTransaction();
  try {
    const { userId, bookId, notes } = req.body;

    const user = await User.findById(userId).session(session);
    if (!user) throw createError("User not found.", 404);
    if (!user.isActive) throw createError("User account is inactive.", 403);
    if (user.currentBorrows >= user.borrowingLimit) {
      throw createError("User has reached their borrowing limit.", 400);
    }

    const book = await Book.findById(bookId).session(session);
    if (!book) throw createError("Book not found.", 404);
    if (book.availableCopies <= 0 || book.status !== "available") {
      throw createError("Book is not currently available for borrowing.", 400);
    }

    const dueDate = new Date();
    // Use a fixed 14 days for this basic implementation. In a full app, read from Settings.
    dueDate.setDate(dueDate.getDate() + 14); 

    const transaction = new Transaction({
      userId,
      bookId,
      type: "borrow",
      status: "active",
      issueDate: new Date(),
      dueDate,
      notes,
    });

    await transaction.save({ session });

    user.currentBorrows += 1;
    await user.save({ session });

    book.availableCopies -= 1;
    if (book.availableCopies === 0) book.status = "borrowed";
    await book.save({ session });

    await session.commitTransaction();
    session.endSession();

    return sendSuccess(res, 201, "Book borrowed successfully.", transaction);
  } catch (err) {
    await session.abortTransaction();
    session.endSession();
    next(err);
  }
};

// ─────────────────────────────────────────────────────────────────────────────
// PUT /api/transactions/:id/return
// ─────────────────────────────────────────────────────────────────────────────
export const returnBook = async (req, res, next) => {
  const session = await mongoose.startSession();
  session.startTransaction();
  try {
    const transaction = await Transaction.findById(req.params.id).session(session);
    if (!transaction) throw createError("Transaction not found.", 404);
    if (transaction.status !== "active" && transaction.status !== "overdue") {
      throw createError("Book is already returned or lost.", 400);
    }

    transaction.status = "returned";
    transaction.returnDate = new Date();
    await transaction.save({ session });

    const user = await User.findById(transaction.userId).session(session);
    if (user) {
      user.currentBorrows = Math.max(0, user.currentBorrows - 1);
      await user.save({ session });
    }

    const book = await Book.findById(transaction.bookId).session(session);
    if (book) {
      book.availableCopies += 1;
      if (book.status === "borrowed") book.status = "available";
      await book.save({ session });
    }

    await session.commitTransaction();
    session.endSession();

    return sendSuccess(res, 200, "Book returned successfully.", transaction);
  } catch (err) {
    await session.abortTransaction();
    session.endSession();
    next(err);
  }
};

// ─────────────────────────────────────────────────────────────────────────────
// PUT /api/transactions/:id/renew
// ─────────────────────────────────────────────────────────────────────────────
export const renewBook = async (req, res, next) => {
  try {
    const transaction = await Transaction.findById(req.params.id);
    if (!transaction) return next(createError("Transaction not found.", 404));

    if (req.user.role === "patron" && transaction.userId.toString() !== req.user._id.toString()) {
      return next(createError("Access denied.", 403));
    }

    if (transaction.status !== "active") {
      return next(createError("Only active transactions can be renewed.", 400));
    }

    if (transaction.renewCount >= 2) {
      return next(createError("Maximum renewals reached.", 400));
    }

    const dueDate = new Date(transaction.dueDate);
    dueDate.setDate(dueDate.getDate() + 14); 

    transaction.dueDate = dueDate;
    transaction.renewCount += 1;
    
    await transaction.save();

    return sendSuccess(res, 200, "Book renewed successfully.", transaction);
  } catch (err) {
    next(err);
  }
};
