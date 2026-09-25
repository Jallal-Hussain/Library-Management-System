import mongoose from "mongoose";
import bcrypt from "bcryptjs";

const userSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, "Name is required"],
      trim: true,
      maxlength: [100, "Name cannot exceed 100 characters"],
    },
    email: {
      type: String,
      required: [true, "Email is required"],
      unique: true,
      lowercase: true,
      trim: true,
      match: [/^\S+@\S+\.\S+$/, "Please provide a valid email"],
    },
    passwordHash: {
      type: String,
      required: [true, "Password is required"],
      minlength: 6,
      select: false,
    },
    role: {
      type: String,
      enum: ["admin", "librarian", "patron"],
      default: "patron",
    },
    membershipId: {
      type: String,
      unique: true,
      sparse: true,
    },
    phone: {
      type: String,
      trim: true,
      maxlength: [20, "Phone cannot exceed 20 characters"],
    },
    address: {
      type: String,
      trim: true,
      maxlength: [300, "Address cannot exceed 300 characters"],
    },
    joinDate: {
      type: Date,
      default: Date.now,
    },
    membershipExpiry: {
      type: Date,
    },
    borrowingLimit: {
      type: Number,
      default: 5,
      min: [0, "Borrowing limit cannot be negative"],
    },
    currentBorrows: {
      type: Number,
      default: 0,
      min: [0, "Current borrows cannot be negative"],
    },
    finesOwed: {
      type: Number,
      default: 0,
      min: [0, "Fines owed cannot be negative"],
    },
    isActive: {
      type: Boolean,
      default: false,
    },
    approvalStatus: {
      type: String,
      enum: ["pending", "approved", "rejected"],
      default: "pending",
    },
    branchId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Branch",
    },
  },
  {
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true },
  }
);

// ── Indexes ───────────────────────────────────────────────────────────────────
userSchema.index({ role: 1 });
userSchema.index({ approvalStatus: 1 });
userSchema.index({ isActive: 1 });
userSchema.index({ membershipExpiry: 1 });

// ── Pre-save Hook: hash password only when modified ───────────────────────────
userSchema.pre("save", async function (next) {
  if (!this.isModified("passwordHash")) return next();
  const salt = await bcrypt.genSalt(12);
  this.passwordHash = await bcrypt.hash(this.passwordHash, salt);
  next();
});

// ── Instance Method: compare plain password with stored hash ─────────────────
userSchema.methods.comparePassword = async function (plainPassword) {
  return bcrypt.compare(plainPassword, this.passwordHash);
};

// ── Instance Method: generate a membership ID ─────────────────────────────────
userSchema.methods.generateMembershipId = function () {
  const prefix =
    this.role === "admin" ? "ADM" : this.role === "librarian" ? "LIB" : "PAT";
  const suffix = String(Date.now()).slice(-6);
  return `${prefix}${suffix}`;
};

export default mongoose.model("User", userSchema);
