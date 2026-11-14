import rateLimit from 'express-rate-limit';
import ApiError from '../utils/ApiError.js';

const make = (windowMs, limit) =>
  rateLimit({ windowMs, limit, standardHeaders: 'draft-7', legacyHeaders: false, skip: () => process.env.NODE_ENV === 'test', handler: (_req, _res, next) => next(ApiError.tooMany()) });

export const apiLimiter = make(60 * 1000, 300); // general API
export const authLimiter = make(15 * 60 * 1000, 20); // login, register, forgot, resend
export const adminAuthLimiter = make(15 * 60 * 1000, 10);
