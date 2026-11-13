import { Router } from 'express';
import catalogueRoutes from './catalogue.routes.js';
import adminRoutes from './admin/index.js';

const router = Router();
router.use(catalogueRoutes);
router.use('/admin', adminRoutes);
export default router;
