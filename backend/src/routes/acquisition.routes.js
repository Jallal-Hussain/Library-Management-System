import { Router } from "express";
import { body, param, query } from "express-validator";
import {
  getAcquisitions,
  getAcquisitionById,
  createAcquisition,
  updateAcquisition,
  updateAcquisitionStatus,
  deleteAcquisition,
} from "../controllers/acquisition.controller.js";
import { protect, authorize } from "../middleware/auth.js";
import validate from "../middleware/validate.js";

const router = Router();

const idParam = param("id").isMongoId().withMessage("Invalid ID");

const createRules = [
  body("title").trim().notEmpty().withMessage("Title is required"),
  body("author").optional().trim(),
  body("isbn").optional().trim(),
  body("vendorId").optional().isMongoId(),
  body("quantity").isInt({ min: 1 }).withMessage("Quantity must be at least 1"),
  body("unitPrice").isFloat({ min: 0 }).withMessage("Unit price cannot be negative"),
  body("notes").optional().trim().isLength({ max: 500 }),
];

router.use(protect, authorize("admin", "librarian"));

router.get("/", validate, getAcquisitions);
router.get("/:id", idParam, validate, getAcquisitionById);

router.post("/", createRules, validate, createAcquisition);
router.put("/:id", [idParam, ...createRules.map(r => r.optional())], validate, updateAcquisition);

router.put(
  "/:id/status",
  [idParam, body("status").isIn(["requested", "approved", "ordered", "received", "cancelled"])],
  validate,
  updateAcquisitionStatus
);

router.delete("/:id", authorize("admin"), idParam, validate, deleteAcquisition);

export default router;
