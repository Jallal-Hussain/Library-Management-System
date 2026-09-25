import mongoose from "mongoose";

const vendorQuoteSchema = new mongoose.Schema(
  {
    acquisitionId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Acquisition",
      required: [true, "Acquisition ID is required"],
    },
    vendorId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Vendor",
      required: [true, "Vendor ID is required"],
    },
    price: {
      type: Number,
      required: [true, "Quote price is required"],
      min: [0, "Price cannot be negative"],
    },
    deliveryDays: {
      type: Number,
      required: [true, "Estimated delivery days is required"],
      min: [1, "Delivery days must be at least 1"],
    },
    terms: {
      type: String,
      trim: true,
    },
    validUntil: {
      type: Date,
      required: [true, "Quote validity date is required"],
    },
    status: {
      type: String,
      enum: ["pending", "accepted", "rejected"],
      default: "pending",
    },
    submittedDate: {
      type: Date,
      default: Date.now,
    },
    notes: {
      type: String,
      trim: true,
    },
  },
  { timestamps: true }
);

vendorQuoteSchema.index({ acquisitionId: 1 });
vendorQuoteSchema.index({ vendorId: 1 });
vendorQuoteSchema.index({ status: 1 });

export default mongoose.model("VendorQuote", vendorQuoteSchema);
