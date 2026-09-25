/**
 * Wraps a standard JSON API response.
 *
 * Success: { success: true, message?, data?, meta? }
 * Error:   handled by errorHandler middleware
 */

/**
 * Send a successful response.
 * @param {import('express').Response} res
 * @param {number} statusCode
 * @param {string} message
 * @param {*} data
 * @param {object} [meta]
 */
export const sendSuccess = (res, statusCode = 200, message = "Success", data = null, meta = null) => {
  const body = { success: true, message };
  if (data !== null) body.data = data;
  if (meta !== null) body.meta = meta;
  return res.status(statusCode).json(body);
};

/**
 * Create an AppError to pass to next() in controllers.
 * @param {string} message
 * @param {number} statusCode
 */
export const createError = (message, statusCode = 500) => {
  const err = new Error(message);
  err.statusCode = statusCode;
  return err;
};
