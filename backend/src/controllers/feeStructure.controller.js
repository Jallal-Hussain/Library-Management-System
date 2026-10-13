import FeeStructure from "../models/FeeStructure.js";
import { sendSuccess, createError } from "../utils/apiResponse.js";

// ── GET /api/fee-structures ───────────────────────────────────────────────────
export const getFeeStructures = async (req, res, next) => {
  try {
    const page  = Math.max(1, parseInt(req.query.page)  || 1);
    const limit = Math.min(100, Math.max(1, parseInt(req.query.limit) || 20));
    const skip  = (page - 1) * limit;

    const filter = {};
    if (req.query.isActive !== undefined) {
      filter.isActive = req.query.isActive === "true";
    }
    if (req.query.type) {
      filter.type = req.query.type;
    }
    if (req.query.rateType) {
      filter.rateType = req.query.rateType;
    }

    const sort =
      req.query.sort === "oldest" ? { createdAt: 1 } : { createdAt: -1 };

    const [total, feeStructures] = await Promise.all([
      FeeStructure.countDocuments(filter),
      FeeStructure.find(filter).sort(sort).skip(skip).limit(limit).lean(),
    ]);

    const totalPages = Math.ceil(total / limit);

    return sendSuccess(
      res,
      200,
      "Fee structures fetched successfully.",
      feeStructures,
      {
        total,
        page,
        limit,
        totalPages,
        hasNextPage: page < totalPages,
        hasPrevPage: page > 1,
      }
    );
  } catch (err) {
    next(err);
  }
};

// ── GET /api/fee-structures/:id ───────────────────────────────────────────────
export const getFeeStructureById = async (req, res, next) => {
  try {
    const feeStructure = await FeeStructure.findById(req.params.id).lean();
    if (!feeStructure) {
      return next(createError("Fee structure not found.", 404));
    }

    return sendSuccess(
      res,
      200,
      "Fee structure fetched successfully.",
      feeStructure
    );
  } catch (err) {
    next(err);
  }
};

// ── POST /api/fee-structures ──────────────────────────────────────────────────
export const createFeeStructure = async (req, res, next) => {
  try {
    const feeStructure = await FeeStructure.create(req.body);
    return sendSuccess(
      res,
      201,
      "Fee structure created successfully.",
      feeStructure
    );
  } catch (err) {
    next(err);
  }
};

// ── PUT /api/fee-structures/:id ───────────────────────────────────────────────
export const updateFeeStructure = async (req, res, next) => {
  try {
    const feeStructure = await FeeStructure.findByIdAndUpdate(
      req.params.id,
      req.body,
      { new: true, runValidators: true }
    );
    if (!feeStructure) {
      return next(createError("Fee structure not found.", 404));
    }

    return sendSuccess(
      res,
      200,
      "Fee structure updated successfully.",
      feeStructure
    );
  } catch (err) {
    next(err);
  }
};

// ── DELETE /api/fee-structures/:id ────────────────────────────────────────────
/**
 * Soft-deactivates the fee structure by setting isActive = false.
 * Pass ?hard=true (admin only) to perform a permanent deletion.
 */
export const deleteFeeStructure = async (req, res, next) => {
  try {
    const feeStructure = await FeeStructure.findById(req.params.id);
    if (!feeStructure) {
      return next(createError("Fee structure not found.", 404));
    }

    if (req.query.hard === "true") {
      await feeStructure.deleteOne();
      return sendSuccess(res, 200, "Fee structure permanently deleted.");
    }

    // Soft delete — deactivate
    feeStructure.isActive = false;
    await feeStructure.save();

    return sendSuccess(res, 200, "Fee structure deactivated successfully.");
  } catch (err) {
    next(err);
  }
};
