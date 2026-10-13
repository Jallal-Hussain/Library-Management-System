import { Router } from "express";
import {
  getDashboardStats,
  getCirculationTrends,
  getPopularBooks,
  getOverdueAging,
  getFinancialSummary,
  getCategoryDistribution,
  exportCsv,
} from "../controllers/report.controller.js";
import { protect, authorize } from "../middleware/auth.js";

const router = Router();

// All reporting endpoints require authentication
router.use(protect);

// ── Admin & Librarian Reports ────────────────────────────────────────────────
router.get("/dashboard-stats", authorize("admin", "librarian"), getDashboardStats);
router.get("/circulation-trends", authorize("admin", "librarian"), getCirculationTrends);
router.get("/popular-books", authorize("admin", "librarian"), getPopularBooks);
router.get("/overdue-aging", authorize("admin", "librarian"), getOverdueAging);
router.get("/category-distribution", authorize("admin", "librarian"), getCategoryDistribution);
router.get("/export/:type", authorize("admin", "librarian"), exportCsv);

// ── Admin-Only Reports ───────────────────────────────────────────────────────
router.get("/financial-summary", authorize("admin"), getFinancialSummary);

export default router;
