import { Router } from 'express';
import { auth, requireVerified } from '../middleware/auth.js';
import * as c from '../controllers/auth.controller.js';

// Every customer-only route sits behind a valid customer token AND a verified email.
const router = Router();
router.use(auth, requireVerified);
router.get('/me', c.me); // Phase 4+ adds orders, addresses and profile updates here
export default router;
