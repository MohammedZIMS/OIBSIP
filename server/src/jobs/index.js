import { env } from '../config/env.js';
import { logger } from '../config/logger.js';
import { scheduleLowStockJob } from './lowStockJob.js';

// Run with RUN_CRON=true on exactly one instance.
export function startJobs() {
  if (!env.RUN_CRON) return [];
  logger.info({ schedule: env.LOW_STOCK_CRON }, 'starting scheduled jobs');
  return [scheduleLowStockJob({ schedule: env.LOW_STOCK_CRON, cooldownHours: env.LOW_STOCK_COOLDOWN_HOURS })];
}
