import mongoose from "mongoose";

const illSchema = new mongoose.Schema(
  {
    requestedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: [true, "Requesting user is required"],
    },
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
    partnerLibrary: {
      type: String,
      required: [true, "Partner library name is required"],
      trim: true,
    },
    partnerLibraryContact: {
      type: String,
      trim: true,
    },
    requestDate: {
      type: Date,
      default: Date.now,
    },
    expectedDate: {
      type: Date,
    },
    receivedDate: {
      type: Date,
    },
    returnedDate: {
      type: Date,
    },
    dueDate: {
      type: Date,
    },
    status: {
      type: String,
      enum: [
        "requested",
        "approved",
        "in_transit",
        "received",
        "issued",
        "returned",
        "rejected",
        "cancelled",
      ],
      default: "requested",
    },
    borrowingFee: {
      type: Number,
      default: 0,
      min: [0, "Fee cannot be negative"],
    },
    notes: {
      type: String,
      trim: true,
      maxlength: [500, "Notes cannot exceed 500 characters"],
    },
    branchId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Branch",
    },
  },
  { timestamps: true }
);

illSchema.index({ requestedBy: 1 });
illSchema.index({ status: 1 });

export default mongoose.model("ILL", illSchema);
