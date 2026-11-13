import mongoose from 'mongoose';
import { ZodError } from 'zod';
import ApiError from '../utils/ApiError.js';
import { ERROR_CODES as C } from '../constants/errorCodes.js';
import { logger } from '../config/logger.js';

/** Maps any thrown value to { status, code, message, details? }. Pure, so it is unit tested. */
export function normalizeError(err) {
  if (err instanceof ApiError) return { status: err.status, code: err.code, message: err.message, details: err.details };

  if (err instanceof ZodError) {
    return {
      status: 400,
      code: C.VALIDATION_ERROR,
      message: 'Validation failed',
      details: err.issues.map((i) => ({ path: i.path.join('.'), message: i.message })),
    };
  }
  if (err instanceof mongoose.Error.ValidationError) {
    return {
      status: 400,
      code: C.VALIDATION_ERROR,
      message: 'Validation failed',
      details: Object.values(err.errors).map((e) => ({ path: e.path, message: e.message })),
    };
  }
  if (err instanceof mongoose.Error.CastError) {
    return { status: 400, code: C.INVALID_ID, message: `Invalid value for ${err.path}` };
  }
  if (err?.code === 11000) {
    const fields = Object.keys(err.keyPattern ?? err.keyValue ?? {});
    return {
      status: 409,
      code: C.DUPLICATE,
      message: fields.length ? `A record with this ${fields.join(', ')} already exists` : 'Duplicate record',
      details: fields.map((f) => ({ path: f, message: 'must be unique' })),
    };
  }
  if (err?.name === 'TokenExpiredError') return { status: 401, code: C.TOKEN_EXPIRED, message: 'Session expired, please sign in again' };
  if (err?.name === 'JsonWebTokenError' || err?.name === 'NotBeforeError') return { status: 401, code: C.UNAUTHORIZED, message: 'Invalid authentication token' };
  if (err?.type === 'entity.parse.failed') return { status: 400, code: C.INVALID_JSON, message: 'Request body is not valid JSON' };
  if (err?.type === 'entity.too.large') return { status: 413, code: C.PAYLOAD_TOO_LARGE, message: 'Request body is too large' };

  const production = process.env.NODE_ENV === 'production';
  return { status: 500, code: C.INTERNAL, message: production ? 'Something went wrong' : (err?.message ?? 'Something went wrong') };
}

// eslint-disable-next-line no-unused-vars
export function errorHandler(err, req, res, _next) {
  const { status, code, message, details } = normalizeError(err);
  const log = { err, requestId: req.id, method: req.method, url: req.originalUrl };
  if (status >= 500) logger.error(log, 'unhandled error');
  else logger.warn({ ...log, err: { name: err?.name, message: err?.message }, code }, 'request failed');

  if (res.headersSent) return res.end();
  res.status(status).json({ error: { code, message, ...(details ? { details } : {}), requestId: req.id } });
}
