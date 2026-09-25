import { Router } from "express";
import { body, query } from "express-validator";
import {
  getSettings,
  updateSettings,
} from "../controllers/settings.controller.js";
import { protect, authorize } from "../middleware/auth.js";
import validate from "../middleware/validate.js";

const router = Router();

router.use(protect);

router.get(
  "/", 
  [query("group").optional().isIn(["circulation", "fines", "membership", "notifications", "general"])],
  validate, 
  getSettings
);

router.put(
  "/", 
  authorize("admin"), 
  [
    body("settings").isArray().withMessage("Settings must be an array of key/value pairs"),
    body("settings.*.key").trim().notEmpty().withMessage("Setting key is required"),
    body("settings.*.value").exists().withMessage("Setting value is required"),
  ], 
  validate, 
  updateSettings
);

export default router;
