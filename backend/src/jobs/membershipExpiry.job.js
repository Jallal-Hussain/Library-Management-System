/**
 * membershipExpiry.job.js
 *
 * Schedule: Daily at 01:00 UTC — "0 1 * * *"
 *
 * 1. Find users whose membershipExpiry date is within the next 7 days →
 *    dispatch a "Membership Expiring Soon" notification (once per day, idempotent).
 * 2. Find users whose membershipExpiry has already passed →
 *    set isActive = false and dispatch a "Membership Expired" notification.
 */

import cron from "node-cron";
import User  from "../models/User.js";
import Notification from "../models/Notification.js";

// ── Job logic ─────────────────────────────────────────────────────────────────

async function runMembershipExpiry() {
  const now   = new Date();
  const label = "[MembershipExpiry]";
  console.log(`${label} Starting — ${now.toISOString()}`);

  const todayStart = new Date(now);
  todayStart.setHours(0, 0, 0, 0);

  try {
    // ── 1. Expiring-soon warning (within 7 days) ───────────────────────────
    const in7Days = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000);

    const expiringSoon = await User.find({
      isActive:         true,
      membershipExpiry: { $gte: now, $lte: in7Days },
    }).lean();

    console.log(`${label} ${expiringSoon.length} membership(s) expiring within 7 days.`);

    for (const user of expiringSoon) {
      // Idempotency guard — one reminder per day per user
      const alreadySent = await Notification.findOne({
        userId:    user._id,
        type:      "membership_expiry",
        createdAt: { $gte: todayStart },
      }).lean();

      if (alreadySent) continue;

      const expiryDate = new Date(user.membershipExpiry);
      const daysLeft   = Math.ceil((expiryDate - now) / (1000 * 60 * 60 * 24));

      await Notification.create({
        userId:       user._id,
        title:        "Membership Expiring Soon",
        message:      `Your library membership (ID: ${user.membershipId ?? "N/A"}) will expire on ${expiryDate.toDateString()} — in ${daysLeft} day(s). Please contact the library to renew your membership.`,
        type:         "membership_expiry",
        relatedId:    user._id,
        relatedModel: "User",
      });
    }

    // ── 2. Deactivate expired memberships ─────────────────────────────────
    const expired = await User.find({
      isActive:         true,
      approvalStatus:   "approved",
      membershipExpiry: { $lt: now },
    }).lean();

    console.log(`${label} ${expired.length} membership(s) to deactivate.`);

    for (const user of expired) {
      await User.findByIdAndUpdate(user._id, { isActive: false });

      // Only notify once — check if we notified today
      const alreadyNotified = await Notification.findOne({
        userId:    user._id,
        type:      "membership_expiry",
        createdAt: { $gte: todayStart },
      }).lean();

      if (alreadyNotified) continue;

      await Notification.create({
        userId:       user._id,
        title:        "Membership Expired",
        message:      `Your library membership (ID: ${user.membershipId ?? "N/A"}) expired on ${new Date(user.membershipExpiry).toDateString()}. Your account has been deactivated. Please visit the library to renew your membership.`,
        type:         "membership_expiry",
        relatedId:    user._id,
        relatedModel: "User",
      });
    }

    console.log(`${label} Done.`);
  } catch (err) {
    console.error(`${label} Error:`, err);
  }
}

// ── Export: register + return the cron task ───────────────────────────────────
export function registerMembershipExpiryJob() {
  const task = cron.schedule("0 1 * * *", runMembershipExpiry, {
    timezone: "UTC",
    name:     "membershipExpiry",
  });
  console.log("📅 [MembershipExpiry] Cron registered — daily at 01:00 UTC");
  return task;
}

export { runMembershipExpiry };
