import { Router } from 'express';
import { validate } from '../../middleware/validate.js';
import { adminAuthLimiter } from '../../middleware/rateLimit.js';
import { adminLoginBody } from '../../validators/index.js';
import * as c from '../../controllers/admin/auth.controller.js';

// The only public admin route. There is deliberately no admin registration endpoint:
// admins are created with `npm run seed:admin`.
const router = Router();
router.post('/login', adminAuthLimiter, validate({ body: adminLoginBody }), c.login);
export default router;
