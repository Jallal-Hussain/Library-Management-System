import { Router } from "express";
import { body, param, query } from "express-validator";
import {
  getReservations,
  getReservationById,
  createReservation,
  cancelReservation,
  updateStatus,
} from "../controllers/reservation.controller.js";
import { protect, authorize } from "../middleware/auth.js";
import validate from "../middleware/validate.js";

const router = Router();

const idParam = param("id").isMongoId().withMessage("Invalid reservation ID");

const listQueryRules = [
  query("page").optional().isInt({ min: 1 }),
  query("limit").optional().isInt({ min: 1, max: 100 }),
  query("sort").optional().isIn(["newest", "oldest"]),
  query("status").optional().isIn(["pending", "ready", "cancelled", "fulfilled", "expired"]),
  query("userId").optional().isMongoId(),
  query("bookId").optional().isMongoId(),
];

const createRules = [
  body("bookId").isMongoId().withMessage("Valid Book ID is required"),
  body("userId").optional().isMongoId().withMessage("Valid User ID is required"),
];

const statusRules = [
  body("status").isIn(["pending", "ready", "cancelled", "fulfilled", "expired"]).withMessage("Invalid status"),
];

router.use(protect);

router.get("/", listQueryRules, validate, getReservations);
router.get("/:id", idParam, validate, getReservationById);

router.post("/", createRules, validate, createReservation);
router.put("/:id/cancel", idParam, validate, cancelReservation);
router.put("/:id/status", authorize("admin", "librarian"), [idParam, ...statusRules], validate, updateStatus);

export default router;
