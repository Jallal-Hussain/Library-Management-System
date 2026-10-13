import { Router } from "express";
import { body, param, query } from "express-validator";
import {
  getVendorQuotes,
  getVendorQuoteById,
  createVendorQuote,
  updateVendorQuoteStatus,
  deleteVendorQuote,
} from "../controllers/vendorQuote.controller.js";
import { protect, authorize } from "../middleware/auth.js";
import validate from "../middleware/validate.js";

const router = Router();

// ── Param validators ──────────────────────────────────────────────────────────
const idParam = param("id").isMongoId().withMessage("Invalid vendor quote ID");

// ── Body validators ───────────────────────────────────────────────────────────
const vendorQuoteRules = [
  body("acquisitionId")
    .notEmpty()
    .withMessage("Acquisition ID is required")
    .isMongoId()
    .withMessage("Acquisition ID must be a valid Mongo ID"),
  body("vendorId")
    .notEmpty()
    .withMessage("Vendor ID is required")
    .isMongoId()
    .withMessage("Vendor ID must be a valid Mongo ID"),
  body("price")
    .isFloat({ min: 0 })
    .withMessage("Price must be a non-negative number"),
  body("deliveryDays")
    .isInt({ min: 1 })
    .withMessage("Delivery days must be at least 1"),
  body("validUntil")
    .notEmpty()
    .withMessage("Quote validity date is required")
    .isISO8601()
    .withMessage("validUntil must be a valid ISO 8601 date")
    .custom((date) => {
      if (new Date(date) <= new Date()) {
        throw new Error("validUntil must be a future date");
      }
      return true;
    }),
  body("terms").optional().trim(),
  body("notes").optional().trim(),
];

// ── Status update validators ──────────────────────────────────────────────────
const statusRules = [
  body("status")
    .notEmpty()
    .withMessage("Status is required")
    .isIn(["accepted", "rejected"])
    .withMessage("Status must be either 'accepted' or 'rejected'"),
];

// ── Query validators ──────────────────────────────────────────────────────────
const listQueryRules = [
  query("page").optional().isInt({ min: 1 }).withMessage("page must be a positive integer"),
  query("limit").optional().isInt({ min: 1, max: 100 }).withMessage("limit must be between 1 and 100"),
  query("acquisitionId").optional().isMongoId().withMessage("acquisitionId must be a valid Mongo ID"),
  query("vendorId").optional().isMongoId().withMessage("vendorId must be a valid Mongo ID"),
  query("status")
    .optional()
    .isIn(["pending", "accepted", "rejected"])
    .withMessage("status must be one of: pending, accepted, rejected"),
  query("sort").optional().isIn(["newest", "oldest"]).withMessage("sort must be newest or oldest"),
];

// ── All routes require authentication ─────────────────────────────────────────
router.use(protect, authorize("admin", "librarian"));

router.get("/", listQueryRules, validate, getVendorQuotes);
router.get("/:id", idParam, validate, getVendorQuoteById);
router.post("/", vendorQuoteRules, validate, createVendorQuote);

// ── Status update: admin only ─────────────────────────────────────────────────
router.put(
  "/:id/status",
  authorize("admin"),
  [idParam, ...statusRules],
  validate,
  updateVendorQuoteStatus
);

// ── Delete: admin only ────────────────────────────────────────────────────────
router.delete("/:id", authorize("admin"), idParam, validate, deleteVendorQuote);

export default router;
