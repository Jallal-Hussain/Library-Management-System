import "dotenv/config"; // must be first — loads .env before anything else

import app from "./src/app.js";
import connectDB from "./src/config/db.js";

const PORT = process.env.PORT || 5000;

/**
 * Bootstrap function — connect to DB then start the HTTP server.
 * Keeps startup sequential so the server only listens after DB is ready.
 */
const start = async () => {
  await connectDB();

  const server = app.listen(PORT, () => {
    console.log(`🚀 Server running in ${process.env.NODE_ENV} mode on port ${PORT}`);
    console.log(`📡 API base URL: http://localhost:${PORT}/api`);
    console.log(`❤️  Health check: http://localhost:${PORT}/api/health`);
  });

  // ── Graceful Shutdown ────────────────────────────────────────────────────────
  const shutdown = (signal) => {
    console.log(`\n⚠️  ${signal} received — shutting down gracefully...`);
    server.close(() => {
      console.log("🔌 HTTP server closed.");
      process.exit(0);
    });

    // Force-exit if server hasn't closed in 10 seconds
    setTimeout(() => {
      console.error("❌ Forced shutdown after timeout.");
      process.exit(1);
    }, 10_000);
  };

  process.on("SIGTERM", () => shutdown("SIGTERM"));
  process.on("SIGINT", () => shutdown("SIGINT"));

  // ── Unhandled Rejections ─────────────────────────────────────────────────────
  process.on("unhandledRejection", (reason) => {
    console.error("❌ Unhandled Promise Rejection:", reason);
    server.close(() => process.exit(1));
  });
};

start();
