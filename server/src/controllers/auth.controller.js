import { asyncHandler } from '../utils/asyncHandler.js';
import * as auth from '../services/authService.js';

export const register = asyncHandler(async (req, res) => {
  const { user, emailSent } = await auth.register(req.body);
  res.status(201).json({
    data: { user },
    message: emailSent
      ? 'Account created. Check your email to verify your address.'
      : 'Account created, but the verification email could not be sent. Use "Resend" on the next page.',
  });
});

export const login = asyncHandler(async (req, res) => {
  res.json({ data: await auth.login(req.body) });
});

export const verifyEmail = asyncHandler(async (req, res) => {
  res.json({ data: await auth.verifyEmailLink(req.query.token), message: 'Email verified' });
});

export const verifyCode = asyncHandler(async (req, res) => {
  res.json({ data: await auth.verifyEmailCode(req.body), message: 'Email verified' });
});

export const resendVerification = asyncHandler(async (req, res) => {
  await auth.resendVerification(req.body.email);
  res.json({ message: 'If that account needs verification, a new email is on its way.' });
});

export const forgotPassword = asyncHandler(async (req, res) => {
  await auth.forgotPassword(req.body.email, { ip: req.ip, userAgent: req.get('user-agent') });
  res.json({ message: 'If an account exists for that email, a reset link is on its way.' });
});

export const validateResetToken = asyncHandler(async (req, res) => {
  res.json({ data: await auth.checkResetToken(req.query.token) });
});

export const resetPassword = asyncHandler(async (req, res) => {
  await auth.resetPassword(req.body);
  res.json({ message: 'Password updated. Sign in with your new password.' });
});

export const changePassword = asyncHandler(async (req, res) => {
  res.json({ data: await auth.changePassword(req.user._id, req.body), message: 'Password changed' });
});

export const me = (req, res) => res.json({ data: { user: req.user.toJSON() } });
