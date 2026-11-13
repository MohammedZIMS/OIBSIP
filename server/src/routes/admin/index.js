import { Router } from 'express';
import { adminAuth } from '../../middleware/adminAuth.js';

// Every route below requires an ADMIN token. Phase 2 adds inventory, orders, ledger and alerts here.
const router = Router();
router.use(adminAuth);
router.get('/ping', (req, res) => res.json({ data: { ok: true, admin: req.admin.email } }));
export default router;
