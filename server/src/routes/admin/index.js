import { Router } from 'express';
import { adminAuth } from '../../middleware/adminAuth.js';
import { requireRole } from '../../middleware/requireRole.js';
import { ADMIN_ROLES } from '../../constants/auth.js';
import adminAuthRoutes from './auth.routes.js';
import * as auth from '../../controllers/admin/auth.controller.js';
import * as admins from '../../controllers/admin/admin.controller.js';

const router = Router();

router.use('/auth', adminAuthRoutes); // public: login only

// Everything below needs a valid ADMIN token (separate secret and audience from customer tokens).
router.use(adminAuth);
router.get('/me', auth.me);
router.get('/ping', (req, res) => res.json({ data: { ok: true, admin: req.admin.email, role: req.admin.role } }));

// Role-based: superadmin only. Phase 2 adds inventory and order routes here (any admin).
router.get('/admins', requireRole(ADMIN_ROLES.SUPER_ADMIN), admins.listAdmins);

export default router;
