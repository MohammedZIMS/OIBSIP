import crypto from 'node:crypto';

/** Random URL-safe token (sent to the user) and its SHA-256 hash (stored in the database). */
export const randomToken = (bytes = 32) => crypto.randomBytes(bytes).toString('hex');
export const sha256 = (value) => crypto.createHash('sha256').update(String(value)).digest('hex');
export const sixDigitCode = () => String(crypto.randomInt(0, 1_000_000)).padStart(6, '0');

export const safeEqual = (a, b) => {
  const x = Buffer.from(String(a));
  const y = Buffer.from(String(b));
  return x.length === y.length && crypto.timingSafeEqual(x, y);
};
