import mongoose from "mongoose";

const bookSchema = new mongoose.Schema(
  {
    title: {
      type: String,
      required: [true, "Title is required"],
      trim: true,
      maxlength: [300, "Title cannot exceed 300 characters"],
    },
    author: {
      type: String,
      required: [true, "Author is required"],
      trim: true,
      maxlength: [200, "Author cannot exceed 200 characters"],
    },
    isbn: {
      type: String,
      required: [true, "ISBN is required"],
      unique: true,
      trim: true,
    },
    category: {
      type: String,
      required: [true, "Category is required"],
      trim: true,
    },
    genre: {
      type: String,
      trim: true,
    },
    publisher: {
      type: String,
      trim: true,
    },
    publishYear: {
      type: Number,
      min: [1000, "Publish year must be after 1000"],
      max: [new Date().getFullYear() + 1, "Publish year cannot be in the future"],
    },
    description: {
      type: String,
      trim: true,
      maxlength: [2000, "Description cannot exceed 2000 characters"],
    },
    coverImage: {
      type: String,
      trim: true,
    },
    totalCopies: {
      type: Number,
      required: [true, "Total copies is required"],
      min: [1, "Must have at least 1 copy"],
      default: 1,
    },
    availableCopies: {
      type: Number,
      min: [0, "Available copies cannot be negative"],
      default: 1,
    },
    status: {
      type: String,
      enum: ["available", "borrowed", "reserved", "lost", "damaged"],
      default: "available",
    },
    location: {
      type: String,
      trim: true,
      maxlength: [50, "Location code cannot exceed 50 characters"],
    },
    deweyClassification: {
      type: String,
      trim: true,
    },
    keywords: {
      type: [String],
      default: [],
    },
    branchId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Branch",
    },
    isActive: {
      type: Boolean,
      default: true,
    },
  },
  {
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true },
  }
);

// ── Indexes ───────────────────────────────────────────────────────────────────
bookSchema.index(
  { title: "text", author: "text", isbn: "text", description: "text", keywords: "text" },
  { weights: { title: 10, author: 5, isbn: 8, description: 1 } }
);
bookSchema.index({ category: 1 });
bookSchema.index({ status: 1 });
bookSchema.index({ branchId: 1 });
bookSchema.index({ isActive: 1 });
bookSchema.index({ availableCopies: 1 });

// ── Virtual: isFullyBorrowed ──────────────────────────────────────────────────
bookSchema.virtual("isFullyBorrowed").get(function () {
  return this.availableCopies === 0;
});

// ── Pre-save Hook: auto-update status based on copies ────────────────────────
bookSchema.pre("save", function (next) {
  if (this.availableCopies === 0 && this.status === "available") {
    this.status = "borrowed";
  } else if (this.availableCopies > 0 && this.status === "borrowed") {
    this.status = "available";
  }
  next();
});

export default mongoose.model("Book", bookSchema);
