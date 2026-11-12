import express from 'express';
import cors from 'cors';
import helmet from 'helmet';

const app = express();

app.use(helmet());
app.use(cors({ origin: process.env.CLIENT_URL || 'http://localhost:5173' }));
// NOTE: the Razorpay webhook route must be mounted here, BEFORE express.json() (raw body).
app.use(express.json({ limit: '100kb' }));

app.get('/healthz', (_req, res) => res.json({ status: 'ok' }));

export default app;
