import { Router } from 'express';
import { authenticate, requirePermission } from '../../common/middleware/auth.js';
import { PERMISSIONS } from './statistic.constants.js';
import * as c from './statistic.controller.js';

const router = Router();

// Yêu cầu đăng nhập + mã quyền (STATISTIC_VIEW / STATISTIC_EXPORT).
router.use(authenticate);

router.get('/dashboard', requirePermission(PERMISSIONS.VIEW), c.dashboard); // UC_53
router.get('/revenue', requirePermission(PERMISSIONS.VIEW), c.revenue); // UC_49
router.get('/top-products', requirePermission(PERMISSIONS.VIEW), c.topProducts); // UC_54
router.get('/slow-products', requirePermission(PERMISSIONS.VIEW), c.slowProducts); // UC_54
router.get('/ratings', requirePermission(PERMISSIONS.VIEW), c.ratings); // UC_55
router.get('/export', requirePermission(PERMISSIONS.EXPORT), c.exportExcel); // UC_52

export default router;
