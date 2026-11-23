import { AppError } from '../../common/error/AppError.js';
import * as repo from './comment.repository.js';

/** Danh sách đánh giá cho Staff/Shop Owner, lọc theo sản phẩm, số sao, trạng thái phản hồi. */
export async function list(query) {
  const page = query.page ?? 1;
  const limit = query.limit ?? 10;
  const where = { isActive: true };

  if (query.productId) where.productId = query.productId;
  if (query.rating) where.rating = query.rating;
  if (query.answered === 'true') where.reply = { not: null };
  if (query.answered === 'false') where.reply = null;

  const [items, total] = await Promise.all([
    repo.findMany({ where, skip: (page - 1) * limit, take: limit }),
    repo.count(where),
  ]);

  return {
    items,
    pagination: {
      page,
      limit,
      total,
      totalPages: Math.max(1, Math.ceil(total / limit)),
    },
  };
}

/** Gửi phản hồi; mỗi đánh giá có một phản hồi, gửi lại thì ghi đè nội dung cũ. */
export async function reply(id, content, staffId) {
  const comment = await repo.findById(id);
  if (!comment) {
    throw new AppError(404, 'COMMENT_NOT_FOUND', 'Không tìm thấy đánh giá cần phản hồi');
  }

  return repo.updateReply(id, {
    reply: content,
    repliedAt: new Date(),
    repliedById: staffId,
  });
}

/** Thu hồi phản hồi (đánh giá vẫn được giữ lại). */
export async function removeReply(id) {
  const comment = await repo.findById(id);
  if (!comment) {
    throw new AppError(404, 'COMMENT_NOT_FOUND', 'Không tìm thấy đánh giá');
  }

  return repo.updateReply(id, { reply: null, repliedAt: null, repliedById: null });
}
