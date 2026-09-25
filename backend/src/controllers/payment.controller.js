import Payment from "../models/Payment.js";
import Fine from "../models/Fine.js";
import User from "../models/User.js";
import { sendSuccess, createError } from "../utils/apiResponse.js";
import mongoose from "mongoose";

// ─────────────────────────────────────────────────────────────────────────────
// GET /api/payments
// ─────────────────────────────────────────────────────────────────────────────
export const getPayments = async (req, res, next) => {
  try {
    const page = Math.max(1, parseInt(req.query.page) || 1);
    const limit = Math.min(100, Math.max(1, parseInt(req.query.limit) || 20));
    const skip = (page - 1) * limit;

    const filter = {};
    if (req.query.status) filter.status = req.query.status;
    if (req.query.userId) filter.userId = req.query.userId;
    if (req.query.method) filter.method = req.query.method;

    if (req.user.role === "patron") {
      filter.userId = req.user._id;
    }

    const sort = req.query.sort === "oldest" ? { createdAt: 1 } : { createdAt: -1 };

    const [total, payments] = await Promise.all([
      Payment.countDocuments(filter),
      Payment.find(filter)
        .populate("userId", "name email membershipId")
        .populate("fineId", "amount reason isPaid")
        .sort(sort)
        .skip(skip)
        .limit(limit)
        .lean(),
    ]);

    const totalPages = Math.ceil(total / limit);

    return sendSuccess(res, 200, "Payments fetched successfully.", payments, {
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
// GET /api/payments/:id
// ─────────────────────────────────────────────────────────────────────────────
export const getPaymentById = async (req, res, next) => {
  try {
    const payment = await Payment.findById(req.params.id)
      .populate("userId", "name email membershipId")
      .populate("fineId");

    if (!payment) return next(createError("Payment not found.", 404));

    if (req.user.role === "patron" && payment.userId._id.toString() !== req.user._id.toString()) {
      return next(createError("Access denied.", 403));
    }

    return sendSuccess(res, 200, "Payment fetched successfully.", payment);
  } catch (err) {
    next(err);
  }
};

// ─────────────────────────────────────────────────────────────────────────────
// POST /api/payments
// ─────────────────────────────────────────────────────────────────────────────
export const processPayment = async (req, res, next) => {
  const session = await mongoose.startSession();
  session.startTransaction();
  try {
    const { userId, fineId, amount, method, transactionRef, notes } = req.body;

    const payment = new Payment({
      userId,
      fineId,
      amount,
      method,
      transactionRef,
      notes,
      processedBy: req.user._id,
      status: "completed"
    });

    await payment.save({ session });

    if (fineId) {
      const fine = await Fine.findById(fineId).session(session);
      if (fine) {
        fine.isPaid = true;
        fine.datePaid = new Date();
        await fine.save({ session });
      }
    }

    const user = await User.findById(userId).session(session);
    if (user) {
      user.finesOwed = Math.max(0, user.finesOwed - amount);
      await user.save({ session });
    }

    await session.commitTransaction();
    session.endSession();

    return sendSuccess(res, 201, "Payment processed successfully.", payment);
  } catch (err) {
    await session.abortTransaction();
    session.endSession();
    next(err);
  }
};
