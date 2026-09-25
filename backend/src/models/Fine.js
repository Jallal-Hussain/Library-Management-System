import mongoose from "mongoose";

const fineSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: [true, "User ID is required"],
    },
    transactionId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Transaction",
      required: [true, "Transaction ID is required"],
    },
    amount: {
      type: Number,
      required: [true, "Fine amount is required"],
      min: [0, "Fine amount cannot be negative"],
    },
    reason: {
      type: String,
      required: [true, "Fine reason is required"],
      enum: ["overdue", "lost", "damaged", "other"],
      default: "overdue",
    },
    reasonNote: {
      type: String,
      trim: true,
      maxlength: [300, "Reason note cannot exceed 300 characters"],
    },
    dateIssued: {
      type: Date,
      default: Date.now,
    },
    datePaid: {
      type: Date,
    },
    isPaid: {
      type: Boolean,
      default: false,
    },
    waivedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
    },
    waivedAt: {
      type: Date,
    },
    waivedReason: {
      type: String,
      trim: true,
    },
  },
  { timestamps: true }
);

// ── Indexes ───────────────────────────────────────────────────────────────────
fineSchema.index({ userId: 1 });
fineSchema.index({ transactionId: 1 });
fineSchema.index({ isPaid: 1 });
fineSchema.index({ userId: 1, isPaid: 1 });

export default mongoose.model("Fine", fineSchema);
