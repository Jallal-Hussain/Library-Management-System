import { Router } from "express";
import mongoose from "mongoose";

const router = Router();

/**
 * GET /api/health
 * Public endpoint — confirms the server is alive and the DB is connected.
 */
router.get("/", (req, res) => {
  const dbState = mongoose.connection.readyState;
  // 0=disconnected, 1=connected, 2=connecting, 3=disconnecting
  const dbStatus =
    dbState === 1 ? "connected" : dbState === 2 ? "connecting" : "disconnected";

  res.status(dbState === 1 ? 200 : 503).json({
    success: dbState === 1,
    status: dbState === 1 ? "ok" : "degraded",
    timestamp: new Date().toISOString(),
    environment: process.env.NODE_ENV,
    db: dbStatus,
  });
});

export default router;
