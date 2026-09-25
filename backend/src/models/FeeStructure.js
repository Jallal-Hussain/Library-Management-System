import mongoose from "mongoose";

const feeStructureSchema = new mongoose.Schema(
  {
    type: {
      type: String,
      enum: ["overdue", "lost", "damaged", "processing"],
      required: [true, "Fee type is required"],
    },
    name: {
      type: String,
      required: [true, "Fee name is required"],
      trim: true,
      maxlength: [100, "Name cannot exceed 100 characters"],
    },
    rate: {
      type: Number,
      required: [true, "Rate is required"],
      min: [0, "Rate cannot be negative"],
    },
    rateType: {
      type: String,
      enum: ["per_day", "fixed", "percentage"],
      required: [true, "Rate type is required"],
    },
    maxAmount: {
      type: Number,
      min: [0, "Max amount cannot be negative"],
    },
    appliesTo: {
      type: String,
      enum: ["all", "patron", "librarian"],
      default: "all",
    },
    isActive: {
      type: Boolean,
      default: true,
    },
  },
  { timestamps: true }
);

feeStructureSchema.index({ type: 1, isActive: 1 });

export default mongoose.model("FeeStructure", feeStructureSchema);
