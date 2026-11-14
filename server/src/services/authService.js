import { EmailVerificationToken, PasswordResetToken, User } from '../models/index.js';
import { AUTH } from '../constants/auth.js';
import { ERROR_CODES as C } from '../constants/errorCodes.js';
import ApiError from '../utils/ApiError.js';
import { signUserToken } from '../utils/jwt.js';
import * as tokens from './tokenService.js';
import * as email from './emailService.js';

const INVALID_LOGIN = 'Invalid email or password';
let dummyHash; // lets "unknown email" take as long as "wrong password" (no timing leak)

const recentlySent = async (Model, userId) => {
  const last = await Model.findOne({ user: userId }).sort({ createdAt: -1 }).select('createdAt').lean();
  return Boolean(last && Date.now() - last.createdAt.getTime() < AUTH.RESEND_COOLDOWN_MS);
};

const session = (user, remember = false) => ({ user: user.toJSON(), token: signUserToken(user._id, { remember }) });

export async function register({ name, email: address, phone, password }) {
  if (await User.exists({ email: address })) {
    throw ApiError.conflict('An account with this email already exists', C.DUPLICATE, [{ path: 'email', message: 'Already registered. Try signing in.' }]);
  }
  const passwordHash = await User.hashPassword(password);
  const user = await User.create({ name, email: address, phone, passwordHash });
  const issued = await tokens.issueEmailVerification(user);
  const emailSent = await email.sendVerificationEmail(user, issued);
  return { user: user.toJSON(), emailSent };
}

export async function login({ email: address, password, remember }) {
  const user = await User.findOne({ email: address }).select('+passwordHash');
  dummyHash ??= await User.hashPassword('timing-equalizer');
  const ok = await (user ? user.comparePassword(password) : User.compareHash(password, dummyHash));
  if (!user || !ok) throw ApiError.unauthorized(INVALID_LOGIN);
  if (!user.isVerified) {
    throw new ApiError(403, C.EMAIL_NOT_VERIFIED, 'Verify your email before signing in', [{ path: 'email', message: user.email }]);
  }
  user.lastLoginAt = new Date();
  await user.save();
  return session(user, remember);
}

export async function verifyEmailLink(token) {
  const user = await tokens.verifyEmailWithToken(token);
  return session(user);
}

export async function verifyEmailCode({ email: address, code }) {
  const user = await tokens.verifyEmailWithCode(address, code);
  return session(user);
}

/** Always succeeds from the caller's view (no account enumeration). */
export async function resendVerification(address) {
  const user = await User.findOne({ email: address });
  if (!user || user.isVerified) return;
  if (await recentlySent(EmailVerificationToken, user._id)) return; // cooldown
  await email.sendVerificationEmail(user, await tokens.issueEmailVerification(user));
}

export async function forgotPassword(address, meta) {
  const user = await User.findOne({ email: address });
  if (!user) return;
  if (await recentlySent(PasswordResetToken, user._id)) return; // cooldown
  await email.sendPasswordResetEmail(user, await tokens.issuePasswordReset(user, meta));
}

export const checkResetToken = (token) => tokens.checkPasswordReset(token);

export async function resetPassword({ token, password }) {
  await tokens.resetPassword(token, password); // sets passwordChangedAt: all earlier sessions stop working
}

export async function changePassword(userId, { currentPassword, newPassword }) {
  const user = await User.findById(userId).select('+passwordHash');
  if (!user || !(await user.comparePassword(currentPassword))) {
    throw new ApiError(401, C.UNAUTHORIZED, 'Current password is incorrect');
  }
  user.passwordHash = await User.hashPassword(newPassword);
  user.passwordChangedAt = new Date();
  await user.save();
  return session(user); // fresh token; every older one is now invalid
}
