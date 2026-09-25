import jwt from "jsonwebtoken";
import User from "../models/User.js";
import Notification from "../models/Notification.js";
import { sendSuccess, createError } from "../utils/apiResponse.js";

// ── Helper: sign a JWT ────────────────────────────────────────────────────────
const signToken = (user) =>
  jwt.sign(
    { id: user._id, email: user.email, role: user.role },
    process.env.JWT_SECRET,
    { expiresIn: process.env.JWT_EXPIRES_IN || "7d" }
  );

// ── Helper: strip sensitive fields from user before sending ──────────────────
const sanitizeUser = (user) => {
  const obj = user.toObject ? user.toObject() : { ...user };
  delete obj.passwordHash;
  return obj;
};

// ─────────────────────────────────────────────────────────────────────────────
// POST /api/auth/register
// ─────────────────────────────────────────────────────────────────────────────
export const register = async (req, res, next) => {
  try {
    const { name, email, password, phone, address } = req.body;

    // Check duplicate email
    const existing = await User.findOne({ email: email.toLowerCase() });
    if (existing) {
      return next(createError("An account with this email already exists.", 409));
    }

    // Create user — passwordHash pre-save hook will bcrypt it
    const user = new User({
      name,
      email,
      passwordHash: password,  // pre-save hook hashes this
      phone,
      address,
      role: "patron",
      isActive: false,
      approvalStatus: "pending",
    });

    await user.save();

    // Notify the new user of their pending status
    await Notification.create({
      userId: user._id,
      title: "Registration Received",
      message:
        "Welcome! Your registration is pending admin approval. You will be notified once approved.",
      type: "approval",
    });

    const token = signToken(user);

    return sendSuccess(res, 201, "Registration successful! Awaiting admin approval.", {
      token,
      user: sanitizeUser(user),
    });
  } catch (err) {
    next(err);
  }
};

// ─────────────────────────────────────────────────────────────────────────────
// POST /api/auth/login
// ─────────────────────────────────────────────────────────────────────────────
export const login = async (req, res, next) => {
  try {
    const { email, password } = req.body;

    // Fetch user WITH password for comparison
    const user = await User.findOne({ email: email.toLowerCase() }).select(
      "+passwordHash"
    );

    if (!user || !(await user.comparePassword(password))) {
      return next(createError("Invalid email or password.", 401));
    }

    // Block inactive / rejected users at login
    if (!user.isActive) {
      const msg =
        user.approvalStatus === "pending"
          ? "Your account is pending admin approval."
          : user.approvalStatus === "rejected"
          ? "Your account has been rejected. Please contact the library."
          : "Your account is inactive. Please contact the library.";
      return next(createError(msg, 403));
    }

    const token = signToken(user);

    return sendSuccess(res, 200, "Login successful.", {
      token,
      user: sanitizeUser(user),
    });
  } catch (err) {
    next(err);
  }
};

// ─────────────────────────────────────────────────────────────────────────────
// GET /api/auth/me  (protected)
// ─────────────────────────────────────────────────────────────────────────────
export const getMe = async (req, res, next) => {
  try {
    // req.user is attached by the protect middleware (already sanitized)
    return sendSuccess(res, 200, "User fetched successfully.", req.user);
  } catch (err) {
    next(err);
  }
};

// ─────────────────────────────────────────────────────────────────────────────
// POST /api/auth/logout  (protected)
// JWT is stateless — instruct the client to discard the token.
// ─────────────────────────────────────────────────────────────────────────────
export const logout = async (req, res, next) => {
  try {
    return sendSuccess(res, 200, "Logged out successfully. Please discard your token.");
  } catch (err) {
    next(err);
  }
};

// ─────────────────────────────────────────────────────────────────────────────
// PUT /api/auth/change-password  (protected)
// ─────────────────────────────────────────────────────────────────────────────
export const changePassword = async (req, res, next) => {
  try {
    const { currentPassword, newPassword } = req.body;

    // Fetch user with password for verification
    const user = await User.findById(req.user._id).select("+passwordHash");
    if (!user) return next(createError("User not found.", 404));

    // Verify current password
    const isMatch = await user.comparePassword(currentPassword);
    if (!isMatch) {
      return next(createError("Current password is incorrect.", 401));
    }

    // Assign new password — pre-save hook will hash it
    user.passwordHash = newPassword;
    await user.save();

    return sendSuccess(res, 200, "Password changed successfully.");
  } catch (err) {
    next(err);
  }
};
