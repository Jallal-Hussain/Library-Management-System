import { Router } from "express";
import { body, param, query } from "express-validator";
import {
  getFeeStructures,
  getFeeStructureById,
  createFeeStructure,
  updateFeeStructure,
  deleteFeeStructure,
} from "../controllers/feeStructure.controller.js";
import { protect, authorize } from "../middleware/auth.js";
import validate from "../middleware/validate.js";

const router = Router();

// ── Param validators ──────────────────────────────────────────────────────────
const idParam = param("id").isMongoId().withMessage("Invalid fee structure ID");

// ── Body validators ───────────────────────────────────────────────────────────
const feeStructureRules = [
  body("type")
    .trim()
    .notEmpty()
    .withMessage("Fee type is required")
    .isIn(["overdue", "lost", "damaged", "processing"])
    .withMessage("Type must be one of: overdue, lost, damaged, processing"),
  body("name")
    .trim()
    .notEmpty()
    .withMessage("Fee name is required")
    .isLength({ max: 100 })
    .withMessage("Name cannot exceed 100 characters"),
  body("rate")
    .isFloat({ min: 0 })
    .withMessage("Rate must be a non-negative number"),
  body("rateType")
    .trim()
    .notEmpty()
    .withMessage("Rate type is required")
    .isIn(["per_day", "fixed", "percentage"])
    .withMessage("Rate type must be one of: per_day, fixed, percentage"),
  body("maxAmount")
    .optional({ nullable: true })
    .isFloat({ min: 0 })
    .withMessage("Max amount must be a non-negative number"),
  body("appliesTo")
    .optional()
    .isIn(["all", "patron", "librarian"])
    .withMessage("appliesTo must be one of: all, patron, librarian"),
  body("isActive").optional().isBoolean().withMessage("isActive must be a boolean"),
];

// ── Query validators for list endpoint ───────────────────────────────────────
const listQueryRules = [
  query("page").optional().isInt({ min: 1 }).withMessage("page must be a positive integer"),
  query("limit").optional().isInt({ min: 1, max: 100 }).withMessage("limit must be between 1 and 100"),
  query("isActive").optional().isBoolean().withMessage("isActive must be true or false"),
  query("type")
    .optional()
    .isIn(["overdue", "lost", "damaged", "processing"])
    .withMessage("Invalid type filter"),
  query("rateType")
    .optional()
    .isIn(["per_day", "fixed", "percentage"])
    .withMessage("Invalid rateType filter"),
  query("sort").optional().isIn(["newest", "oldest"]).withMessage("sort must be newest or oldest"),
];

// ── All routes require authentication ─────────────────────────────────────────
router.use(protect, authorize("admin", "librarian"));

router.get("/", listQueryRules, validate, getFeeStructures);
router.get("/:id", idParam, validate, getFeeStructureById);

// ── Write operations: admin only ──────────────────────────────────────────────
router.post(
  "/",
  authorize("admin"),
  feeStructureRules,
  validate,
  createFeeStructure
);

router.put(
  "/:id",
  authorize("admin"),
  [idParam, ...feeStructureRules.map((r) => r.optional())],
  validate,
  updateFeeStructure
);

router.delete(
  "/:id",
  authorize("admin"),
  idParam,
  validate,
  deleteFeeStructure
);

export default router;
