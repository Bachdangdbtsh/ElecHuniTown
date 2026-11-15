import bcrypt from 'bcrypt';
import { invalidateUserSessions } from '../../common/sessionInvalidation.js';
import { AppError } from '../../common/error/AppError.js';
import * as repo from './admin.repository.js';

export async function createInternalUser(payload) {
  const existingEmail = await repo.findUserByEmail(payload.email);
  if (existingEmail) {
    throw new AppError(409, 'EMAIL_EXISTS', 'Email này đã tồn tại trong hệ thống');
  }

  if (payload.phone) {
    const existingPhone = await repo.findUserByPhone(payload.phone);
    if (existingPhone) {
      throw new AppError(409, 'PHONE_EXISTS', 'Số điện thoại này đã tồn tại trong hệ thống');
    }
  }

  const role = await repo.findRoleByCode(payload.roleCode);
  if (!role) {
    throw new AppError(404, 'ROLE_NOT_FOUND', 'Vai trò được chọn không tồn tại');
  }

  const passwordHash = await bcrypt.hash(payload.temporaryPassword, 10);

  const newUser = await repo.createInternalUser({
    email: payload.email,
    passwordHash,
    fullName: payload.fullName,
    phone: payload.phone,
    roleId: role.id,
    roleCode: payload.roleCode,
  });

  return {
    id: newUser.id,
    email: newUser.email,
    fullName: newUser.fullName,
    phone: newUser.phone,
    role: newUser.role.code,
    roleName: newUser.role.name,
    createdAt: newUser.createdAt,
  };
}

export async function listUsers(query) {
  const where = {};

  if (query.role && query.role !== 'all') {
    where.role = { code: query.role.toUpperCase() };
  }

  if (query.status === 'active') {
    where.isActive = true;
  } else if (query.status === 'locked') {
    where.isActive = false;
  }

  if (query.search) {
    const s = query.search;
    where.OR = [
      { fullName: { contains: s, mode: 'insensitive' } },
      { email: { contains: s, mode: 'insensitive' } },
      { phone: { contains: s, mode: 'insensitive' } },
    ];
  }

  const skip = (query.page - 1) * query.limit;
  const take = query.limit;

  const [{ total, users }, kpis] = await Promise.all([
    repo.findUsersWithPagination({ where, skip, take }),
    repo.getUserKpiCounts(),
  ]);

  const items = users.map((u) => ({
    id: u.id,
    userCode: `U-${u.id}`,
    fullName: u.fullName,
    email: u.email,
    phone: u.phone,
    role: u.role.code,
    roleName: u.role.name,
    isActive: u.isActive,
    lastLoginAt: u.lastLoginAt,
    createdAt: u.createdAt,
  }));

  return {
    kpis,
    pagination: {
      total,
      page: query.page,
      limit: query.limit,
      totalPages: Math.ceil(total / query.limit),
    },
    items,
  };
}

export async function getUserDetail(userId) {
  const user = await repo.findUserDetailById(userId);
  if (!user) {
    throw new AppError(404, 'USER_NOT_FOUND', 'Người dùng không tồn tại');
  }

  const permissions = user.role.permissions.map((rp) => rp.permission.code);
  const totalOrders = user.orders?.length ?? 0;

  return {
    id: user.id,
    userCode: `U-${user.id}`,
    fullName: user.fullName,
    email: user.email,
    phone: user.phone,
    isActive: user.isActive,
    isSystem: user.role.isSystem,
    role: user.role.code,
    roleName: user.role.name,
    permissions,
    totalOrders,
    createdAt: user.createdAt,
    lastLoginAt: user.lastLoginAt,
    loginHistory: user.loginHistory.map((h) => ({
      id: h.id,
      success: h.success,
      ip: h.ip,
      userAgent: h.userAgent,
      createdAt: h.createdAt,
    })),
  };
}

export async function toggleUserStatus(targetUserId, currentAdminId, payload) {
  if (targetUserId === currentAdminId && !payload.isActive) {
    throw new AppError(400, 'CANNOT_LOCK_SELF', 'Bạn không thể tự khóa tài khoản của chính mình');
  }

  const target = await repo.findUserDetailById(targetUserId);
  if (!target) {
    throw new AppError(404, 'USER_NOT_FOUND', 'Người dùng cần thao tác không tồn tại');
  }

  const updated = await repo.updateUserActiveStatus(targetUserId, payload.isActive);
  if (payload.isActive === false) {
    invalidateUserSessions(targetUserId);
  }
  return updated;
}

export async function getPendingChangeRequests() {
  const requests = await repo.findPendingChangeRequests();
  return requests.map((r) => ({
    id: r.id,
    requestCode: `R-${r.id}`,
    requestedById: r.requestedById,
    requesterName: r.requestedBy.fullName,
    requesterEmail: r.requestedBy.email,
    requesterRole: r.requestedBy.role.name,
    reason: r.reason,
    previous: r.previous,
    changes: r.changes,
    status: r.status,
    createdAt: r.createdAt,
  }));
}

export async function reviewChangeRequest(requestId, adminId, status, note) {
  const request = await repo.findChangeRequestById(requestId);
  if (!request) {
    throw new AppError(404, 'REQUEST_NOT_FOUND', 'Yêu cầu thay đổi không tồn tại');
  }

  if (request.status !== 'PENDING') {
    throw new AppError(400, 'REQUEST_ALREADY_PROCESSED', 'Yêu cầu này đã được xử lý trước đó');
  }

  if (status === 'APPROVED' && request.changes) {
    const changes = request.changes;
    if (changes.email) {
      const dup = await repo.findUserByEmail(changes.email);
      if (dup && dup.id !== request.requestedById) {
        throw new AppError(409, 'EMAIL_EXISTS', 'Email mới đã được đăng ký bởi tài khoản khác');
      }
    }
    if (changes.phone) {
      const dup = await repo.findUserByPhone(changes.phone);
      if (dup && dup.id !== request.requestedById) {
        throw new AppError(409, 'PHONE_EXISTS', 'Số điện thoại mới đã được đăng ký bởi tài khoản khác');
      }
    }
  }

  return repo.resolveChangeRequest({
    requestId,
    reviewedById: adminId,
    status,
    reviewNote: note,
    changes: request.changes,
    requestedUserId: request.requestedById,
  });
}

export async function getAccessAnalytics(query) {
  const startDate = new Date(Date.now() - query.days * 86400000);
  const logs = await repo.getLoginLogs(startDate, query.userId);

  const activeDaysSet = new Set();
  const weekdayHours = { CN: 0, T2: 0, T3: 0, T4: 0, T5: 0, T6: 0, T7: 0 };
  const weekdayNames = ['CN', 'T2', 'T3', 'T4', 'T5', 'T6', 'T7'];
  const hourBuckets = Array.from({ length: 24 }, (_, i) => ({ hour: i, count: 0 }));
  const userStatsMap = new Map();

  for (const log of logs) {
    const d = new Date(log.createdAt);
    const dateStr = d.toISOString().slice(0, 10);
    activeDaysSet.add(dateStr);

    const dayOfWeek = weekdayNames[d.getDay()];
    weekdayHours[dayOfWeek] = (weekdayHours[dayOfWeek] || 0) + 1;

    const hour = d.getHours();
    hourBuckets[hour].count += 1;

    if (log.userId && log.user) {
      const u = log.user;
      const cur = userStatsMap.get(log.userId) || {
        id: u.id,
        userCode: `U-${u.id}`,
        fullName: u.fullName,
        email: u.email,
        roleName: u.role.name,
        loginCount: 0,
        activeDays: new Set(),
      };
      cur.loginCount += 1;
      cur.activeDays.add(dateStr);
      userStatsMap.set(log.userId, cur);
    }
  }

  let peakHour = '09:00';
  let maxCount = -1;
  for (const b of hourBuckets) {
    if (b.count > maxCount) {
      maxCount = b.count;
      peakHour = `${String(b.hour).padStart(2, '0')}:00`;
    }
  }

  const topUsers = Array.from(userStatsMap.values())
    .map((u) => ({
      id: u.id,
      userCode: u.userCode,
      fullName: u.fullName,
      email: u.email,
      roleName: u.roleName,
      loginCount: u.loginCount,
      activeDaysCount: u.activeDays.size,
    }))
    .sort((a, b) => b.loginCount - a.loginCount)
    .slice(0, 10);

  return {
    daysConfigured: query.days,
    activeDaysCount: activeDaysSet.size,
    totalSessions: logs.length,
    peakHour,
    weekdayDistribution: weekdayHours,
    hourlyDistribution: hourBuckets,
    topUsers,
  };
}
