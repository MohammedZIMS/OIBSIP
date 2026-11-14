import 'dotenv/config';
import { z } from 'zod';

const schema = z.object({
  NODE_ENV: z.enum(['development', 'test', 'production']).default('development'),
  PORT: z.coerce.number().int().default(5000),
  CLIENT_URL: z.string().url().default('http://localhost:5173'),
  LOG_LEVEL: z.string().default('info'),

  // Accepts MONGO_URI (preferred) or MONGODB_URI. Never commit real values.
  MONGO_URI: z.string().regex(/^mongodb(\+srv)?:\/\//, 'must start with mongodb:// or mongodb+srv://'),

  JWT_SECRET: z.string().min(32),
  JWT_ADMIN_SECRET: z.string().min(32),
  JWT_EXPIRES_IN: z.string().default('1h'),
  JWT_REMEMBER_EXPIRES_IN: z.string().default('7d'),
  JWT_ADMIN_EXPIRES_IN: z.string().default('30m'),

  // Email. Leave SMTP_HOST empty in development to print emails to the console instead.
  SMTP_HOST: z.string().optional().transform((v) => v || undefined),
  SMTP_PORT: z.coerce.number().int().default(587),
  SMTP_SECURE: z.enum(['true', 'false']).default('false').transform((v) => v === 'true'),
  SMTP_USER: z.string().optional().transform((v) => v || undefined),
  SMTP_PASS: z.string().optional().transform((v) => v || undefined),
  MAIL_FROM: z.string().default('Forno & Farina <no-reply@example.com>'),

  RUN_CRON: z.enum(['true', 'false']).default('false').transform((v) => v === 'true'),
  LOW_STOCK_CRON: z.string().default('*/15 * * * *'),
  LOW_STOCK_COOLDOWN_HOURS: z.coerce.number().positive().default(24),
});

const raw = { ...process.env, MONGO_URI: process.env.MONGO_URI ?? process.env.MONGODB_URI };
const parsed = schema.safeParse(raw);

if (!parsed.success) {
  const issues = parsed.error.issues.map((i) => `  - ${i.path.join('.')}: ${i.message}`).join('\n');
  console.error(`Invalid environment configuration:\n${issues}\nSee server/.env.example`);
  process.exit(1);
}
if (parsed.data.NODE_ENV === 'production' && !parsed.data.SMTP_HOST) {
  console.error('Refusing to start: SMTP_HOST is required in production (verification and reset emails).');
  process.exit(1);
}
if (parsed.data.NODE_ENV === 'production' && /change-me/i.test(parsed.data.JWT_SECRET + parsed.data.JWT_ADMIN_SECRET)) {
  console.error('Refusing to start: replace the placeholder JWT secrets.');
  process.exit(1);
}

export const env = Object.freeze(parsed.data);
