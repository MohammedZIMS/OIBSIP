import ApiError from '../utils/ApiError.js';

/** Use after adminAuth: allows only the listed admin roles. Example: requireRole('superadmin') */
export const requireRole = (...roles) => (req, _res, next) =>
  roles.includes(req.admin?.role) ? next() : next(ApiError.forbidden('Your role cannot perform this action'));
