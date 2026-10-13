/**
 * jobs/index.js — Cron Job Registry
 *
 * Import and initialise all background workers in one place.
 * Called from server.js AFTER the database connection is confirmed.
 *
 * Each register* function schedules its cron task, logs its registration
 * message, and returns the cron.ScheduledTask instance (so it can be
 * stopped during graceful shutdown).
 */

import { registerOverdueCheckJob }      from "./overdueCheck.job.js";
import { registerReservationExpiryJob } from "./reservationExpiry.job.js";
import { registerDueDateReminderJob }   from "./dueDateReminder.job.js";
import { registerMembershipExpiryJob }  from "./membershipExpiry.job.js";

/**
 * Register all cron jobs and return an array of ScheduledTask instances.
 * Pass the returned array to stopAllJobs() for a clean shutdown.
 *
 * @returns {import("node-cron").ScheduledTask[]}
 */
export function startAllJobs() {
  console.log("\n⚙️  Initialising background cron jobs...");

  const tasks = [
    registerOverdueCheckJob(),       // daily   @ 00:00 UTC
    registerReservationExpiryJob(),  // hourly  @ :00 UTC
    registerDueDateReminderJob(),    // daily   @ 08:00 UTC
    registerMembershipExpiryJob(),   // daily   @ 01:00 UTC
  ];

  console.log(`✅  ${tasks.length} cron job(s) running.\n`);
  return tasks;
}

/**
 * Stop all registered cron tasks.
 * Intended for use in graceful-shutdown handlers.
 *
 * @param {import("node-cron").ScheduledTask[]} tasks
 */
export function stopAllJobs(tasks = []) {
  tasks.forEach((task) => {
    try {
      task.stop();
    } catch (e) {
      // Swallow — task may already be stopped
    }
  });
  console.log("🛑  All cron jobs stopped.");
}
