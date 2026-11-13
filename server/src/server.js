import { env } from './config/env.js';
import { logger } from './config/logger.js';
import { connectDB, disconnectDB } from './config/db.js';
import { startJobs } from './jobs/index.js';
import app from './app.js';

async function main() {
  await connectDB(env.MONGO_URI);
  const jobs = startJobs();
  const server = app.listen(env.PORT, () => logger.info(`API listening on :${env.PORT}`));

  const shutdown = async (signal) => {
    logger.info({ signal }, 'shutting down');
    jobs.forEach((j) => j.stop());
    server.close(async () => {
      await disconnectDB();
      process.exit(0);
    });
    setTimeout(() => process.exit(1), 10_000).unref();
  };
  process.on('SIGTERM', () => shutdown('SIGTERM'));
  process.on('SIGINT', () => shutdown('SIGINT'));
}

process.on('unhandledRejection', (err) => { logger.fatal({ err }, 'unhandled rejection'); process.exit(1); });
process.on('uncaughtException', (err) => { logger.fatal({ err }, 'uncaught exception'); process.exit(1); });

main().catch((err) => { logger.fatal(err.message); process.exit(1); });
