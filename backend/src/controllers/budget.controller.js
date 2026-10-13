import Budget from "../models/Budget.js";
import { sendSuccess, createError } from "../utils/apiResponse.js";

// ── GET /api/budgets ──────────────────────────────────────────────────────────
export const getBudgets = async (req, res, next) => {
  try {
    const page  = Math.max(1, parseInt(req.query.page)  || 1);
    const limit = Math.min(100, Math.max(1, parseInt(req.query.limit) || 20));
    const skip  = (page - 1) * limit;

    const filter = {};

    if (req.query.isActive !== undefined) {
      filter.isActive = req.query.isActive === "true";
    }
    if (req.query.category) {
      filter.category = new RegExp(req.query.category.trim(), "i");
    }
    // Date range filter: budgets whose period overlaps [startDate, endDate]
    if (req.query.startDate || req.query.endDate) {
      if (req.query.startDate) {
        filter.endDate = { $gte: new Date(req.query.startDate) };
      }
      if (req.query.endDate) {
        filter.startDate = {
          ...(filter.startDate || {}),
          $lte: new Date(req.query.endDate),
        };
      }
    }

    const sort =
      req.query.sort === "oldest" ? { createdAt: 1 } : { createdAt: -1 };

    const [total, budgets] = await Promise.all([
      Budget.countDocuments(filter),
      Budget.find(filter).sort(sort).skip(skip).limit(limit),
      // Note: do NOT use .lean() here — we need virtuals (remainingAmount, utilizationPercent)
    ]);

    const totalPages = Math.ceil(total / limit);

    return sendSuccess(
      res,
      200,
      "Budgets fetched successfully.",
      budgets,
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

// ── GET /api/budgets/:id ──────────────────────────────────────────────────────
export const getBudgetById = async (req, res, next) => {
  try {
    // No .lean() so virtuals are included
    const budget = await Budget.findById(req.params.id);
    if (!budget) return next(createError("Budget not found.", 404));

    return sendSuccess(res, 200, "Budget fetched successfully.", budget);
  } catch (err) {
    next(err);
  }
};

// ── POST /api/budgets ─────────────────────────────────────────────────────────
export const createBudget = async (req, res, next) => {
  try {
    const budget = await Budget.create(req.body);
    return sendSuccess(res, 201, "Budget created successfully.", budget);
  } catch (err) {
    next(err);
  }
};

// ── PUT /api/budgets/:id ──────────────────────────────────────────────────────
export const updateBudget = async (req, res, next) => {
  try {
    const { spentAmount, totalAmount, ...rest } = req.body;

    // Fetch current document to enforce the overspend rule
    const budget = await Budget.findById(req.params.id);
    if (!budget) return next(createError("Budget not found.", 404));

    // Determine proposed amounts
    const newTotal = totalAmount !== undefined ? totalAmount : budget.totalAmount;
    const newSpent = spentAmount !== undefined ? spentAmount : budget.spentAmount;

    if (
      newSpent > newTotal &&
      req.body.allowDeficit !== true  // explicit override flag
    ) {
      return next(
        createError(
          "spentAmount cannot exceed totalAmount. Pass allowDeficit: true to override.",
          422
        )
      );
    }

    // Apply updates
    Object.assign(budget, rest);
    if (totalAmount !== undefined) budget.totalAmount = totalAmount;
    if (spentAmount !== undefined) budget.spentAmount = spentAmount;

    await budget.save();

    return sendSuccess(res, 200, "Budget updated successfully.", budget);
  } catch (err) {
    next(err);
  }
};

// ── DELETE /api/budgets/:id ───────────────────────────────────────────────────
/**
 * Soft-deactivates the budget. Pass ?hard=true (admin only) for a hard delete.
 */
export const deleteBudget = async (req, res, next) => {
  try {
    const budget = await Budget.findById(req.params.id);
    if (!budget) return next(createError("Budget not found.", 404));

    if (req.query.hard === "true") {
      await budget.deleteOne();
      return sendSuccess(res, 200, "Budget permanently deleted.");
    }

    budget.isActive = false;
    await budget.save();

    return sendSuccess(res, 200, "Budget deactivated successfully.");
  } catch (err) {
    next(err);
  }
};
