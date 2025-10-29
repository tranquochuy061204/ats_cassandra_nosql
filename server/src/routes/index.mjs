import { Router } from 'express';

import authRoutes from './auth.mjs';
import jobsRoutes from './jobs.mjs';
import applicationsRoutes from './applications.mjs';
import userRoutes from './users.mjs';
import uploadRoutes from './upload.mjs';
import locationRoutes from './locations.mjs';
import adminsRoutes from './admins.mjs';
import applicationRoundsRoutes from './applicationRounds.mjs';
import dashboardRoutes from './dashboard.mjs';
import interviewsRoutes from './interviews.mjs';
import adminUsersRoutes from './adminUsers.mjs';
import shortlistRoutes from './shortlist.mjs';
const router = Router();

router.use(authRoutes);
router.use(jobsRoutes);
router.use(applicationsRoutes);
router.use(userRoutes);
router.use(uploadRoutes);
router.use(locationRoutes);
router.use(adminsRoutes);
router.use(applicationRoundsRoutes);
router.use(dashboardRoutes);
router.use(interviewsRoutes);
router.use(adminUsersRoutes);
router.use(shortlistRoutes);

export default router;
