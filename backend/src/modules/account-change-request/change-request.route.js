import { Router } from 'express';
import { authenticate, requireRole } from '../../common/middleware/auth.js';
import * as c from './change-request.controller.js';

const router = Router();

router.use(authenticate);

router.post('/', requireRole('CUSTOMER'), c.create);
router.get('/mine', c.listMine);
router.patch('/profile', c.updateProfile);

export default router;
