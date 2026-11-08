import { prisma } from '../../lib/prisma.js';

export async function findRecipientsByCustomerId(customerId) {
  return prisma.recipientInfo.findMany({
    where: { customerId },
    orderBy: [
      { isDefault: 'desc' },
      { id: 'desc' },
    ],
  });
}

export async function findRecipientByIdAndCustomerId(id, customerId) {
  return prisma.recipientInfo.findFirst({
    where: {
      id,
      customerId,
    },
  });
}

export async function countRecipientsByCustomerId(customerId) {
  return prisma.recipientInfo.count({
    where: { customerId },
  });
}

export async function createRecipient(customerId, data) {
  return prisma.$transaction(async (tx) => {
    const count = await tx.recipientInfo.count({ where: { customerId } });
    const shouldBeDefault = data.isDefault || count === 0;

    if (shouldBeDefault) {
      await tx.recipientInfo.updateMany({
        where: { customerId, isDefault: true },
        data: { isDefault: false },
      });
    }

    return tx.recipientInfo.create({
      data: {
        customerId,
        recipientName: data.recipientName,
        recipientPhoneNumber: data.recipientPhoneNumber,
        address: data.address,
        recipientType: data.recipientType || null,
        isDefault: shouldBeDefault,
      },
    });
  });
}

export async function updateRecipient(id, customerId, data) {
  return prisma.$transaction(async (tx) => {
    if (data.isDefault) {
      await tx.recipientInfo.updateMany({
        where: { customerId, isDefault: true },
        data: { isDefault: false },
      });
    }

    return tx.recipientInfo.update({
      where: { id },
      data,
    });
  });
}

export async function setDefaultRecipient(id, customerId) {
  return prisma.$transaction(async (tx) => {
    await tx.recipientInfo.updateMany({
      where: { customerId, isDefault: true },
      data: { isDefault: false },
    });

    return tx.recipientInfo.update({
      where: { id },
      data: { isDefault: true },
    });
  });
}

export async function deleteRecipient(id) {
  return prisma.recipientInfo.delete({
    where: { id },
  });
}