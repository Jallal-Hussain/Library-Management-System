/**
 * settingsHelper.js
 *
 * In-memory cached wrapper around the Settings collection.
 * Prevents hot endpoints (e.g. borrowBook / returnBook) from hitting
 * the database on every request.
 *
 * TTL: 5 minutes.  Cache is invalidated automatically when the
 *      settings.controller updates a value (call invalidateCache()).
 */

import Settings from "../models/Settings.js";

// ── Cache state ───────────────────────────────────────────────────────────────
let cache = null;        // Map<key, value> | null
let cacheExpiresAt = 0; // Unix ms timestamp

const TTL_MS = 5 * 60 * 1000; // 5 minutes

// ── Internal loader ───────────────────────────────────────────────────────────
async function loadCache() {
  const docs = await Settings.find({}).lean();
  cache = new Map(docs.map((d) => [d.key, d.value]));
  cacheExpiresAt = Date.now() + TTL_MS;
}

// ── Public API ────────────────────────────────────────────────────────────────

/**
 * Retrieve a setting value by key.
 * Returns `defaultValue` when the key is not found in the database.
 *
 * @param {string} key            - Settings document `key` field (lowercase).
 * @param {*}      defaultValue   - Fallback when key is absent.
 * @returns {Promise<*>}
 */
export async function getSetting(key, defaultValue = null) {
  if (!cache || Date.now() > cacheExpiresAt) {
    await loadCache();
  }
  return cache.has(key) ? cache.get(key) : defaultValue;
}

/**
 * Manually invalidate the in-memory cache.
 * Call this after any Settings write so the next getSetting() fetches fresh data.
 */
export function invalidateCache() {
  cache = null;
  cacheExpiresAt = 0;
}

/**
 * Convenience: retrieve the loan period (in days) for a given user role.
 * Reads keys: loan_period_patron | loan_period_librarian | loan_period_admin
 *
 * @param {"patron"|"librarian"|"admin"} role
 * @returns {Promise<number>} days
 */
export async function getLoanPeriodDays(role) {
  const defaults = { patron: 14, librarian: 21, admin: 30 };
  const key = `loan_period_${role}`;
  const raw = await getSetting(key, defaults[role] ?? 14);
  const parsed = parseInt(raw, 10);
  return Number.isFinite(parsed) && parsed > 0 ? parsed : (defaults[role] ?? 14);
}

/**
 * Convenience: retrieve the max allowed renewals per transaction.
 * Reads key: max_renewals (default 2).
 *
 * @returns {Promise<number>}
 */
export async function getMaxRenewals() {
  const raw = await getSetting("max_renewals", 2);
  const parsed = parseInt(raw, 10);
  return Number.isFinite(parsed) && parsed >= 0 ? parsed : 2;
}

/**
 * Convenience: retrieve the fine-block threshold (total finesOwed that
 * prevents further borrowing).
 * Reads key: fine_block_threshold (default 500).
 *
 * @returns {Promise<number>}
 */
export async function getFineBlockThreshold() {
  const raw = await getSetting("fine_block_threshold", 500);
  const parsed = parseFloat(raw);
  return Number.isFinite(parsed) && parsed >= 0 ? parsed : 500;
}

/**
 * Convenience: retrieve the number of days a "ready" hold is kept before it
 * expires.
 * Reads key: reservation_hold_days (default 3).
 *
 * @returns {Promise<number>}
 */
export async function getReservationHoldDays() {
  const raw = await getSetting("reservation_hold_days", 3);
  const parsed = parseInt(raw, 10);
  return Number.isFinite(parsed) && parsed > 0 ? parsed : 3;
}
