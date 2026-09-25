import mongoose from "mongoose";

const acquisitionSchema = new mongoose.Schema(
  {
    title: {
      type: String,
      required: [true, "Book title is required"],
      trim: true,
    },
    author: {
      type: String,
      trim: true,
    },
    isbn: {
      type: String,
      trim: true,
    },
    vendorId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Vendor",
    },
    quantity: {
      type: Number,
      required: [true, "Quantity is required"],
      min: [1, "Quantity must be at least 1"],
    },
    unitPrice: {
      type: Number,
      required: [true, "Unit price is required"],
      min: [0, "Unit price cannot be negative"],
    },
    totalPrice: {
      type: Number,
      min: [0, "Total price cannot be negative"],
    },
    status: {
      type: String,
      enum: ["requested", "approved", "ordered", "received", "cancelled"],
      default: "requested",
    },
    requestedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
    },
    approvedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
    },
    requestDate: {
      type: Date,
      default: Date.now,
    },
    approvedDate: {
      type: Date,
    },
    orderDate: {
      type: Date,
    },
    receivedDate: {
      type: Date,
    },
    invoiceId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Invoice",
    },
    budgetId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Budget",
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
  { timestamps: true }
);

// ── Indexes ───────────────────────────────────────────────────────────────────
acquisitionSchema.index({ status: 1 });
acquisitionSchema.index({ vendorId: 1 });

// ── Pre-save Hook: auto-calculate totalPrice ──────────────────────────────────
acquisitionSchema.pre("save", function (next) {
  if (this.isModified("quantity") || this.isModified("unitPrice")) {
    this.totalPrice = Math.round(this.quantity * this.unitPrice * 100) / 100;
  }
  next();
});

export default mongoose.model("Acquisition", acquisitionSchema);
