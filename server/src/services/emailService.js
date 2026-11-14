import nodemailer from 'nodemailer';
import { env } from '../config/env.js';
import { logger } from '../config/logger.js';
import { AUTH } from '../constants/auth.js';
import { verifyEmailTemplate } from '../templates/verifyEmail.js';
import { resetPasswordTemplate } from '../templates/resetPassword.js';

/** Messages "sent" while NODE_ENV=test (tests read links and codes from here). */
export const sentMessages = [];

let transport;
const getTransport = () => {
  if (transport !== undefined) return transport;
  transport = env.SMTP_HOST
    ? nodemailer.createTransport({
        host: env.SMTP_HOST,
        port: env.SMTP_PORT,
        secure: env.SMTP_SECURE,
        auth: env.SMTP_USER ? { user: env.SMTP_USER, pass: env.SMTP_PASS } : undefined,
      })
    : null;
  return transport;
};

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

/** Sends one email with up to 3 attempts. Throws if every attempt fails. */
export async function sendMail({ to, subject, html, text }) {
  if (env.NODE_ENV === 'test') {
    sentMessages.push({ to, subject, html, text });
    return;
  }
  const t = getTransport();
  if (!t) {
    // Development convenience only (production refuses to start without SMTP_HOST).
    logger.warn(`SMTP_HOST not set: email NOT sent. To: ${to} | ${subject}\n${text}`);
    return;
  }
  let lastErr;
  for (let attempt = 0; attempt < 3; attempt += 1) {
    try {
      await t.sendMail({ from: env.MAIL_FROM, to, subject, html, text });
      return;
    } catch (err) {
      lastErr = err;
      if (['ECONNREFUSED', 'ESOCKET', 'ECONNECTION', 'ENOTFOUND', 'EAUTH'].includes(err.code)) break; // retrying will not help
      await sleep(500 * 2 ** attempt);
    }
  }
  if (env.NODE_ENV === 'development') {
    // Dev only: do not block sign-up when the mail server is not running. The link is in the log instead.
    logger.warn(`SMTP unavailable (${lastErr.code ?? lastErr.message}). Email NOT sent; use this instead.\nTo: ${to} | ${subject}\n${text}`);
    return;
  }
  throw lastErr;
}

/** Never throws: an email outage must not fail registration. Returns true when sent. */
async function safeSend(message) {
  try {
    await sendMail(message);
    return true;
  } catch (err) {
    logger.error({ err: { name: err.name, message: err.message }, to: message.to }, 'email failed');
    return false;
  }
}

export const sendVerificationEmail = (user, { token, code }) =>
  safeSend({
    to: user.email,
    ...verifyEmailTemplate({
      name: user.name,
      link: `${env.CLIENT_URL}/verify-email?token=${token}`,
      code,
      hoursValid: Math.round(AUTH.EMAIL_VERIFY_TTL_MS / 3600000),
    }),
  });

export const sendPasswordResetEmail = (user, { token }) =>
  safeSend({
    to: user.email,
    ...resetPasswordTemplate({
      name: user.name,
      link: `${env.CLIENT_URL}/reset-password?token=${token}`,
      minutesValid: Math.round(AUTH.PASSWORD_RESET_TTL_MS / 60000),
    }),
  });
