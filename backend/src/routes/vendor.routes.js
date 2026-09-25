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

router.use(protect, authorize("admin", "librarian"));

router.get("/", validate, getVendors);
router.get("/:id", idParam, validate, getVendorById);
router.post("/", vendorRules, validate, createVendor);
router.put("/:id", [idParam, ...vendorRules.map(r => r.optional())], validate, updateVendor);
router.delete("/:id", authorize("admin"), idParam, validate, deleteVendor);

export default router;
