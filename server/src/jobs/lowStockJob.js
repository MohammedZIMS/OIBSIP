import cron from 'node-cron';
import { logger } from '../config/logger.js';
import * as alertService from '../services/alertService.js';

export async function runLowStockCheck({ cooldownHours }) {
  await alertService.reconcileAll();
  const due = await alertService.findDueForNotification(cooldownHours);
  logger.info({ due: due.length }, 'low-stock check complete');
  // Phase 6: send ONE consolidated email for `due` with emailService, then:
  //   await alertService.markNotified(ids)   (or markNotifyFailed on error)
  return due;
}

export function scheduleLowStockJob({ schedule, cooldownHours }) {
  return cron.schedule(
    schedule,
    () => runLowStockCheck({ cooldownHours }).catch((err) => logger.error({ err }, 'low-stock job failed')),
    { timezone: 'Asia/Kolkata' },
  );
}
