/**
 * overdueCheck.job.js
 *
 * Schedule: Daily at midnight — "0 0 * * *"
 *
 * 1. Find all "active" transactions past their dueDate → mark them "overdue".
 * 2. For already-"overdue" transactions, accumulate a daily fine increment
 *    (if the active FeeStructure has rateType === "per_day" and Settings key
 *    `incremental_daily_fines` is truthy).
 * 3. Dispatch "Overdue Notice" notifications for every affected user
 *    (one notification per transaction, deduped by transactionId so re-runs
 *     on the same day don't double-notify).
 */

import cron        from "node-cron";
import Transaction from "../models/Transaction.js";
import Fine        from "../models/Fine.js";
import FeeStructure from "../models/FeeStructure.js";
import User        from "../models/User.js";
import Notification from "../models/Notification.js";
import { getSetting } from "../utils/settingsHelper.js";

// ── Helpers ───────────────────────────────────────────────────────────────────

/**
 * Get the daily fine rate from an active FeeStructure, or fall back to
 * the Settings value `fine_rate_per_day` (default $0.50).
 */
async function getDailyFineRate() {
  const feeStruct = await FeeStructure.findOne({
    type: "overdue",
    rateType: "per_day",
    isActive: true,
  })
    .sort({ createdAt: -1 })
    .lean();

  if (feeStruct) {
    return { rate: feeStruct.rate, maxAmount: feeStruct.maxAmount ?? null };
  }

  const rate = parseFloat(await getSetting("fine_rate_per_day", 0.5));
  return { rate: Number.isFinite(rate) ? rate : 0.5, maxAmount: null };
}

// ── Job logic ─────────────────────────────────────────────────────────────────

async function runOverdueCheck() {
  const now  = new Date();
  const label = "[OverdueCheck]";
  console.log(`${label} Starting — ${now.toISOString()}`);

  try {
    // ── Step 1: Mark active-but-past-due transactions as "overdue" ─────────
    const justOverdue = await Transaction.find({
      status:  "active",
      dueDate: { $lt: now },
    }).lean();

    if (justOverdue.length > 0) {
      const ids = justOverdue.map((t) => t._id);
      await Transaction.updateMany({ _id: { $in: ids } }, { status: "overdue" });
      console.log(`${label} Marked ${justOverdue.length} transaction(s) as overdue.`);
    }

    // ── Step 2: Daily incremental fines for already-overdue transactions ───
    const incrementalEnabled = await getSetting("incremental_daily_fines", false);

    if (incrementalEnabled) {
      const alreadyOverdue = await Transaction.find({
        status:  "overdue",
        dueDate: { $lt: now },
      }).lean();

      if (alreadyOverdue.length > 0) {
        const { rate, maxAmount } = await getDailyFineRate();

        for (const tx of alreadyOverdue) {
          // Check if we already created a fine for this transaction today
          const todayStart = new Date(now);
          todayStart.setHours(0, 0, 0, 0);

          const existingToday = await Fine.findOne({
            transactionId: tx._id,
            dateIssued:    { $gte: todayStart },
          }).lean();

          if (existingToday) continue; // already fined today

          // Calculate total fines already on this transaction to respect maxAmount
          if (maxAmount !== null) {
            const totalFined = await Fine.aggregate([
              { $match: { transactionId: tx._id, reason: "overdue" } },
              { $group: { _id: null, total: { $sum: "$amount" } } },
            ]);
            const alreadyCharged = totalFined[0]?.total ?? 0;
            if (alreadyCharged >= maxAmount) continue; // cap reached
          }

          const fineAmount = Math.round(rate * 100) / 100;
          if (fineAmount <= 0) continue;

          const fine = await Fine.create({
            userId:        tx.userId,
            transactionId: tx._id,
            amount:        fineAmount,
            reason:        "overdue",
            reasonNote:    `Daily incremental fine — ${now.toDateString()}`,
          });

          await User.findByIdAndUpdate(tx.userId, { $inc: { finesOwed: fineAmount } });

          console.log(
            `${label} Incremental fine $${fineAmount} applied — tx:${tx._id}, user:${tx.userId}`
          );
        }
      }
    }

    // ── Step 3: Send overdue notifications ─────────────────────────────────
    // Combine freshly-overdue + already-overdue lists for notification sweep
    const allOverdueNow = await Transaction.find({
      status:  "overdue",
      dueDate: { $lt: now },
    })
      .populate("bookId", "title")
      .lean();

    for (const tx of allOverdueNow) {
      // Don't spam — only send one notification per transaction per day
      const todayStart = new Date(now);
      todayStart.setHours(0, 0, 0, 0);

      const alreadyNotified = await Notification.findOne({
        userId:    tx.userId,
        relatedId: tx._id,
        type:      "overdue",
        createdAt: { $gte: todayStart },
      }).lean();

      if (alreadyNotified) continue;

      const daysOverdue = Math.ceil((now - new Date(tx.dueDate)) / (1000 * 60 * 60 * 24));
      const bookTitle   = tx.bookId?.title ?? "a book";

      await Notification.create({
        userId:       tx.userId,
        title:        "Overdue Book Notice",
        message:      `"${bookTitle}" was due on ${new Date(tx.dueDate).toDateString()} and is now ${daysOverdue} day(s) overdue. Please return it as soon as possible to avoid further fines.`,
        type:         "overdue",
        relatedId:    tx._id,
        relatedModel: "Transaction",
      });
    }

    console.log(
      `${label} Done — ${allOverdueNow.length} overdue transaction(s) processed.`
    );
  } catch (err) {
    console.error(`${label} Error:`, err);
  }
}

// ── Export: register + return the cron task ───────────────────────────────────
export function registerOverdueCheckJob() {
  // Run daily at midnight
  const task = cron.schedule("0 0 * * *", runOverdueCheck, {
    timezone: "UTC",
    name:     "overdueCheck",
  });
  console.log("📅 [OverdueCheck] Cron registered — daily at 00:00 UTC");
  return task;
}

// Allow manual trigger in tests / seeds
export { runOverdueCheck };
