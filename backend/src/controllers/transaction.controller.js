import Transaction  from "../models/Transaction.js";
import Book         from "../models/Book.js";
import User         from "../models/User.js";
import Fine         from "../models/Fine.js";
import FeeStructure from "../models/FeeStructure.js";
import Reservation  from "../models/Reservation.js";
import Notification from "../models/Notification.js";
import { sendSuccess, createError } from "../utils/apiResponse.js";
import {
  getLoanPeriodDays,
  getMaxRenewals,
  getFineBlockThreshold,
  getReservationHoldDays,
} from "../utils/settingsHelper.js";
import mongoose from "mongoose";

// ─────────────────────────────────────────────────────────────────────────────
// Shared helpers
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Calculate the overdue fine amount for a transaction.
 * Looks up the active "overdue" FeeStructure; falls back to the Settings value
 * `fine_rate_per_day` (default $0.50/day) if none is found.
 *
 * @param {number} daysOverdue
 * @returns {Promise<{ fineAmount: number, feeStructureId: mongoose.Types.ObjectId|null }>}
 */
async function calcOverdueFine(daysOverdue) {
  // Try to find active overdue fee structure (prefer per_day type)
  const feeStruct = await FeeStructure.findOne({
    type: "overdue",
    isActive: true,
  })
    .sort({ createdAt: -1 })
    .lean();

  let fineAmount = 0;
  let feeStructureId = null;

  if (feeStruct) {
    feeStructureId = feeStruct._id;
    if (feeStruct.rateType === "per_day") {
      fineAmount = feeStruct.rate * daysOverdue;
    } else if (feeStruct.rateType === "fixed") {
      fineAmount = feeStruct.rate;
    } else if (feeStruct.rateType === "percentage") {
      // percentage is of the base daily rate fallback
      fineAmount = (feeStruct.rate / 100) * 0.5 * daysOverdue;
    }
    // Cap at maxAmount if specified
    if (feeStruct.maxAmount && fineAmount > feeStruct.maxAmount) {
      fineAmount = feeStruct.maxAmount;
    }
  } else {
    // Fallback: $0.50 per day, no cap
    fineAmount = 0.5 * daysOverdue;
  }

  fineAmount = Math.round(fineAmount * 100) / 100; // 2 decimal places
  return { fineAmount, feeStructureId };
}

// ─────────────────────────────────────────────────────────────────────────────
// GET /api/transactions
// ─────────────────────────────────────────────────────────────────────────────
export const getTransactions = async (req, res, next) => {
  try {
    const page  = Math.max(1, parseInt(req.query.page)  || 1);
    const limit = Math.min(100, Math.max(1, parseInt(req.query.limit) || 20));
    const skip  = (page - 1) * limit;

    const filter = {};
    if (req.query.status) filter.status = req.query.status;
    if (req.query.userId) filter.userId = req.query.userId;
    if (req.query.bookId) filter.bookId = req.query.bookId;

    // Patrons may only view their own transactions
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

    if (
      req.user.role === "patron" &&
      transaction.userId._id.toString() !== req.user._id.toString()
    ) {
      return next(createError("Access denied.", 403));
    }

    return sendSuccess(res, 200, "Transaction fetched successfully.", transaction);
  } catch (err) {
    next(err);
  }
};

// ─────────────────────────────────────────────────────────────────────────────
// POST /api/transactions/borrow  — Phase 2 enhanced
// ─────────────────────────────────────────────────────────────────────────────
export const borrowBook = async (req, res, next) => {
  const session = await mongoose.startSession();
  session.startTransaction();
  try {
    const { userId, bookId, notes } = req.body;

    // ── 1. Validate user ──────────────────────────────────────────────────────
    const user = await User.findById(userId).session(session);
    if (!user) throw createError("User not found.", 404);
    if (!user.isActive) throw createError("User account is inactive.", 403);

    // ── 2. Fine-block check (Phase 2.1) ──────────────────────────────────────
    const fineBlockThreshold = await getFineBlockThreshold();
    if (user.finesOwed > fineBlockThreshold) {
      throw createError(
        `Borrowing is blocked. Outstanding fines ($${user.finesOwed.toFixed(2)}) exceed the limit of $${fineBlockThreshold}. Please clear your fines first.`,
        403
      );
    }

    // ── 3. Borrowing-limit check (dynamic from user or Settings) ─────────────
    if (user.currentBorrows >= user.borrowingLimit) {
      throw createError(
        `User has reached their borrowing limit of ${user.borrowingLimit} book(s).`,
        400
      );
    }

    // ── 4. Validate book ──────────────────────────────────────────────────────
    const book = await Book.findById(bookId).session(session);
    if (!book) throw createError("Book not found.", 404);
    if (book.availableCopies <= 0 || book.status !== "available") {
      throw createError("Book is not currently available for borrowing.", 400);
    }

    // ── 5. Dynamic due date based on borrower role (Phase 2.1) ───────────────
    const loanDays = await getLoanPeriodDays(user.role);
    const dueDate = new Date();
    dueDate.setDate(dueDate.getDate() + loanDays);

    // ── 6. Create transaction ─────────────────────────────────────────────────
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

    // ── 7. Update counters ────────────────────────────────────────────────────
    user.currentBorrows += 1;
    await user.save({ session });

    book.availableCopies -= 1;
    if (book.availableCopies === 0) book.status = "borrowed";
    await book.save({ session });

    await session.commitTransaction();
    session.endSession();

    return sendSuccess(res, 201, `Book borrowed successfully. Due in ${loanDays} days.`, {
      ...transaction.toObject(),
      dueDate,
      loanDays,
    });
  } catch (err) {
    await session.abortTransaction();
    session.endSession();
    next(err);
  }
};

// ─────────────────────────────────────────────────────────────────────────────
// PUT /api/transactions/:id/return  — Phase 2 enhanced
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

    const now      = new Date();
    const dueDate  = new Date(transaction.dueDate);
    const bookId   = transaction.bookId;

    // ── Phase 2.2: Overdue fine generation ───────────────────────────────────
    let fineRecord = null;
    if (now > dueDate) {
      const msOverdue    = now - dueDate;
      const daysOverdue  = Math.max(1, Math.ceil(msOverdue / (1000 * 60 * 60 * 24)));
      const { fineAmount } = await calcOverdueFine(daysOverdue);

      if (fineAmount > 0) {
        // Create Fine record
        fineRecord = new Fine({
          userId:        transaction.userId,
          transactionId: transaction._id,
          amount:        fineAmount,
          reason:        "overdue",
          reasonNote:    `${daysOverdue} day(s) overdue (due: ${dueDate.toDateString()}, returned: ${now.toDateString()})`,
        });
        await fineRecord.save({ session });

        // Atomically update user.finesOwed
        await User.findByIdAndUpdate(
          transaction.userId,
          { $inc: { finesOwed: fineAmount } },
          { session }
        );

        // Fine notification
        await Notification.create(
          [
            {
              userId:       transaction.userId,
              title:        "Overdue Fine Assessed",
              message:      `A fine of $${fineAmount.toFixed(2)} has been applied for returning "${
                (await Book.findById(bookId).lean())?.title ?? "your book"
              }" ${daysOverdue} day(s) late.`,
              type:         "fine_issued",
              relatedId:    fineRecord._id,
              relatedModel: "Fine",
            },
          ],
          { session }
        );

        transaction.fine = fineAmount;
      }
    }

    // ── Mark transaction returned ─────────────────────────────────────────────
    transaction.status     = "returned";
    transaction.returnDate = now;
    await transaction.save({ session });

    // ── Decrement user borrow counter ─────────────────────────────────────────
    await User.findByIdAndUpdate(
      transaction.userId,
      { $inc: { currentBorrows: -1 } },
      { session }
    );

    // ── Phase 2.3: Reservation queue check ───────────────────────────────────
    const book = await Book.findById(bookId).session(session);
    if (book) {
      const nextInQueue = await Reservation.findOne({
        bookId,
        status: "pending",
      })
        .sort({ queuePosition: 1 })
        .session(session);

      if (nextInQueue) {
        // Hold the book for the next patron in line
        const holdDays   = await getReservationHoldDays();
        const expiryDate = new Date();
        expiryDate.setDate(expiryDate.getDate() + holdDays);

        nextInQueue.status      = "ready";
        nextInQueue.expiryDate  = expiryDate;
        nextInQueue.notificationSent = true;
        await nextInQueue.save({ session });

        book.status = "reserved";
        // availableCopies stays at 0 until the patron picks it up or the hold expires
        await book.save({ session });

        // Notify patron
        await Notification.create(
          [
            {
              userId:       nextInQueue.userId,
              title:        "Reserved Book Ready for Pickup",
              message:      `Your reserved book "${book.title ?? ""}" is now ready for pickup. Please collect it by ${expiryDate.toDateString()} before your hold expires.`,
              type:         "reservation_ready",
              relatedId:    nextInQueue._id,
              relatedModel: "Reservation",
            },
          ],
          { session }
        );
      } else {
        // No waiting patrons — make the book available
        book.availableCopies = Math.max(0, book.availableCopies) + 1;
        if (book.status === "borrowed" || book.status === "reserved") {
          book.status = "available";
        }
        await book.save({ session });
      }
    }

    await session.commitTransaction();
    session.endSession();

    return sendSuccess(res, 200, "Book returned successfully.", {
      transaction,
      fine: fineRecord
        ? { amount: fineRecord.amount, reason: fineRecord.reasonNote }
        : null,
    });
  } catch (err) {
    await session.abortTransaction();
    session.endSession();
    next(err);
  }
};

// ─────────────────────────────────────────────────────────────────────────────
// PUT /api/transactions/:id/renew  — Phase 2 enhanced (dynamic max renewals)
// ─────────────────────────────────────────────────────────────────────────────
export const renewBook = async (req, res, next) => {
  try {
    const transaction = await Transaction.findById(req.params.id);
    if (!transaction) return next(createError("Transaction not found.", 404));

    if (
      req.user.role === "patron" &&
      transaction.userId.toString() !== req.user._id.toString()
    ) {
      return next(createError("Access denied.", 403));
    }

    if (transaction.status !== "active") {
      return next(createError("Only active transactions can be renewed.", 400));
    }

    // Block renewals on overdue transactions
    if (new Date() > new Date(transaction.dueDate)) {
      return next(
        createError(
          "Overdue books cannot be renewed. Please return the book and clear any outstanding fines.",
          400
        )
      );
    }

    // Dynamic max renewals from Settings
    const maxRenewals = await getMaxRenewals();
    if (transaction.renewCount >= maxRenewals) {
      return next(
        createError(`Maximum renewals (${maxRenewals}) reached for this transaction.`, 400)
      );
    }

    // Determine the renewal extension using the borrower's loan period
    const user     = await User.findById(transaction.userId).lean();
    const loanDays = user ? await getLoanPeriodDays(user.role) : 14;

    const dueDate = new Date(transaction.dueDate);
    dueDate.setDate(dueDate.getDate() + loanDays);

    transaction.dueDate    = dueDate;
    transaction.renewCount += 1;
    await transaction.save();

    return sendSuccess(res, 200, "Book renewed successfully.", transaction);
  } catch (err) {
    next(err);
  }
};
