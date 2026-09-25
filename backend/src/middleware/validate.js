import { validationResult } from "express-validator";

/**
 * validate — runs after express-validator check() chains.
 * If any validation errors exist, responds with 400 and a structured error list.
 * Usage: router.post("/route", [check("email").isEmail(), validate], handler)
 */
const validate = (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({
      success: false,
      message: "Validation failed",
      errors: errors.array().map((e) => ({
        field: e.path,
        message: e.msg,
      })),
    });
  }
  next();
};

export default validate;
