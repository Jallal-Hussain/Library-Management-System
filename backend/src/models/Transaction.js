import mongoose from "mongoose";

const transactionSchema = new mongoose.Schema(
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
    type: {
      type: String,
      enum: ["borrow", "return", "renew", "reserve"],
      required: [true, "Transaction type is required"],
    },
    status: {
      type: String,
      enum: ["active", "returned", "overdue", "lost"],
      default: "active",
    },
    issueDate: {
      type: Date,
      default: Date.now,
    },
    dueDate: {
      type: Date,
      required: [true, "Due date is required"],
    },
    returnDate: {
      type: Date,
    },
    renewCount: {
      type: Number,
      default: 0,
      min: [0, "Renew count cannot be negative"],
      max: [2, "Maximum 2 renewals allowed"],
    },
    fine: {
      type: Number,
      default: 0,
      min: [0, "Fine cannot be negative"],
    },
    finePaid: {
      type: Boolean,
      default: false,
    },
    branchId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Branch",
    },
    notes: {
      type: String,
      trim: true,
      maxlength: [500, "Notes cannot exceed 500 characters"],
    },
  },
  {
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true },
  }
);

// ── Indexes ───────────────────────────────────────────────────────────────────
transactionSchema.index({ userId: 1 });
transactionSchema.index({ bookId: 1 });
transactionSchema.index({ status: 1 });
transactionSchema.index({ dueDate: 1 });
transactionSchema.index({ userId: 1, status: 1 });
transactionSchema.index({ dueDate: 1, status: 1 });

// ── Virtual: isOverdue ────────────────────────────────────────────────────────
transactionSchema.virtual("isOverdue").get(function () {
  if (this.status !== "active") return false;
  return new Date() > new Date(this.dueDate);
});

// ── Virtual: daysOverdue ──────────────────────────────────────────────────────
transactionSchema.virtual("daysOverdue").get(function () {
  if (!this.isOverdue) return 0;
  const diff = new Date() - new Date(this.dueDate);
  return Math.ceil(diff / (1000 * 60 * 60 * 24));
});

export default mongoose.model("Transaction", transactionSchema);
