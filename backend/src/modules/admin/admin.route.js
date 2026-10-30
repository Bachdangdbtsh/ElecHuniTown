import { Router } from 'express';
import { authenticate, requireRole, requirePermission } from '../../common/middleware/auth.js';
import * as c from './admin.controller.js';

const router = Router();

router.use(authenticate);
router.use(requireRole('ADMIN'));

router.post('/users', requirePermission('USER_CREATE_STAFF'), c.createStaff);
router.get('/users', requirePermission('USER_VIEW'), c.getUsers);
router.get('/users/:id', requirePermission('USER_VIEW'), c.getUser);
router.patch('/users/:id/status', requirePermission('USER_LOCK'), c.toggleLock);

router.get('/change-requests', requirePermission('CHANGE_REQUEST_REVIEW'), c.listChangeRequests);
router.patch('/change-requests/:id/review', requirePermission('CHANGE_REQUEST_REVIEW'), c.reviewRequest);

router.get('/access-analytics', requirePermission('ACCESS_ANALYTICS_VIEW'), c.analytics);

export default router;