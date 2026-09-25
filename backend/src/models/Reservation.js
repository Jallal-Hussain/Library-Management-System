import mongoose from "mongoose";

const reservationSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: [true, "User ID is required"],
    },
    bookId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Book",
      required: [true, "Book ID is required"],
    },
    reserveDate: {
      type: Date,
      default: Date.now,
    },
    expiryDate: {
      type: Date,
    },
    queuePosition: {
      type: Number,
      required: true,
      min: [1, "Queue position must be at least 1"],
    },
    status: {
      type: String,
      enum: ["pending", "ready", "cancelled", "fulfilled", "expired"],
      default: "pending",
    },
    notificationSent: {
      type: Boolean,
      default: false,
    },
    cancelledReason: {
      type: String,
      trim: true,
    },
  },
  { timestamps: true }
);

// ── Indexes ───────────────────────────────────────────────────────────────────
reservationSchema.index({ userId: 1 });
reservationSchema.index({ bookId: 1 });
reservationSchema.index({ status: 1 });
reservationSchema.index({ bookId: 1, status: 1, queuePosition: 1 });

// Prevent duplicate active reservations per user+book
reservationSchema.index(
  { userId: 1, bookId: 1 },
  {
    unique: true,
    partialFilterExpression: { status: { $in: ["pending", "ready"] } },
  }
);

export default mongoose.model("Reservation", reservationSchema);
