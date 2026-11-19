import { prisma } from '../lib/prisma.js';

// Only server code can create notifications. Never accept a recipient from a public request.
export async function notify({ userId, role, type, message, url, payload }, db = prisma) {
  if (!userId) return null;
  return db.notification.create({
    data: { userId, role, type, message, url, payload },
  });
}
