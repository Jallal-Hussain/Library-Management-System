import { Router } from "express";
import { body, param, query } from "express-validator";
import {
  getVendors,
  getVendorById,
  createVendor,
  updateVendor,
  deleteVendor,
} from "../controllers/vendor.controller.js";
import { protect, authorize } from "../middleware/auth.js";
import validate from "../middleware/validate.js";

const router = Router();

const idParam = param("id").isMongoId().withMessage("Invalid vendor ID");

const vendorRules = [
  body("name").trim().notEmpty().withMessage("Name is required").isLength({ max: 150 }),
  body("email").optional({ checkFalsy: true }).isEmail().normalizeEmail(),
  body("phone").optional().trim(),
  body("address").optional().trim(),
  body("contactPerson").optional().trim(),
  body("website").optional().trim(),
  body("paymentTerms").optional().trim(),
  body("notes").optional().trim().isLength({ max: 500 }),
  body("isActive").optional().isBoolean(),
];

const listQueryRules = [
  query("page").optional().isInt({ min: 1 }).withMessage("Page must be a positive integer"),
  query("limit").optional().isInt({ min: 1, max: 100 }).withMessage("Limit must be between 1 and 100"),
  query("isActive").optional().isBoolean().withMessage("isActive must be a boolean"),
  query("q").optional().trim().isLength({ max: 100 }),
];

router.use(protect, authorize("admin", "librarian"));

router.get("/", listQueryRules, validate, getVendors);
router.get("/:id", idParam, validate, getVendorById);
router.post("/", vendorRules, validate, createVendor);
router.put("/:id", [idParam, ...vendorRules.map(r => r.optional())], validate, updateVendor);
router.delete("/:id", authorize("admin"), idParam, validate, deleteVendor);

export default router;
