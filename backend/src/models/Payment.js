import mongoose from "mongoose";

const paymentSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: [true, "User ID is required"],
    },
    fineId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Fine",
    },
    amount: {
      type: Number,
      required: [true, "Payment amount is required"],
      min: [0.01, "Payment amount must be greater than 0"],
    },
    method: {
      type: String,
      enum: ["card", "cash", "check", "transfer"],
      required: [true, "Payment method is required"],
    },
    status: {
      type: String,
      enum: ["pending", "completed", "failed", "refunded"],
      default: "completed",
    },
    transactionRef: {
      type: String,
      trim: true,
    },
    receiptNumber: {
      type: String,
      unique: true,
      trim: true,
    },
    paymentDate: {
      type: Date,
      default: Date.now,
    },
    notes: {
      type: String,
      trim: true,
      maxlength: [300, "Notes cannot exceed 300 characters"],
    },
    processedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
    },
  },
  { timestamps: true }
);

// ── Indexes ───────────────────────────────────────────────────────────────────
paymentSchema.index({ userId: 1 });
paymentSchema.index({ fineId: 1 });
paymentSchema.index({ paymentDate: -1 });

// ── Pre-save Hook: generate receipt number ────────────────────────────────────
paymentSchema.pre("save", function (next) {
  if (!this.receiptNumber) {
    const timestamp = Date.now().toString(36).toUpperCase();
    const random = Math.random().toString(36).substring(2, 6).toUpperCase();
    this.receiptNumber = `RCP-${timestamp}-${random}`;
  }
  next();
});

export default mongoose.model("Payment", paymentSchema);
