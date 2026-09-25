import mongoose from "mongoose";

const invoiceSchema = new mongoose.Schema(
  {
    invoiceNumber: {
      type: String,
      unique: true,
      trim: true,
    },
    acquisitionId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Acquisition",
    },
    vendorId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Vendor",
      required: [true, "Vendor ID is required"],
    },
    amount: {
      type: Number,
      required: [true, "Invoice amount is required"],
      min: [0, "Amount cannot be negative"],
    },
    issueDate: {
      type: Date,
      default: Date.now,
    },
    dueDate: {
      type: Date,
      required: [true, "Invoice due date is required"],
    },
    paymentStatus: {
      type: String,
      enum: ["pending", "paid", "overdue", "cancelled"],
      default: "pending",
    },
    paymentDate: {
      type: Date,
    },
    paymentMethod: {
      type: String,
      enum: ["card", "cash", "check", "transfer"],
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
invoiceSchema.index({ vendorId: 1 });
invoiceSchema.index({ paymentStatus: 1 });
invoiceSchema.index({ dueDate: 1, paymentStatus: 1 });

// ── Pre-save Hook: auto-generate invoice number ───────────────────────────────
invoiceSchema.pre("save", function (next) {
  if (!this.invoiceNumber) {
    const year = new Date().getFullYear();
    const suffix = String(Date.now()).slice(-6);
    this.invoiceNumber = `INV-${year}-${suffix}`;
  }
  next();
});

export default mongoose.model("Invoice", invoiceSchema);
