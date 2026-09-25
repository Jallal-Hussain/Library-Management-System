import User from "../models/User.js";
import { sendSuccess, createError } from "../utils/apiResponse.js";

// ── Helpers ───────────────────────────────────────────────────────────────────

const buildFilter = (query) => {
  const filter = {};

  if (query.q && query.q.trim()) {
    const searchRegex = new RegExp(query.q.trim(), "i");
    filter.$or = [
      { name: searchRegex },
      { email: searchRegex },
      { membershipId: searchRegex },
    ];
  }

  if (query.role) filter.role = query.role;
  if (query.approvalStatus) filter.approvalStatus = query.approvalStatus;
  
  if (query.isActive !== undefined) {
    filter.isActive = query.isActive === "true";
  }

  return filter;
};

// ─────────────────────────────────────────────────────────────────────────────
// GET /api/users
// ─────────────────────────────────────────────────────────────────────────────
export const getUsers = async (req, res, next) => {
  try {
    const page = Math.max(1, parseInt(req.query.page) || 1);
    const limit = Math.min(100, Math.max(1, parseInt(req.query.limit) || 20));
    const skip = (page - 1) * limit;

    const filter = buildFilter(req.query);
    const sort = req.query.sort === "oldest" ? { createdAt: 1 } : { createdAt: -1 };

    const [total, users] = await Promise.all([
      User.countDocuments(filter),
      User.find(filter).sort(sort).skip(skip).limit(limit).lean(),
    ]);

    const totalPages = Math.ceil(total / limit);

    return sendSuccess(res, 200, "Users fetched successfully.", users, {
      total,
      page,
      limit,
      totalPages,
      hasNextPage: page < totalPages,
      hasPrevPage: page > 1,
    });
  } catch (err) {
    next(err);
  }
};

// ─────────────────────────────────────────────────────────────────────────────
// GET /api/users/:id
// ─────────────────────────────────────────────────────────────────────────────
export const getUserById = async (req, res, next) => {
  try {
    const user = await User.findById(req.params.id).lean();
    if (!user) return next(createError("User not found.", 404));

    return sendSuccess(res, 200, "User fetched successfully.", user);
  } catch (err) {
    next(err);
  }
};

// ─────────────────────────────────────────────────────────────────────────────
// POST /api/users   (admin | librarian only)
// ─────────────────────────────────────────────────────────────────────────────
export const createUser = async (req, res, next) => {
  try {
    const { name, email, password, role, phone, address, borrowingLimit, branchId, isActive, approvalStatus } = req.body;

    const existing = await User.findOne({ email: email.toLowerCase() });
    if (existing) {
      return next(createError("An account with this email already exists.", 409));
    }

    const user = new User({
      name,
      email,
      passwordHash: password || "password123", // Default password if not provided
      role: role || "patron",
      phone,
      address,
      borrowingLimit,
      branchId,
      isActive: isActive !== undefined ? isActive : true,
      approvalStatus: approvalStatus || "approved",
    });

    user.membershipId = user.generateMembershipId();

    await user.save();

    const userObj = user.toObject();
    delete userObj.passwordHash;

    return sendSuccess(res, 201, "User created successfully.", userObj);
  } catch (err) {
    next(err);
  }
};

// ─────────────────────────────────────────────────────────────────────────────
// PUT /api/users/:id   (admin | librarian only)
// ─────────────────────────────────────────────────────────────────────────────
export const updateUser = async (req, res, next) => {
  try {
    const user = await User.findById(req.params.id);
    if (!user) return next(createError("User not found.", 404));

    if (req.body.email && req.body.email.toLowerCase() !== user.email) {
      const conflict = await User.findOne({ email: req.body.email.toLowerCase() });
      if (conflict) {
        return next(createError("This email is already in use by another user.", 409));
      }
    }

    const UPDATABLE_FIELDS = [
      "name", "email", "role", "phone", "address", "borrowingLimit", 
      "isActive", "approvalStatus", "branchId"
    ];

    UPDATABLE_FIELDS.forEach((field) => {
      if (req.body[field] !== undefined) {
        user[field] = req.body[field];
      }
    });

    if (req.body.password) {
       user.passwordHash = req.body.password;
    }

    // If changing role and membershipId needs regenerating, we might do it, 
    // but usually membership ID stays consistent. We'll leave it as is unless explicitly requested.

    // If approved, ensure isActive is true automatically? We'll let the frontend handle the exact state.

    await user.save();

    const userObj = user.toObject();
    delete userObj.passwordHash;

    return sendSuccess(res, 200, "User updated successfully.", userObj);
  } catch (err) {
    next(err);
  }
};

// ─────────────────────────────────────────────────────────────────────────────
// DELETE /api/users/:id   (admin only)
// ─────────────────────────────────────────────────────────────────────────────
export const deleteUser = async (req, res, next) => {
  try {
    const user = await User.findById(req.params.id);
    if (!user) return next(createError("User not found.", 404));

    // Hard delete for now, or just deactivate. Let's do hard delete since we don't have isDeleted.
    // However, if they have active transactions, we shouldn't delete them. We will just deactivate them for safety.
    user.isActive = false;
    user.approvalStatus = "rejected";
    await user.save();

    return sendSuccess(res, 200, "User deactivated successfully.");
  } catch (err) {
    next(err);
  }
};
