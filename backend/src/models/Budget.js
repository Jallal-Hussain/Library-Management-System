import mongoose from "mongoose";

const budgetSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, "Budget name is required"],
      trim: true,
      maxlength: [150, "Budget name cannot exceed 150 characters"],
    },
    category: {
      type: String,
      trim: true,
    },
    totalAmount: {
      type: Number,
      required: [true, "Total budget amount is required"],
      min: [0, "Amount cannot be negative"],
    },
    spentAmount: {
      type: Number,
      default: 0,
      min: [0, "Spent amount cannot be negative"],
    },
    startDate: {
      type: Date,
      required: [true, "Start date is required"],
    },
    endDate: {
      type: Date,
      required: [true, "End date is required"],
    },
    isActive: {
      type: Boolean,
      default: true,
    },
    notes: {
      type: String,
      trim: true,
    },
  },
  {
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true },
  }
);

// ── Virtuals ──────────────────────────────────────────────────────────────────
budgetSchema.virtual("remainingAmount").get(function () {
  return Math.max(0, this.totalAmount - this.spentAmount);
});

budgetSchema.virtual("utilizationPercent").get(function () {
  if (this.totalAmount === 0) return 0;
  return Math.min(100, Math.round((this.spentAmount / this.totalAmount) * 100));
});

budgetSchema.index({ isActive: 1 });
budgetSchema.index({ startDate: 1, endDate: 1 });

export default mongoose.model("Budget", budgetSchema);
