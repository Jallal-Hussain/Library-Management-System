import { Router } from "express";
import { body, param, query } from "express-validator";
import {
  getILLRequests,
  getILLRequestById,
  createILLRequest,
  updateILLStatus,
} from "../controllers/ill.controller.js";
import { protect, authorize } from "../middleware/auth.js";
import validate from "../middleware/validate.js";

const router = Router();

const idParam = param("id").isMongoId().withMessage("Invalid ID");

const listQueryRules = [
  query("page").optional().isInt({ min: 1 }),
  query("limit").optional().isInt({ min: 1, max: 100 }),
  query("sort").optional().isIn(["newest", "oldest"]),
  query("status").optional().isIn(["requested", "approved", "in_transit", "received", "issued", "returned", "rejected", "cancelled"]),
  query("requestedBy").optional().isMongoId(),
];

const createRules = [
  body("title").trim().notEmpty().withMessage("Title is required"),
  body("partnerLibrary").trim().notEmpty().withMessage("Partner library is required"),
  body("author").optional().trim(),
  body("isbn").optional().trim(),
  body("notes").optional().trim().isLength({ max: 500 }),
];

router.use(protect);

router.get("/", listQueryRules, validate, getILLRequests);
router.get("/:id", idParam, validate, getILLRequestById);

router.post("/", createRules, validate, createILLRequest);

router.put(
  "/:id/status",
  authorize("admin", "librarian"),
  [
    idParam,
    body("status").isIn(["requested", "approved", "in_transit", "received", "issued", "returned", "rejected", "cancelled"]),
    body("dueDate").optional().isISO8601().toDate(),
    body("borrowingFee").optional().isFloat({ min: 0 }),
    body("partnerLibraryContact").optional().trim(),
    body("notes").optional().trim().isLength({ max: 500 }),
  ],
  validate,
  updateILLStatus
);

export default router;
