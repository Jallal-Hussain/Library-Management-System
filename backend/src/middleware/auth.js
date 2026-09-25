import jwt from "jsonwebtoken";
import User from "../models/User.js";
import { createError } from "../utils/apiResponse.js";

/**
 * protect — verifies the JWT in the Authorization header.
 * Attaches the fresh user document to req.user on success.
 * Usage: router.get("/route", protect, handler)
 */
export const protect = async (req, res, next) => {
  try {
    // 1. Extract token from "Authorization: Bearer <token>"
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      return next(createError("No token provided. Please log in.", 401));
    }

    const token = authHeader.split(" ")[1];

    // 2. Verify signature and expiry
    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    // 3. Fetch fresh user from DB (catches deactivated accounts)
    const user = await User.findById(decoded.id).select("-passwordHash");
    if (!user) {
      return next(createError("User no longer exists.", 401));
    }

    // 4. Block inactive / rejected accounts
    if (!user.isActive) {
      const msg =
        user.approvalStatus === "pending"
          ? "Your account is pending admin approval."
          : user.approvalStatus === "rejected"
          ? "Your account has been rejected. Contact the library."
          : "Your account is inactive. Contact the library.";
      return next(createError(msg, 403));
    }

    req.user = user;
    next();
  } catch (err) {
    next(err); // JsonWebTokenError / TokenExpiredError handled by errorHandler
  }
};

/**
 * authorize — role-based access guard. Must be used AFTER protect.
 * @param {...string} roles — allowed roles, e.g. authorize("admin", "librarian")
 * Usage: router.get("/route", protect, authorize("admin"), handler)
 */
export const authorize = (...roles) => {
  return (req, res, next) => {
    if (!roles.includes(req.user.role)) {
      return next(
        createError(
          `Access denied. Required role: ${roles.join(" or ")}. Your role: ${req.user.role}.`,
          403
        )
      );
    }
    next();
  };
};
