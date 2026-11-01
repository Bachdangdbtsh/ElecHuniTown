import { prisma } from '../../lib/prisma.js';
import * as inventoryRepository from './InventoryRepository.js';
import { AppError } from '../../common/error/AppError.js';

export async function getReceipt(receiptID) {
    const doc = await inventoryRepository.getReceiptByID(
        prisma,
        receiptID
    )

    if (!doc) {
        throw new AppError(404, 'NOT_FOUND', 'KHONG TIM THAY PHIEU NHAP NAO!')
    }
    return doc
}

export async function listReceipts(query) {
    return inventoryRepository.findReceipts(prisma, query)
}  