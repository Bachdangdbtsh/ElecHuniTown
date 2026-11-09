/**
 * In-memory session invalidation (single-instance MVP).
 * Khi user đổi / reset mật khẩu, mọi JWT phát hành trước thời điểm này bị từ chối.
 * Production multi-instance: chuyển Redis hoặc cột tokenVersion trên User (Chặng 6).
 */

/** @type {Map<number, number>} userId -> invalidatedAt (unix ms) */
const invalidatedAt = new Map();

export function invalidateUserSessions(userId) {
  invalidatedAt.set(Number(userId), Date.now());
}

/**
 * @param {number} userId
 * @param {number} tokenIat - JWT iat (seconds since epoch)
 * @returns {boolean} true nếu token đã bị thu hồi
 */
export function isSessionInvalidated(userId, tokenIat) {
  const at = invalidatedAt.get(Number(userId));
  if (!at) return false;
  // iat là giây; so sánh với ms
  const issuedAtMs = Number(tokenIat) * 1000;
  return issuedAtMs < at;
}
