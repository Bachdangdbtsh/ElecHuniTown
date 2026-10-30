import { Router } from 'express';
import { authenticate } from '../../common/middleware/auth.js';
import * as c from './change-request.controller.js';

const router = Router();

router.use(authenticate);

router.post('/', c.create);
router.get('/mine', c.listMine);
router.patch('/profile', c.updateProfile);

export default router;