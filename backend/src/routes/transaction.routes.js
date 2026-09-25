import { Router } from "express";
import { body, param, query } from "express-validator";
import {
  getTransactions,
  getTransactionById,
  borrowBook,
  returnBook,
  renewBook,
} from "../controllers/transaction.controller.js";
import { protect, authorize } from "../middleware/auth.js";
import validate from "../middleware/validate.js";

const router = Router();

const idParam = param("id").isMongoId().withMessage("Invalid transaction ID");

const listQueryRules = [
  query("page").optional().isInt({ min: 1 }),
  query("limit").optional().isInt({ min: 1, max: 100 }),
  query("sort").optional().isIn(["newest", "oldest"]),
  query("status").optional().isIn(["active", "returned", "overdue", "lost"]),
  query("userId").optional().isMongoId(),
  query("bookId").optional().isMongoId(),
];

const borrowRules = [
  body("userId").isMongoId().withMessage("Valid User ID is required"),
  body("bookId").isMongoId().withMessage("Valid Book ID is required"),
  body("notes").optional().trim().isLength({ max: 500 }),
];

router.use(protect);

// Patrons can view their own transactions, admins/librarians can view all
router.get("/", listQueryRules, validate, getTransactions);
router.get("/:id", idParam, validate, getTransactionById);

// Borrow and Return require librarian access
router.post("/borrow", authorize("admin", "librarian"), borrowRules, validate, borrowBook);
router.put("/:id/return", authorize("admin", "librarian"), idParam, validate, returnBook);

// Renew can be done by patron (for their own) or librarian (for anyone)
router.put("/:id/renew", idParam, validate, renewBook);

export default router;
