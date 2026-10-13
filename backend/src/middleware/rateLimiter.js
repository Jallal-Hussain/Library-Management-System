import rateLimit from "express-rate-limit";

/**
 * General API Rate Limiter
 * Maximum 300 requests per 15 minutes per IP across standard API endpoints.
 */
export const apiLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 300,
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    success: false,
    message: "Too many requests from this IP, please try again after 15 minutes.",
  },
});

/**
 * Authentication Rate Limiter
 * Maximum 10 requests per 15 minutes per IP on auth endpoints (login, register, forgot-password)
 * to protect against credential stuffing and brute-force attacks.
 */
export const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 10,
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    success: false,
    message: "Too many authentication attempts. Please try again after 15 minutes.",
  },
});
