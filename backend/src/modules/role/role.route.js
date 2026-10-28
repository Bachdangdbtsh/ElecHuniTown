import { Router } from 'express';
import { authenticate, requireRole, requirePermission } from '../../common/middleware/auth.js';
import * as c from './role.controller.js';

const router = Router();

router.use(authenticate);
router.use(requireRole('ADMIN'));
router.use(requirePermission('ROLE_MANAGE'));

router.get('/matrix', c.getMatrix);
router.put('/:id/permissions', c.setPermissions);

export default router;