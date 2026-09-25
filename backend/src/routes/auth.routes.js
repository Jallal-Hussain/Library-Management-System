import { Router } from "express";
import { body } from "express-validator";
import {
  register,
  login,
  getMe,
  logout,
  changePassword,
} from "../controllers/auth.controller.js";
import { protect } from "../middleware/auth.js";
import validate from "../middleware/validate.js";

const router = Router();

// ── Validation rule sets ──────────────────────────────────────────────────────

const registerRules = [
  body("name")
    .trim()
    .notEmpty().withMessage("Name is required")
    .isLength({ max: 100 }).withMessage("Name cannot exceed 100 characters"),

  body("email")
    .trim()
    .notEmpty().withMessage("Email is required")
    .isEmail().withMessage("Please provide a valid email")
    .normalizeEmail(),

  body("password")
    .notEmpty().withMessage("Password is required")
    .isLength({ min: 6 }).withMessage("Password must be at least 6 characters"),

  body("phone")
    .optional()
    .trim()
    .isLength({ max: 20 }).withMessage("Phone cannot exceed 20 characters"),

  body("address")
    .optional()
    .trim()
    .isLength({ max: 300 }).withMessage("Address cannot exceed 300 characters"),
];

const loginRules = [
  body("email")
    .trim()
    .notEmpty().withMessage("Email is required")
    .isEmail().withMessage("Please provide a valid email")
    .normalizeEmail(),

  body("password")
    .notEmpty().withMessage("Password is required"),
];

const changePasswordRules = [
  body("currentPassword")
    .notEmpty().withMessage("Current password is required"),

  body("newPassword")
    .notEmpty().withMessage("New password is required")
    .isLength({ min: 6 }).withMessage("New password must be at least 6 characters")
    .custom((value, { req }) => {
      if (value === req.body.currentPassword) {
        throw new Error("New password must be different from the current password");
      }
      return true;
    }),
];

// ── Routes ────────────────────────────────────────────────────────────────────

// Public
router.post("/register", registerRules, validate, register);
router.post("/login",    loginRules,    validate, login);

// Protected
router.get ("/me",              protect, getMe);
router.post("/logout",          protect, logout);
router.put ("/change-password", protect, changePasswordRules, validate, changePassword);

export default router;
