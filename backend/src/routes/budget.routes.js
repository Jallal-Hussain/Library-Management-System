import { Router } from "express";
import { body, param, query } from "express-validator";
import {
  getBudgets,
  getBudgetById,
  createBudget,
  updateBudget,
  deleteBudget,
} from "../controllers/budget.controller.js";
import { protect, authorize } from "../middleware/auth.js";
import validate from "../middleware/validate.js";

const router = Router();

// ── Param validators ──────────────────────────────────────────────────────────
const idParam = param("id").isMongoId().withMessage("Invalid budget ID");

// ── Body validators ───────────────────────────────────────────────────────────
const budgetRules = [
  body("name")
    .trim()
    .notEmpty()
    .withMessage("Budget name is required")
    .isLength({ max: 150 })
    .withMessage("Name cannot exceed 150 characters"),
  body("category").optional().trim(),
  body("totalAmount")
    .isFloat({ min: 0 })
    .withMessage("Total amount must be a non-negative number"),
  body("spentAmount")
    .optional()
    .isFloat({ min: 0 })
    .withMessage("Spent amount must be a non-negative number"),
  body("startDate")
    .notEmpty()
    .withMessage("Start date is required")
    .isISO8601()
    .withMessage("Start date must be a valid ISO 8601 date"),
  body("endDate")
    .notEmpty()
    .withMessage("End date is required")
    .isISO8601()
    .withMessage("End date must be a valid ISO 8601 date")
    .custom((endDate, { req }) => {
      if (req.body.startDate && new Date(endDate) <= new Date(req.body.startDate)) {
        throw new Error("endDate must be after startDate");
      }
      return true;
    }),
  body("isActive").optional().isBoolean().withMessage("isActive must be a boolean"),
  body("notes")
    .optional()
    .trim()
    .isLength({ max: 1000 })
    .withMessage("Notes cannot exceed 1000 characters"),
  body("allowDeficit")
    .optional()
    .isBoolean()
    .withMessage("allowDeficit must be a boolean"),
];

// ── Query validators ──────────────────────────────────────────────────────────
const listQueryRules = [
  query("page").optional().isInt({ min: 1 }).withMessage("page must be a positive integer"),
  query("limit").optional().isInt({ min: 1, max: 100 }).withMessage("limit must be between 1 and 100"),
  query("isActive").optional().isBoolean().withMessage("isActive must be true or false"),
  query("category").optional().trim(),
  query("startDate").optional().isISO8601().withMessage("startDate must be a valid ISO 8601 date"),
  query("endDate").optional().isISO8601().withMessage("endDate must be a valid ISO 8601 date"),
  query("sort").optional().isIn(["newest", "oldest"]).withMessage("sort must be newest or oldest"),
];

// ── All routes require authentication ─────────────────────────────────────────
router.use(protect, authorize("admin", "librarian"));

router.get("/", listQueryRules, validate, getBudgets);
router.get("/:id", idParam, validate, getBudgetById);

// ── Write operations: admin only ──────────────────────────────────────────────
router.post("/", authorize("admin"), budgetRules, validate, createBudget);

router.put(
  "/:id",
  authorize("admin"),
  [idParam, ...budgetRules.map((r) => r.optional())],
  validate,
  updateBudget
);

router.delete("/:id", authorize("admin"), idParam, validate, deleteBudget);

export default router;
