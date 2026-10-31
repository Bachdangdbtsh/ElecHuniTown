import { Router } from 'express';
import { authenticate } from '../../common/middleware/auth.js';
import * as c from './auth.controller.js';

const router = Router();

router.post('/register', c.register);
router.post('/login', c.login);
router.post('/logout', c.logout);
router.post('/forgot-password', c.forgotPassword);
router.post('/reset-password', c.resetPassword);

router.get('/me', authenticate, c.getMe);
router.post('/change-password', authenticate, c.changePassword);

export default router;