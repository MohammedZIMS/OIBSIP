const MIN = 60 * 1000;
const HOUR = 60 * MIN;

export const AUTH = Object.freeze({
  EMAIL_VERIFY_TTL_MS: 24 * HOUR,
  PASSWORD_RESET_TTL_MS: 1 * HOUR,
  VERIFY_CODE_MAX_ATTEMPTS: 5,
  ADMIN_MAX_FAILED_ATTEMPTS: 5,
  ADMIN_LOCK_MS: 15 * MIN,
  BCRYPT_COST: process.env.NODE_ENV === 'test' ? 4 : 12, // low cost only to keep tests fast
  RESEND_COOLDOWN_MS: 60 * 1000,
  USER_AUDIENCE: 'user',
  ADMIN_AUDIENCE: 'admin',
});

export const ADMIN_ROLES = Object.freeze({ ADMIN: 'admin', SUPER_ADMIN: 'superadmin' });
