import ApiError from '../utils/ApiError.js';
import { verifyAdminToken } from '../utils/jwt.js';
import { Admin } from '../models/index.js';
import { bearer, issuedBeforeChange } from './auth.js';

/** Requires a valid ADMIN JWT (different secret and audience from customer tokens); sets req.admin. */
export async function adminAuth(req, _res, next) {
  try {
    const token = bearer(req);
    if (!token) throw ApiError.unauthorized();
    const payload = verifyAdminToken(token);
    const admin = await Admin.findById(payload.sub);
    if (!admin || !admin.isActive || issuedBeforeChange(payload, admin.passwordChangedAt)) throw ApiError.unauthorized('Session expired, please sign in again');
    req.admin = admin;
    next();
  } catch (err) {
    next(err);
  }
}
