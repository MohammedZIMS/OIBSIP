import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import hpp from 'hpp';
import mongoSanitize from 'express-mongo-sanitize';
import pinoHttp from 'pino-http';
import mongoose from 'mongoose';
import { env } from './config/env.js';
import { logger } from './config/logger.js';
import { isDbReady } from './config/db.js';
import { requestId } from './middleware/requestId.js';
import { apiLimiter } from './middleware/rateLimit.js';
import { notFound } from './middleware/notFound.js';
import { errorHandler } from './middleware/errorHandler.js';
import routes from './routes/index.js';

const app = express();
app.set('trust proxy', 1);

app.use(requestId);
app.use(pinoHttp({ logger, genReqId: (req) => req.id, autoLogging: { ignore: (req) => req.url === '/healthz' } }));
app.use(helmet());
app.use(cors({ origin: env.CLIENT_URL }));

// Razorpay webhook (Phase 4) must be mounted HERE with express.raw(), before express.json().

app.use(express.json({ limit: '100kb' }));
app.use(mongoSanitize()); // strips $ and . operators from input (NoSQL injection)
app.use(hpp());

app.get('/healthz', (_req, res) => res.json({ status: 'ok' }));
app.get('/readyz', async (_req, res) => {
  try {
    if (!isDbReady()) throw new Error('db not connected');
    await mongoose.connection.db.admin().ping();
    res.json({ status: 'ready' });
  } catch {
    res.status(503).json({ status: 'unavailable' });
  }
});

app.use('/api', apiLimiter, routes);

app.use(notFound);
app.use(errorHandler);

export default app;
