/**
 * Global async error handler middleware.
 * Catches errors thrown (or passed via next(err)) from any route handler.
 */
const errorHandler = (err, req, res, next) => {
  if (process.env.NODE_ENV === "development") {
    console.error("❌ Error:", err);
  }

  let statusCode = err.statusCode || 500;
  let message = err.message || "Internal Server Error";

  // Mongoose: duplicate key
  if (err.code === 11000) {
    const field = Object.keys(err.keyValue)[0];
    message = `A record with this ${field} already exists.`;
    statusCode = 409;
  }

  // Mongoose: invalid ObjectId
  if (err.name === "CastError") {
    message = `Invalid ${err.path}: ${err.value}`;
    statusCode = 400;
  }

  // Mongoose: schema validation
  if (err.name === "ValidationError") {
    message = Object.values(err.errors)
      .map((e) => e.message)
      .join(", ");
    statusCode = 400;
  }

  // JWT errors
  if (err.name === "JsonWebTokenError") {
    message = "Invalid token. Please log in again.";
    statusCode = 401;
  }
  if (err.name === "TokenExpiredError") {
    message = "Your session has expired. Please log in again.";
    statusCode = 401;
  }

  res.status(statusCode).json({
    success: false,
    message,
    ...(process.env.NODE_ENV === "development" && { stack: err.stack }),
  });
};

export default errorHandler;
