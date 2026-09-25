import { Router } from "express";
import { body, param, query } from "express-validator";
import {
  getBooks,
  getBookById,
  createBook,
  updateBook,
  deleteBook,
  getCategories,
} from "../controllers/book.controller.js";
import { protect, authorize } from "../middleware/auth.js";
import validate from "../middleware/validate.js";

const router = Router();

// ── Reusable validation chains ─────────────────────────────────────────────

/** Core book fields — used for both create (required) and update (optional) */
const titleRule = body("title")
  .trim()
  .notEmpty().withMessage("Title is required")
  .isLength({ max: 300 }).withMessage("Title cannot exceed 300 characters");

const authorRule = body("author")
  .trim()
  .notEmpty().withMessage("Author is required")
  .isLength({ max: 200 }).withMessage("Author cannot exceed 200 characters");

const isbnRule = body("isbn")
  .trim()
  .notEmpty().withMessage("ISBN is required");

const categoryRule = body("category")
  .trim()
  .notEmpty().withMessage("Category is required");

const totalCopiesRule = body("totalCopies")
  .isInt({ min: 1 }).withMessage("Total copies must be at least 1");

const optionalFields = [
  body("genre").optional().trim(),
  body("publisher").optional().trim(),
  body("publishYear")
    .optional()
    .isInt({ min: 1000, max: new Date().getFullYear() + 1 })
    .withMessage("Invalid publish year"),
  body("description")
    .optional()
    .trim()
    .isLength({ max: 2000 }).withMessage("Description cannot exceed 2000 characters"),
  body("coverImage").optional().trim().isURL().withMessage("Cover image must be a valid URL"),
  body("location").optional().trim().isLength({ max: 50 }).withMessage("Location code too long"),
  body("deweyClassification").optional().trim(),
  body("keywords").optional().isArray().withMessage("Keywords must be an array"),
  body("availableCopies").optional().isInt({ min: 0 }).withMessage("Available copies cannot be negative"),
  body("status")
    .optional()
    .isIn(["available", "borrowed", "reserved", "lost", "damaged"])
    .withMessage("Invalid status value"),
];

const createRules = [titleRule, authorRule, isbnRule, categoryRule, totalCopiesRule, ...optionalFields];

const updateRules = [
  body("title").optional().trim().notEmpty().isLength({ max: 300 }),
  body("author").optional().trim().notEmpty().isLength({ max: 200 }),
  body("isbn").optional().trim().notEmpty(),
  body("category").optional().trim().notEmpty(),
  body("totalCopies").optional().isInt({ min: 1 }),
  ...optionalFields,
];

const idParam = param("id").isMongoId().withMessage("Invalid book ID");

const listQueryRules = [
  query("page").optional().isInt({ min: 1 }),
  query("limit").optional().isInt({ min: 1, max: 100 }),
  query("sort")
    .optional()
    .isIn(["title", "-title", "author", "-author", "newest", "oldest", "publishYear"])
    .withMessage("Invalid sort value"),
  query("status")
    .optional()
    .isIn(["available", "borrowed", "reserved", "lost", "damaged"]),
  query("yearFrom").optional().isInt({ min: 1000 }),
  query("yearTo").optional().isInt({ min: 1000 }),
  query("available").optional().isIn(["true", "false"]),
];

// ── Public routes ──────────────────────────────────────────────────────────
router.get("/",            listQueryRules, validate, getBooks);
router.get("/categories",  getCategories);
router.get("/:id",         idParam, validate, getBookById);

// ── Protected: admin | librarian only ─────────────────────────────────────
router.post(
  "/",
  protect,
  authorize("admin", "librarian"),
  createRules,
  validate,
  createBook,
);

router.put(
  "/:id",
  protect,
  authorize("admin", "librarian"),
  [idParam, ...updateRules],
  validate,
  updateBook,
);

router.delete(
  "/:id",
  protect,
  authorize("admin"),
  idParam,
  validate,
  deleteBook,
);

export default router;
