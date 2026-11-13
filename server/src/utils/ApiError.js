import { ERROR_CODES as C } from '../constants/errorCodes.js';

/** Operational error that the central handler turns into the standard error envelope. */
export default class ApiError extends Error {
  constructor(status, code, message, details) {
    super(message);
    this.name = 'ApiError';
    this.status = status;
    this.code = code;
    this.details = details;
    Error.captureStackTrace?.(this, ApiError);
  }
  static badRequest(message = 'Invalid request', details) { return new ApiError(400, C.VALIDATION_ERROR, message, details); }
  static unauthorized(message = 'Authentication required', code = C.UNAUTHORIZED) { return new ApiError(401, code, message); }
  static forbidden(message = 'You do not have access to this resource', code = C.FORBIDDEN) { return new ApiError(403, code, message); }
  static notFound(message = 'Resource not found') { return new ApiError(404, C.NOT_FOUND, message); }
  static conflict(message, code = C.CONFLICT, details) { return new ApiError(409, code, message, details); }
  static tooMany(message = 'Too many requests, try again later') { return new ApiError(429, C.RATE_LIMITED, message); }
}
