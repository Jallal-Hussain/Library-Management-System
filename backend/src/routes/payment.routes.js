import { Router } from "express";
import { body, param, query } from "express-validator";
import {
  getPayments,
  getPaymentById,
  processPayment,
} from "../controllers/payment.controller.js";
import { protect, authorize } from "../middleware/auth.js";
import validate from "../middleware/validate.js";

const router = Router();

const idParam = param("id").isMongoId().withMessage("Invalid payment ID");

const listQueryRules = [
  query("page").optional().isInt({ min: 1 }),
  query("limit").optional().isInt({ min: 1, max: 100 }),
  query("sort").optional().isIn(["newest", "oldest"]),
  query("status").optional().isIn(["pending", "completed", "failed", "refunded"]),
  query("userId").optional().isMongoId(),
  query("method").optional().isIn(["card", "cash", "check", "transfer"]),
];

const createRules = [
  body("userId").isMongoId().withMessage("Valid User ID is required"),
  body("fineId").optional().isMongoId(),
  body("amount").isFloat({ min: 0.01 }).withMessage("Amount must be greater than 0"),
  body("method").isIn(["card", "cash", "check", "transfer"]).withMessage("Invalid payment method"),
  body("transactionRef").optional().trim(),
  body("notes").optional().trim().isLength({ max: 300 }),
];

router.use(protect);

router.get("/", listQueryRules, validate, getPayments);
router.get("/:id", idParam, validate, getPaymentById);

// Processing a payment usually requires staff privileges
router.post("/", authorize("admin", "librarian"), createRules, validate, processPayment);

export default router;
