import { Router } from 'express';
import { authenticate } from '../../common/middleware/auth.js';
import * as c from './recipient.controller.js';

const router = Router();

router.use(authenticate);

router.get('/', c.list);
router.post('/', c.create);
router.put('/:id', c.update);
router.patch('/:id/default', c.setDefault);
router.delete('/:id', c.remove);

export default router;