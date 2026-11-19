import { Router } from 'express';
import { authenticate, requireRole } from '../../common/middleware/auth.js';
import * as controller from './comment.controller.js';

const router = Router();

// UC_38: chỉ Staff và Shop Owner được xem toàn bộ đánh giá và phản hồi khách hàng.
router.use(authenticate, requireRole('STAFF', 'SHOP_OWNER'));

router.get('/', controller.list);
router.patch('/:id/reply', controller.reply);
router.delete('/:id/reply', controller.removeReply);

export default router;
