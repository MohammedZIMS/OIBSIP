import { Admin } from '../models/index.js';
import { AUTH } from '../constants/auth.js';
import { ERROR_CODES as C } from '../constants/errorCodes.js';
import ApiError from '../utils/ApiError.js';
import { signAdminToken } from '../utils/jwt.js';

const INVALID = 'Invalid credentials';
let dummyHash;

export async function adminLogin({ email, password }) {
  const admin = await Admin.findOne({ email }).select('+passwordHash');
  dummyHash ??= await Admin.hashPassword('timing-equalizer');

  if (admin?.isLocked) {
    const minutes = Math.max(1, Math.ceil((admin.lockedUntil - Date.now()) / 60000));
    throw new ApiError(403, C.ACCOUNT_LOCKED, `Too many failed attempts. Try again in ${minutes} minute${minutes === 1 ? '' : 's'}.`);
  }

  const ok = await (admin ? admin.comparePassword(password) : Admin.compareHash(password, dummyHash));
  if (!admin || !admin.isActive || !ok) {
    if (admin) await recordFailure(admin._id);
    throw ApiError.unauthorized(INVALID);
  }

  await Admin.updateOne({ _id: admin._id }, { $set: { failedAttempts: 0, lockedUntil: null, lastLoginAt: new Date() } });
  return { admin: admin.toJSON(), token: signAdminToken(admin._id) };
}

// Atomic counter: concurrent wrong guesses cannot slip past the limit.
async function recordFailure(id) {
  const updated = await Admin.findByIdAndUpdate(id, { $inc: { failedAttempts: 1 } }, { new: true });
  if (updated.failedAttempts >= AUTH.ADMIN_MAX_FAILED_ATTEMPTS) {
    await Admin.updateOne({ _id: id }, { $set: { lockedUntil: new Date(Date.now() + AUTH.ADMIN_LOCK_MS), failedAttempts: 0 } });
  }
}
