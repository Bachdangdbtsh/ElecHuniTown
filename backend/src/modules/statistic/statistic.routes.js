import { Router } from 'express';
import { authenticate, requirePermission, requireRole } from '../../common/middleware/auth.js';
import { PERMISSIONS } from './statistic.constants.js';
import * as c from './statistic.controller.js';

const router = Router();

// Yêu cầu đăng nhập + mã quyền (STATISTIC_VIEW / STATISTIC_EXPORT).
router.use(authenticate, requireRole('SHOP_OWNER'));

router.get('/dashboard', requirePermission(PERMISSIONS.VIEW), c.dashboard); // UC_53
router.get('/revenue', requirePermission(PERMISSIONS.VIEW), c.revenue); // UC_49
router.get('/profit', requirePermission(PERMISSIONS.VIEW), c.profit); // UC_50
router.get('/breakdown', requirePermission(PERMISSIONS.VIEW), c.breakdown); // UC_51
router.get('/top-products', requirePermission(PERMISSIONS.VIEW), c.topProducts); // UC_54
router.get('/slow-products', requirePermission(PERMISSIONS.VIEW), c.slowProducts); // UC_54
router.get('/ratings', requirePermission(PERMISSIONS.VIEW), c.ratings); // UC_55
router.get('/ratings/reviews', requirePermission(PERMISSIONS.VIEW), c.ratingReviews); // UC_55 detail
router.get('/export', requirePermission(PERMISSIONS.EXPORT), c.exportExcel); // UC_52

export default router;
