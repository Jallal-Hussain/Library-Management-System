import { Router } from "express";
import { getDashboardStats } from "../controllers/report.controller.js";
import { protect, authorize } from "../middleware/auth.js";

const router = Router();

router.use(protect, authorize("admin", "librarian"));

router.get("/dashboard-stats", getDashboardStats);

export default router;
