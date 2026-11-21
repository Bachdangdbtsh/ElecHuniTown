import { Router } from 'express';
import { authenticate, requireRole } from '../../common/middleware/auth.js';
import * as controller from './order.controller.js';

const router = Router();
router.use(authenticate);
router.post('/:id/delivered', requireRole('SHOP_OWNER', 'ADMIN'), controller.markDelivered);
router.post('/:id/confirm-delivery', requireRole('CUSTOMER', 'SHOP_OWNER', 'ADMIN'), controller.confirmDelivered);
export default router;
