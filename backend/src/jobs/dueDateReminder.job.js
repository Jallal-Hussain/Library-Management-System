/**
 * dueDateReminder.job.js  (Plan §3.2 worker #3)
 *
 * Schedule: Daily at 08:00 UTC — "0 8 * * *"
 *
 * Finds all "active" transactions whose dueDate falls within the next 48 hours
 * and dispatches a "Upcoming Due Date Reminder" notification to each patron —
 * one notification per transaction per day (idempotent).
 */

import cron        from "node-cron";
import Transaction from "../models/Transaction.js";
import Notification from "../models/Notification.js";

// ── Job logic ─────────────────────────────────────────────────────────────────

async function runDueDateReminder() {
  const now   = new Date();
  const label = "[DueDateReminder]";
  console.log(`${label} Starting — ${now.toISOString()}`);

  try {
    const in48h = new Date(now.getTime() + 48 * 60 * 60 * 1000);

    // Active transactions due within the next 48 hours
    const upcoming = await Transaction.find({
      status:  "active",
      dueDate: { $gte: now, $lte: in48h },
    })
      .populate("bookId", "title")
      .lean();

    console.log(`${label} ${upcoming.length} transaction(s) due within 48 hours.`);

    const todayStart = new Date(now);
    todayStart.setHours(0, 0, 0, 0);

    for (const tx of upcoming) {
      // Idempotency: skip if we already sent this notification today
      const alreadySent = await Notification.findOne({
        userId:    tx.userId,
        relatedId: tx._id,
        type:      "due_soon",
        createdAt: { $gte: todayStart },
      }).lean();

      if (alreadySent) continue;

      const dueDate   = new Date(tx.dueDate);
      const bookTitle = tx.bookId?.title ?? "a book";
      const hoursLeft = Math.round((dueDate - now) / (1000 * 60 * 60));

      await Notification.create({
        userId:       tx.userId,
        title:        "Book Due Soon",
        message:      `Reminder: "${bookTitle}" is due in approximately ${hoursLeft} hour(s) on ${dueDate.toDateString()}. Please return or renew it on time to avoid late fines.`,
        type:         "due_soon",
        relatedId:    tx._id,
        relatedModel: "Transaction",
      });
    }

    console.log(`${label} Done — reminders dispatched.`);
  } catch (err) {
    console.error(`${label} Error:`, err);
  }
}

// ── Export: register + return the cron task ───────────────────────────────────
export function registerDueDateReminderJob() {
  const task = cron.schedule("0 8 * * *", runDueDateReminder, {
    timezone: "UTC",
    name:     "dueDateReminder",
  });
  console.log("📅 [DueDateReminder] Cron registered — daily at 08:00 UTC");
  return task;
}

export { runDueDateReminder };
