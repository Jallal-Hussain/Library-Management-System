/**
 * reservationExpiry.job.js
 *
 * Schedule: Hourly — "0 * * * *"
 *
 * For each "ready" reservation whose expiryDate has passed:
 *  1. Mark it as "expired".
 *  2. Notify the patron their hold expired.
 *  3. Check if a next patron is in the queue (queuePosition = 2, which becomes
 *     position 1 after the expired hold is gone).  If yes → promote to "ready",
 *     set a new expiryDate, notify them.
 *  4. If no remaining reservations → release the book to "available".
 */

import cron        from "node-cron";
import Reservation from "../models/Reservation.js";
import Book        from "../models/Book.js";
import Notification from "../models/Notification.js";
import { getReservationHoldDays } from "../utils/settingsHelper.js";

// ── Job logic ─────────────────────────────────────────────────────────────────

async function runReservationExpiry() {
  const now   = new Date();
  const label = "[ReservationExpiry]";
  console.log(`${label} Starting — ${now.toISOString()}`);

  try {
    // Find all "ready" reservations whose hold window has elapsed
    const expired = await Reservation.find({
      status:     "ready",
      expiryDate: { $lt: now },
    })
      .populate("bookId", "title status availableCopies")
      .lean();

    console.log(`${label} Found ${expired.length} expired hold(s).`);

    for (const res of expired) {
      const bookId = res.bookId?._id ?? res.bookId;

      // ── 1. Mark reservation as expired ─────────────────────────────────────
      await Reservation.findByIdAndUpdate(res._id, { status: "expired" });

      // ── 2. Notify patron ────────────────────────────────────────────────────
      const bookTitle = res.bookId?.title ?? "your reserved book";
      await Notification.create({
        userId:       res.userId,
        title:        "Reservation Hold Expired",
        message:      `Your hold on "${bookTitle}" has expired because it was not collected before the deadline. You may place a new reservation if you still need this book.`,
        type:         "general",
        relatedId:    res._id,
        relatedModel: "Reservation",
      });

      // ── 3. Re-order queue: decrement all positions behind the expired slot ─
      await Reservation.updateMany(
        {
          bookId,
          status:        { $in: ["pending", "ready"] },
          queuePosition: { $gt: res.queuePosition },
        },
        { $inc: { queuePosition: -1 } }
      );

      // ── 4. Check for next patron in queue ───────────────────────────────────
      const nextInQueue = await Reservation.findOne({
        bookId,
        status: "pending",
      }).sort({ queuePosition: 1 });

      if (nextInQueue) {
        // Promote next patron's hold
        const holdDays   = await getReservationHoldDays();
        const expiryDate = new Date();
        expiryDate.setDate(expiryDate.getDate() + holdDays);

        nextInQueue.status           = "ready";
        nextInQueue.expiryDate       = expiryDate;
        nextInQueue.notificationSent = true;
        await nextInQueue.save();

        await Notification.create({
          userId:       nextInQueue.userId,
          title:        "Reserved Book Ready for Pickup",
          message:      `"${bookTitle}" is now ready for pickup. Please collect it by ${expiryDate.toDateString()} before your hold expires.`,
          type:         "reservation_ready",
          relatedId:    nextInQueue._id,
          relatedModel: "Reservation",
        });

        console.log(
          `${label} Hold promoted — book:${bookId}, next patron:${nextInQueue.userId}`
        );
      } else {
        // No more waiters — release the book back to available
        const book = await Book.findById(bookId);
        if (book) {
          book.availableCopies = Math.max(0, book.availableCopies) + 1;
          book.status          = "available";
          await book.save();
          console.log(`${label} Book released to available — book:${bookId}`);
        }
      }
    }

    console.log(`${label} Done.`);
  } catch (err) {
    console.error(`${label} Error:`, err);
  }
}

// ── Export: register + return the cron task ───────────────────────────────────
export function registerReservationExpiryJob() {
  const task = cron.schedule("0 * * * *", runReservationExpiry, {
    timezone: "UTC",
    name:     "reservationExpiry",
  });
  console.log("📅 [ReservationExpiry] Cron registered — hourly at :00 UTC");
  return task;
}

export { runReservationExpiry };
