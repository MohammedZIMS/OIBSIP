import { Router } from 'express';
import catalogueRoutes from './catalogue.routes.js';
import authRoutes from './auth.routes.js';
import userRoutes from './user.routes.js';
import adminRoutes from './admin/index.js';

const router = Router();
router.use(catalogueRoutes);
router.use('/auth', authRoutes);
router.use('/users', userRoutes);
router.use('/admin', adminRoutes);
export default router;
