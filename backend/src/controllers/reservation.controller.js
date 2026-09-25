import Reservation from "../models/Reservation.js";
import Book from "../models/Book.js";
import { sendSuccess, createError } from "../utils/apiResponse.js";
import mongoose from "mongoose";

// ─────────────────────────────────────────────────────────────────────────────
// GET /api/reservations
// ─────────────────────────────────────────────────────────────────────────────
export const getReservations = async (req, res, next) => {
  try {
    const page = Math.max(1, parseInt(req.query.page) || 1);
    const limit = Math.min(100, Math.max(1, parseInt(req.query.limit) || 20));
    const skip = (page - 1) * limit;

    const filter = {};
    if (req.query.status) filter.status = req.query.status;
    if (req.query.userId) filter.userId = req.query.userId;
    if (req.query.bookId) filter.bookId = req.query.bookId;

    if (req.user.role === "patron") {
      filter.userId = req.user._id;
    }

    const sort = req.query.sort === "oldest" ? { createdAt: 1 } : { createdAt: -1 };

    const [total, reservations] = await Promise.all([
      Reservation.countDocuments(filter),
      Reservation.find(filter)
        .populate("userId", "name email membershipId")
        .populate("bookId", "title author isbn coverImage")
        .sort(sort)
        .skip(skip)
        .limit(limit)
        .lean(),
    ]);

    const totalPages = Math.ceil(total / limit);

    return sendSuccess(res, 200, "Reservations fetched successfully.", reservations, {
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
// GET /api/reservations/:id
// ─────────────────────────────────────────────────────────────────────────────
export const getReservationById = async (req, res, next) => {
  try {
    const reservation = await Reservation.findById(req.params.id)
      .populate("userId", "name email membershipId")
      .populate("bookId", "title author isbn");

    if (!reservation) return next(createError("Reservation not found.", 404));

    if (req.user.role === "patron" && reservation.userId._id.toString() !== req.user._id.toString()) {
      return next(createError("Access denied.", 403));
    }

    return sendSuccess(res, 200, "Reservation fetched successfully.", reservation);
  } catch (err) {
    next(err);
  }
};

// ─────────────────────────────────────────────────────────────────────────────
// POST /api/reservations
// ─────────────────────────────────────────────────────────────────────────────
export const createReservation = async (req, res, next) => {
  const session = await mongoose.startSession();
  session.startTransaction();
  try {
    const { bookId } = req.body;
    const userId = req.user.role === "patron" ? req.user._id : req.body.userId;
    
    if (!userId) throw createError("User ID is required.", 400);

    const book = await Book.findById(bookId).session(session);
    if (!book) throw createError("Book not found.", 404);
    
    // Check if user already has an active reservation for this book
    const existing = await Reservation.findOne({ 
      userId, 
      bookId, 
      status: { $in: ["pending", "ready"] } 
    }).session(session);
    
    if (existing) {
      throw createError("User already has an active reservation for this book.", 409);
    }

    // Determine queue position
    const activeReservationsCount = await Reservation.countDocuments({
      bookId,
      status: { $in: ["pending", "ready"] }
    }).session(session);
    
    const queuePosition = activeReservationsCount + 1;

    const reservation = new Reservation({
      userId,
      bookId,
      queuePosition,
      status: "pending"
    });

    await reservation.save({ session });
    
    // Optionally update book status if it was available, though reservations are usually when all copies are out
    if (book.status === "available" && book.availableCopies === 0) {
       book.status = "reserved";
       await book.save({session});
    }

    await session.commitTransaction();
    session.endSession();

    return sendSuccess(res, 201, "Reservation created successfully.", reservation);
  } catch (err) {
    await session.abortTransaction();
    session.endSession();
    next(err);
  }
};

// ─────────────────────────────────────────────────────────────────────────────
// PUT /api/reservations/:id/cancel
// ─────────────────────────────────────────────────────────────────────────────
export const cancelReservation = async (req, res, next) => {
  try {
    const reservation = await Reservation.findById(req.params.id);
    if (!reservation) return next(createError("Reservation not found.", 404));

    if (req.user.role === "patron" && reservation.userId.toString() !== req.user._id.toString()) {
      return next(createError("Access denied.", 403));
    }

    if (!["pending", "ready"].includes(reservation.status)) {
      return next(createError("Only active reservations can be cancelled.", 400));
    }

    reservation.status = "cancelled";
    reservation.cancelledReason = req.body.reason || "User cancelled";
    await reservation.save();

    // Ideally, we'd also update the queue positions of other reservations for this book.

    return sendSuccess(res, 200, "Reservation cancelled successfully.", reservation);
  } catch (err) {
    next(err);
  }
};

// ─────────────────────────────────────────────────────────────────────────────
// PUT /api/reservations/:id/status
// ─────────────────────────────────────────────────────────────────────────────
export const updateStatus = async (req, res, next) => {
  try {
    const reservation = await Reservation.findById(req.params.id);
    if (!reservation) return next(createError("Reservation not found.", 404));

    reservation.status = req.body.status;
    await reservation.save();

    return sendSuccess(res, 200, "Reservation status updated successfully.", reservation);
  } catch (err) {
    next(err);
  }
};
