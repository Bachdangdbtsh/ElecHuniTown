import { AppError } from '../../common/error/AppError.js';
import { prisma } from '../../lib/prisma.js';
import * as repo from './change-request.repository.js';
import { notify } from '../../utils/notify.js';

export async function requestAccountChange(userId, { reason, changes }) {
  const pending = await repo.findPendingRequestByUser(userId);
  if (pending) {
    throw new AppError(
      400,
      'PENDING_REQUEST_EXISTS',
      'Bạn đang có một yêu cầu thay đổi thông tin chưa được xử lý. Vui lòng chờ quản trị viên phê duyệt',
    );
  }

  const currentUser = await prisma.user.findUnique({
    where: { id: userId },
    include: { role: { select: { code: true } } },
  });

  if (!currentUser) {
    throw new AppError(404, 'USER_NOT_FOUND', 'Người dùng không tồn tại');
  }
  if (currentUser.role.code !== 'CUSTOMER') {
    throw new AppError(403, 'CUSTOMER_REQUIRED', 'Chỉ tài khoản khách hàng có thể gửi yêu cầu thay đổi thông tin');
  }

  if (changes.email && changes.email !== currentUser.email) {
    const dupEmail = await prisma.user.findUnique({ where: { email: changes.email } });
    if (dupEmail) {
      throw new AppError(409, 'EMAIL_EXISTS', 'Email mới này đã được đăng ký bởi tài khoản khác');
    }
  }

  if (changes.phone && changes.phone !== currentUser.phone) {
    const dupPhone = await prisma.user.findUnique({ where: { phone: changes.phone } });
    if (dupPhone) {
      throw new AppError(409, 'PHONE_EXISTS', 'Số điện thoại mới này đã được đăng ký bởi tài khoản khác');
    }
  }

  const previous = {
    fullName: currentUser.fullName,
    email: currentUser.email,
    phone: currentUser.phone,
  };

  const request = await repo.createRequest({
    requestedById: userId,
    reason,
    changes,
    previous,
  });
  const admins = await prisma.user.findMany({ where: { role: { code: 'ADMIN' }, isActive: true }, select: { id: true } });
  for (const admin of admins) await notify({ userId: admin.id, role: 'ADMIN', type: 'PROFILE_CHANGE_REQUEST', message: `Có yêu cầu thay đổi hồ sơ #${request.id}.`, url: '/admin/change-requests', payload: { requestId: request.id } });
  return request;
}

export async function getMyChangeRequests(userId) {
  return repo.findRequestsByUserId(userId);
}

export async function updateProfileDirect(userId, data) {
  if (data.phone) {
    const dupPhone = await prisma.user.findFirst({
      where: {
        phone: data.phone,
        NOT: { id: userId },
      },
    });
    if (dupPhone) {
      throw new AppError(409, 'PHONE_EXISTS', 'Số điện thoại này đã được sử dụng bởi tài khoản khác');
    }
  }

  return repo.updateUserDirect(userId, data);
}
