import { z } from 'zod';

const email = z.string().trim().toLowerCase().email('Enter a valid email address').max(254);

// Same rules the reset-password page shows: length, upper, lower, number, special. 72 = bcrypt's byte limit.
export const strongPassword = z
  .string()
  .min(8, 'Use at least 8 characters')
  .max(72, 'Use at most 72 characters')
  .regex(/[a-z]/, 'Add a lowercase letter')
  .regex(/[A-Z]/, 'Add an uppercase letter')
  .regex(/\d/, 'Add a number')
  .regex(/[^A-Za-z0-9]/, 'Add a special character');

const token = z.string().trim().regex(/^[a-f0-9]{64}$/i, 'Invalid token');

export const registerBody = z.object({
  name: z.string().trim().min(2, 'Enter your name').max(60),
  email,
  phone: z.string().trim().regex(/^\+?[0-9 ()-]{7,15}$/, 'Enter a valid phone number'),
  password: strongPassword,
  acceptTerms: z.literal(true, { errorMap: () => ({ message: 'You must accept the terms to continue' }) }),
});

export const loginBody = z.object({
  email,
  password: z.string().min(1, 'Enter your password').max(72),
  remember: z.boolean().optional().default(false),
});

export const emailOnlyBody = z.object({ email });
export const verifyEmailQuery = z.object({ token });
export const verifyCodeBody = z.object({ email, code: z.string().trim().regex(/^\d{6}$/, 'Enter the 6-digit code') });
export const resetTokenQuery = z.object({ token });
export const resetPasswordBody = z.object({ token, password: strongPassword });
export const changePasswordBody = z
  .object({ currentPassword: z.string().min(1).max(72), newPassword: strongPassword })
  .refine((v) => v.currentPassword !== v.newPassword, { path: ['newPassword'], message: 'Choose a different password from the current one' });

export const adminLoginBody = z.object({ email, password: z.string().min(1).max(72) });
