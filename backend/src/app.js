import express from "express";
import cors from "cors";
import helmet from "helmet";
import morgan from "morgan";
import errorHandler from "./middleware/errorHandler.js";

// ── Route Imports ─────────────────────────────────────────────────────────────
import healthRoutes from "./routes/health.routes.js";
import authRoutes   from "./routes/auth.routes.js";
import bookRoutes   from "./routes/book.routes.js";
import userRoutes   from "./routes/user.routes.js";
// Future phases will uncomment these:
import transactionRoutes from "./routes/transaction.routes.js";
import reservationRoutes from "./routes/reservation.routes.js";
import fineRoutes       from "./routes/fine.routes.js";
import paymentRoutes    from "./routes/payment.routes.js";
import acquisitionRoutes from "./routes/acquisition.routes.js";
import vendorRoutes     from "./routes/vendor.routes.js";
import invoiceRoutes    from "./routes/invoice.routes.js";
import reportRoutes     from "./routes/report.routes.js";
import notificationRoutes from "./routes/notification.routes.js";
import settingsRoutes   from "./routes/settings.routes.js";
import branchRoutes     from "./routes/branch.routes.js";
import illRoutes        from "./routes/ill.routes.js";

const app = express();

// ── Security Middleware ───────────────────────────────────────────────────────
app.use(helmet());

// ── CORS ──────────────────────────────────────────────────────────────────────
const allowedOrigins = [
  process.env.CLIENT_URL || "http://localhost:3000",
  "http://localhost:3001",
];

app.use(
  cors({
    origin: (origin, callback) => {
      if (!origin || allowedOrigins.includes(origin)) {
        callback(null, true);
      } else {
        callback(new Error(`CORS policy: origin "${origin}" is not allowed.`));
      }
    },
    credentials: true,
    methods: ["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],
    allowedHeaders: ["Content-Type", "Authorization"],
  })
);

// ── Body Parsers ──────────────────────────────────────────────────────────────
app.use(express.json({ limit: "10mb" }));
app.use(express.urlencoded({ extended: true }));

// ── HTTP Request Logger ───────────────────────────────────────────────────────
if (process.env.NODE_ENV !== "test") {
  app.use(morgan("dev"));
}

// ── API Routes ────────────────────────────────────────────────────────────────
app.use("/api/health", healthRoutes);
app.use("/api/auth",   authRoutes);
app.use("/api/books",  bookRoutes);
app.use("/api/users",  userRoutes);
app.use("/api/transactions", transactionRoutes);
app.use("/api/reservations", reservationRoutes);
app.use("/api/fines",        fineRoutes);
app.use("/api/payments",     paymentRoutes);
app.use("/api/acquisitions", acquisitionRoutes);
app.use("/api/vendors",      vendorRoutes);
app.use("/api/invoices",     invoiceRoutes);
app.use("/api/reports",      reportRoutes);
app.use("/api/notifications", notificationRoutes);
app.use("/api/settings",     settingsRoutes);
app.use("/api/branches",     branchRoutes);
app.use("/api/ill",          illRoutes);

// ── 404 Handler ───────────────────────────────────────────────────────────────
app.use((req, res) => {
  res.status(404).json({
    success: false,
    message: `Route not found: ${req.method} ${req.originalUrl}`,
  });
});

// ── Global Error Handler (must be last) ──────────────────────────────────────
app.use(errorHandler);

export default app;
