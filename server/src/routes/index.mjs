import { Router } from 'express';

import authRoutes from './auth.mjs';
import jobsRoutes from './jobs.mjs';
import applicationsRoutes from './applications.mjs';
import userRoutes from './users.mjs';
import uploadRoutes from './upload.mjs';
import locationRoutes from './locations.mjs';

const router = Router();

router.use(authRoutes);
router.use(jobsRoutes);
router.use(applicationsRoutes);
router.use(userRoutes);
router.use(uploadRoutes);
router.use(locationRoutes);

export default router;
