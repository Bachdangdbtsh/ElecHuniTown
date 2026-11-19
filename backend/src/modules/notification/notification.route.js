import { Router } from 'express';
import { authenticate } from '../../common/middleware/auth.js';
import { AppError } from '../../common/error/AppError.js';
import { prisma } from '../../lib/prisma.js';

const router = Router();
router.use(authenticate);

router.get('/', async (req, res) => {
  const userId = req.user.id;
  const unreadOnly = req.query.unreadOnly === 'true';
  const [notifications, unreadCount] = await Promise.all([
    prisma.notification.findMany({
      where: { userId, ...(unreadOnly ? { isRead: false } : {}) },
      orderBy: [{ createdAt: 'desc' }, { id: 'desc' }],
      take: 5,
    }),
    prisma.notification.count({ where: { userId, isRead: false } }),
  ]);
  res.json({ data: { notifications, unreadCount } });
});

router.patch('/mark-all-read', async (req, res) => {
  await prisma.notification.updateMany({ where: { userId: req.user.id, isRead: false }, data: { isRead: true } });
  res.json({ data: { ok: true } });
});

router.patch('/:id/read', async (req, res) => {
  const id = Number(req.params.id);
  if (!Number.isSafeInteger(id) || id < 1) throw new AppError(400, 'INVALID_ID', 'Mã thông báo không hợp lệ');
  const result = await prisma.notification.updateMany({
    where: { id, userId: req.user.id }, data: { isRead: true },
  });
  if (!result.count) throw new AppError(404, 'NOT_FOUND', 'Không tìm thấy thông báo');
  res.json({ data: { ok: true } });
});

export default router;
