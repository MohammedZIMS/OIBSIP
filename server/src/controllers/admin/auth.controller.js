import { asyncHandler } from '../../utils/asyncHandler.js';
import * as adminAuth from '../../services/adminAuthService.js';

export const login = asyncHandler(async (req, res) => {
  res.json({ data: await adminAuth.adminLogin(req.body) });
});

export const me = (req, res) => res.json({ data: { admin: req.admin.toJSON() } });
