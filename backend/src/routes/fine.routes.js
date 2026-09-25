import { Router } from "express";
import { body, param, query } from "express-validator";
import {
  getFines,
  getFineById,
  createFine,
  waiveFine,
} from "../controllers/fine.controller.js";
import { protect, authorize } from "../middleware/auth.js";
import validate from "../middleware/validate.js";

const router = Router();

const idParam = param("id").isMongoId().withMessage("Invalid fine ID");

const listQueryRules = [
  query("page").optional().isInt({ min: 1 }),
  query("limit").optional().isInt({ min: 1, max: 100 }),
  query("sort").optional().isIn(["newest", "oldest"]),
  query("isPaid").optional().isBoolean(),
  query("userId").optional().isMongoId(),
  query("transactionId").optional().isMongoId(),
];

const createRules = [
  body("userId").isMongoId().withMessage("Valid User ID is required"),
  body("transactionId").isMongoId().withMessage("Valid Transaction ID is required"),
  body("amount").isFloat({ min: 0 }).withMessage("Amount must be a positive number"),
  body("reason").isIn(["overdue", "lost", "damaged", "other"]).withMessage("Invalid reason"),
  body("reasonNote").optional().trim().isLength({ max: 300 }),
];

router.use(protect);

router.get("/", listQueryRules, validate, getFines);
router.get("/:id", idParam, validate, getFineById);

router.post("/", authorize("admin", "librarian"), createRules, validate, createFine);
router.put("/:id/waive", authorize("admin", "librarian"), [idParam, body("reason").optional().trim()], validate, waiveFine);

export default router;
