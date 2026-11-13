import ApiError from '../utils/ApiError.js';
import { ERROR_CODES as C } from '../constants/errorCodes.js';
import { verifyUserToken } from '../utils/jwt.js';
import { User } from '../models/index.js';

export const bearer = (req) => {
  const [scheme, token] = (req.headers.authorization ?? '').split(' ');
  return scheme === 'Bearer' && token ? token : null;
};

// A token is stale if the password changed after it was issued.
export const issuedBeforeChange = (payload, changedAt) => Boolean(changedAt && payload.iat * 1000 < changedAt.getTime());

/** Requires a valid customer JWT; sets req.user. */
export async function auth(req, _res, next) {
  try {
    const token = bearer(req);
    if (!token) throw ApiError.unauthorized();
    const payload = verifyUserToken(token);
    const user = await User.findById(payload.sub);
    if (!user || issuedBeforeChange(payload, user.passwordChangedAt)) throw ApiError.unauthorized('Session expired, please sign in again');
    req.user = user;
    next();
  } catch (err) {
    next(err);
  }
}

/** Use after auth: blocks accounts that have not verified their email. */
export const requireVerified = (req, _res, next) =>
  req.user?.isVerified ? next() : next(ApiError.forbidden('Verify your email to continue', C.EMAIL_NOT_VERIFIED));
