import jwt from 'jsonwebtoken';
import { env } from '../config/env.js';
import { AUTH } from '../constants/auth.js';

export const signUserToken = (userId, { remember = false } = {}) =>
  jwt.sign({ sub: String(userId) }, env.JWT_SECRET, {
    audience: AUTH.USER_AUDIENCE,
    expiresIn: remember ? env.JWT_REMEMBER_EXPIRES_IN : env.JWT_EXPIRES_IN,
  });

export const signAdminToken = (adminId) =>
  jwt.sign({ sub: String(adminId) }, env.JWT_ADMIN_SECRET, {
    audience: AUTH.ADMIN_AUDIENCE,
    expiresIn: env.JWT_ADMIN_EXPIRES_IN,
  });

export const verifyUserToken = (token) => jwt.verify(token, env.JWT_SECRET, { audience: AUTH.USER_AUDIENCE });
export const verifyAdminToken = (token) => jwt.verify(token, env.JWT_ADMIN_SECRET, { audience: AUTH.ADMIN_AUDIENCE });
