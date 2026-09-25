import { Router } from "express";
import { body, param, query } from "express-validator";
import {
  getInvoices,
  getInvoiceById,
  createInvoice,
  updateInvoice,
  payInvoice,
  deleteInvoice,
} from "../controllers/invoice.controller.js";
import { protect, authorize } from "../middleware/auth.js";
import validate from "../middleware/validate.js";

const router = Router();

const idParam = param("id").isMongoId().withMessage("Invalid ID");

const createRules = [
  body("vendorId").isMongoId().withMessage("Vendor ID is required"),
  body("acquisitionId").optional().isMongoId(),
  body("amount").isFloat({ min: 0 }).withMessage("Amount cannot be negative"),
  body("dueDate").isISO8601().toDate().withMessage("Valid due date is required"),
  body("notes").optional().trim().isLength({ max: 500 }),
];

router.use(protect, authorize("admin", "librarian"));

router.get("/", validate, getInvoices);
router.get("/:id", idParam, validate, getInvoiceById);

router.post("/", createRules, validate, createInvoice);
router.put("/:id", [idParam, ...createRules.map(r => r.optional())], validate, updateInvoice);

router.put(
  "/:id/pay",
  [idParam, body("paymentMethod").optional().isIn(["card", "cash", "check", "transfer"])],
  validate,
  payInvoice
);

router.delete("/:id", authorize("admin"), idParam, validate, deleteInvoice);

export default router;
