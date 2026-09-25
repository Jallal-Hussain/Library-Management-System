import { Router } from "express";
import { param, query } from "express-validator";
import {
  getNotifications,
  markAsRead,
  markAllAsRead,
  deleteNotification,
} from "../controllers/notification.controller.js";
import { protect } from "../middleware/auth.js";
import validate from "../middleware/validate.js";

const router = Router();

const idParam = param("id").isMongoId().withMessage("Invalid ID");

router.use(protect);

router.get("/", [query("isRead").optional().isBoolean()], validate, getNotifications);
router.put("/read-all", markAllAsRead);
router.put("/:id/read", idParam, validate, markAsRead);
router.delete("/:id", idParam, validate, deleteNotification);

export default router;
