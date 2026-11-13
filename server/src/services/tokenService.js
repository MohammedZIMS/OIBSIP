import { EmailVerificationToken, PasswordResetToken, User } from '../models/index.js';
import { AUTH } from '../constants/auth.js';
import { ERROR_CODES as C } from '../constants/errorCodes.js';
import ApiError from '../utils/ApiError.js';
import { randomToken, sha256, sixDigitCode, safeEqual } from '../utils/tokens.js';

const invalid = (what) => new ApiError(400, C.TOKEN_INVALID, `This ${what} is invalid or has expired`);
const codeHash = (userId, code) => sha256(`${userId}:${code}`);
const markVerified = (userId) =>
  User.findByIdAndUpdate(userId, { $set: { isVerified: true, verifiedAt: new Date() } }, { new: true });

// ---------- email verification ----------
/** Creates a link token and a 6-digit backup code. Returns the RAW values (to email), stores only hashes. */
export async function issueEmailVerification(user) {
  await EmailVerificationToken.deleteMany({ user: user._id, usedAt: null }); // only the latest email works
  const token = randomToken();
  const code = sixDigitCode();
  const expiresAt = new Date(Date.now() + AUTH.EMAIL_VERIFY_TTL_MS);
  await EmailVerificationToken.create({ user: user._id, email: user.email, tokenHash: sha256(token), codeHash: codeHash(user._id, code), expiresAt });
  return { token, code, expiresAt };
}

export async function verifyEmailWithToken(token) {
  // Single atomic claim: a token can be used once, even with concurrent requests.
  const record = await EmailVerificationToken.findOneAndUpdate(
    { tokenHash: sha256(token), usedAt: null, expiresAt: { $gt: new Date() } },
    { $set: { usedAt: new Date() } },
    { new: true },
  );
  if (!record) throw invalid('verification link');
  return markVerified(record.user);
}

export async function verifyEmailWithCode(email, code) {
  const user = await User.findOne({ email: String(email).toLowerCase() });
  const record = user && (await EmailVerificationToken.findOne({ user: user._id, usedAt: null, expiresAt: { $gt: new Date() } }));
  if (!record || record.codeAttempts >= AUTH.VERIFY_CODE_MAX_ATTEMPTS) throw invalid('verification code');
  if (!safeEqual(record.codeHash, codeHash(user._id, code))) {
    await EmailVerificationToken.updateOne({ _id: record._id }, { $inc: { codeAttempts: 1 } });
    throw invalid('verification code');
  }
  await EmailVerificationToken.updateOne({ _id: record._id }, { $set: { usedAt: new Date() } });
  return markVerified(user._id);
}

// ---------- password reset ----------
export async function issuePasswordReset(user, { ip, userAgent } = {}) {
  await PasswordResetToken.deleteMany({ user: user._id, usedAt: null });
  const token = randomToken();
  const expiresAt = new Date(Date.now() + AUTH.PASSWORD_RESET_TTL_MS);
  await PasswordResetToken.create({ user: user._id, tokenHash: sha256(token), expiresAt, requestedIp: ip, userAgent: userAgent?.slice(0, 200) });
  return { token, expiresAt };
}

/** For the reset page: confirms the token works and says how long is left. */
export async function checkPasswordReset(token) {
  const record = await PasswordResetToken.findOne({ tokenHash: sha256(token), usedAt: null, expiresAt: { $gt: new Date() } });
  if (!record) throw invalid('reset link');
  return { expiresAt: record.expiresAt, minutesRemaining: Math.max(1, Math.round((record.expiresAt - Date.now()) / 60000)) };
}

export async function resetPassword(token, newPassword) {
  const record = await PasswordResetToken.findOneAndUpdate(
    { tokenHash: sha256(token), usedAt: null, expiresAt: { $gt: new Date() } },
    { $set: { usedAt: new Date() } },
    { new: true },
  );
  if (!record) throw invalid('reset link');
  const passwordHash = await User.hashPassword(newPassword);
  // passwordChangedAt invalidates every JWT issued before now (signs out other sessions).
  return User.findByIdAndUpdate(record.user, { $set: { passwordHash, passwordChangedAt: new Date() } }, { new: true });
}
