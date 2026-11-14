import { asyncHandler } from '../../utils/asyncHandler.js';
import { Admin } from '../../models/index.js';

// Example of role-based access: listed only for superadmins (see routes/admin/index.js).
export const listAdmins = asyncHandler(async (_req, res) => {
  const admins = await Admin.find().sort({ createdAt: 1 });
  res.json({ data: admins.map((a) => a.toJSON()) });
});
