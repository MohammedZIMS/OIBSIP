import { Router } from 'express';
import { validate } from '../middleware/validate.js';
import { auth } from '../middleware/auth.js';
import { authLimiter } from '../middleware/rateLimit.js';
import * as v from '../validators/index.js';
import * as c from '../controllers/auth.controller.js';

const router = Router();

// Public
router.post('/register', authLimiter, validate({ body: v.registerBody }), c.register);
router.post('/login', authLimiter, validate({ body: v.loginBody }), c.login);
router.get('/verify-email', authLimiter, validate({ query: v.verifyEmailQuery }), c.verifyEmail);
router.post('/verify-code', authLimiter, validate({ body: v.verifyCodeBody }), c.verifyCode);
router.post('/resend-verification', authLimiter, validate({ body: v.emailOnlyBody }), c.resendVerification);
router.post('/forgot-password', authLimiter, validate({ body: v.emailOnlyBody }), c.forgotPassword);
router.get('/reset-token/validate', authLimiter, validate({ query: v.resetTokenQuery }), c.validateResetToken);
router.post('/reset-password', authLimiter, validate({ body: v.resetPasswordBody }), c.resetPassword);

// Signed-in customers
router.get('/me', auth, c.me);
router.post('/change-password', auth, validate({ body: v.changePasswordBody }), c.changePassword);

export default router;
