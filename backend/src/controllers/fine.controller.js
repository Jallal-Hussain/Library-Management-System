import Fine from "../models/Fine.js";
import User from "../models/User.js";
import { sendSuccess, createError } from "../utils/apiResponse.js";
import mongoose from "mongoose";

// ─────────────────────────────────────────────────────────────────────────────
// GET /api/fines
// ─────────────────────────────────────────────────────────────────────────────
export const getFines = async (req, res, next) => {
  try {
    const page = Math.max(1, parseInt(req.query.page) || 1);
    const limit = Math.min(100, Math.max(1, parseInt(req.query.limit) || 20));
    const skip = (page - 1) * limit;

    const filter = {};
    if (req.query.isPaid !== undefined) {
      filter.isPaid = req.query.isPaid === "true";
    }
    if (req.query.userId) filter.userId = req.query.userId;
    if (req.query.transactionId) filter.transactionId = req.query.transactionId;

    if (req.user.role === "patron") {
      filter.userId = req.user._id;
    }

    const sort = req.query.sort === "oldest" ? { createdAt: 1 } : { createdAt: -1 };

    const [total, fines] = await Promise.all([
      Fine.countDocuments(filter),
      Fine.find(filter)
        .populate("userId", "name email membershipId")
        .populate("transactionId", "bookId type issueDate dueDate")
        .sort(sort)
        .skip(skip)
        .limit(limit)
        .lean(),
    ]);

    const totalPages = Math.ceil(total / limit);

    return sendSuccess(res, 200, "Fines fetched successfully.", fines, {
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
// GET /api/fines/:id
// ─────────────────────────────────────────────────────────────────────────────
export const getFineById = async (req, res, next) => {
  try {
    const fine = await Fine.findById(req.params.id)
      .populate("userId", "name email membershipId")
      .populate("transactionId");

    if (!fine) return next(createError("Fine not found.", 404));

    if (req.user.role === "patron" && fine.userId._id.toString() !== req.user._id.toString()) {
      return next(createError("Access denied.", 403));
    }

    return sendSuccess(res, 200, "Fine fetched successfully.", fine);
  } catch (err) {
    next(err);
  }
};

// ─────────────────────────────────────────────────────────────────────────────
// POST /api/fines
// ─────────────────────────────────────────────────────────────────────────────
export const createFine = async (req, res, next) => {
  const session = await mongoose.startSession();
  session.startTransaction();
  try {
    const { userId, transactionId, amount, reason, reasonNote } = req.body;

    const fine = new Fine({
      userId,
      transactionId,
      amount,
      reason,
      reasonNote,
    });

    await fine.save({ session });

    const user = await User.findById(userId).session(session);
    if (user) {
      user.finesOwed += amount;
      await user.save({ session });
    }

    await session.commitTransaction();
    session.endSession();

    return sendSuccess(res, 201, "Fine created successfully.", fine);
  } catch (err) {
    await session.abortTransaction();
    session.endSession();
    next(err);
  }
};

// ─────────────────────────────────────────────────────────────────────────────
// PUT /api/fines/:id/waive
// ─────────────────────────────────────────────────────────────────────────────
export const waiveFine = async (req, res, next) => {
  const session = await mongoose.startSession();
  session.startTransaction();
  try {
    const fine = await Fine.findById(req.params.id).session(session);
    if (!fine) throw createError("Fine not found.", 404);
    if (fine.isPaid) throw createError("Cannot waive an already paid fine.", 400);

    fine.isPaid = true;
    fine.waivedBy = req.user._id;
    fine.waivedAt = new Date();
    fine.waivedReason = req.body.reason || "Waived by admin";
    
    await fine.save({ session });

    const user = await User.findById(fine.userId).session(session);
    if (user) {
      user.finesOwed = Math.max(0, user.finesOwed - fine.amount);
      await user.save({ session });
    }

    await session.commitTransaction();
    session.endSession();

    return sendSuccess(res, 200, "Fine waived successfully.", fine);
  } catch (err) {
    await session.abortTransaction();
    session.endSession();
    next(err);
  }
};
