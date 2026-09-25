import { Router } from "express";
import { body, param, query } from "express-validator";
import {
  getBranches,
  getBranchById,
  createBranch,
  updateBranch,
  deleteBranch,
} from "../controllers/branch.controller.js";
import { protect, authorize } from "../middleware/auth.js";
import validate from "../middleware/validate.js";

const router = Router();

const idParam = param("id").isMongoId().withMessage("Invalid branch ID");

const branchRules = [
  body("name").trim().notEmpty().withMessage("Branch name is required").isLength({ max: 150 }),
  body("address").trim().notEmpty().withMessage("Address is required"),
  body("phone").optional().trim(),
  body("email").optional({ checkFalsy: true }).isEmail().normalizeEmail(),
  body("isActive").optional().isBoolean(),
];

router.use(protect);

router.get("/", [query("isActive").optional().isBoolean()], validate, getBranches);
router.get("/:id", idParam, validate, getBranchById);

router.post("/", authorize("admin"), branchRules, validate, createBranch);
router.put("/:id", authorize("admin"), [idParam, ...branchRules.map(r => r.optional())], validate, updateBranch);
router.delete("/:id", authorize("admin"), idParam, validate, deleteBranch);

export default router;
