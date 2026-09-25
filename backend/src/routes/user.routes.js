import { Router } from "express";
import { body, param, query } from "express-validator";
import {
  getUsers,
  getUserById,
  createUser,
  updateUser,
  deleteUser,
} from "../controllers/user.controller.js";
import { protect, authorize } from "../middleware/auth.js";
import validate from "../middleware/validate.js";

const router = Router();

// ── Reusable validation chains ─────────────────────────────────────────────

const nameRule = body("name").trim().notEmpty().withMessage("Name is required").isLength({ max: 100 });
const emailRule = body("email").trim().notEmpty().isEmail().normalizeEmail();
const roleRule = body("role").optional().isIn(["admin", "librarian", "patron"]);
const approvalRule = body("approvalStatus").optional().isIn(["pending", "approved", "rejected"]);
const isActiveRule = body("isActive").optional().isBoolean();

const createRules = [
  nameRule,
  emailRule,
  body("password").optional().isLength({ min: 6 }),
  roleRule,
  approvalRule,
  isActiveRule,
  body("phone").optional().trim().isLength({ max: 20 }),
  body("address").optional().trim().isLength({ max: 300 }),
  body("borrowingLimit").optional().isInt({ min: 0 }),
];

const updateRules = [
  body("name").optional().trim().notEmpty().isLength({ max: 100 }),
  body("email").optional().trim().notEmpty().isEmail().normalizeEmail(),
  body("password").optional().isLength({ min: 6 }),
  roleRule,
  approvalRule,
  isActiveRule,
  body("phone").optional().trim().isLength({ max: 20 }),
  body("address").optional().trim().isLength({ max: 300 }),
  body("borrowingLimit").optional().isInt({ min: 0 }),
];

const idParam = param("id").isMongoId().withMessage("Invalid user ID");

const listQueryRules = [
  query("page").optional().isInt({ min: 1 }),
  query("limit").optional().isInt({ min: 1, max: 100 }),
  query("sort").optional().isIn(["newest", "oldest"]),
  query("role").optional().isIn(["admin", "librarian", "patron"]),
  query("approvalStatus").optional().isIn(["pending", "approved", "rejected"]),
  query("isActive").optional().isBoolean(),
];

// ── Routes ──────────────────────────────────────────────────────────

// All user routes require at least librarian access to list/view/edit members,
// except members viewing their own profile (which is handled by auth/me or separate routes).

router.use(protect);

router.get("/", authorize("admin", "librarian"), listQueryRules, validate, getUsers);
router.get("/:id", authorize("admin", "librarian"), idParam, validate, getUserById);

router.post("/", authorize("admin", "librarian"), createRules, validate, createUser);

router.put("/:id", authorize("admin", "librarian"), [idParam, ...updateRules], validate, updateUser);

router.delete("/:id", authorize("admin"), idParam, validate, deleteUser);

export default router;
