import { AppError } from '../../common/error/AppError.js';
import * as repo from './recipient.repository.js';

export async function getAddresses(customerId) {
  return repo.findRecipientsByCustomerId(customerId);
}

export async function addAddress(customerId, payload) {
  return repo.createRecipient(customerId, payload);
}

export async function editAddress(id, customerId, payload) {
  const existing = await repo.findRecipientByIdAndCustomerId(id, customerId);
  if (!existing) {
    throw new AppError(404, 'ADDRESS_NOT_FOUND', 'Địa chỉ giao hàng không tồn tại hoặc không thuộc quyền sở hữu của bạn');
  }

  return repo.updateRecipient(id, customerId, payload);
}

export async function setAsDefault(id, customerId) {
  const existing = await repo.findRecipientByIdAndCustomerId(id, customerId);
  if (!existing) {
    throw new AppError(404, 'ADDRESS_NOT_FOUND', 'Địa chỉ giao hàng không tồn tại hoặc không thuộc quyền sở hữu của bạn');
  }

  return repo.setDefaultRecipient(id, customerId);
}

export async function removeAddress(id, customerId) {
  const existing = await repo.findRecipientByIdAndCustomerId(id, customerId);
  if (!existing) {
    throw new AppError(404, 'ADDRESS_NOT_FOUND', 'Địa chỉ giao hàng không tồn tại hoặc không thuộc quyền sở hữu của bạn');
  }

  const total = await repo.countRecipientsByCustomerId(customerId);
  if (existing.isDefault && total === 1) {
    throw new AppError(
      400,
      'CANNOT_DELETE_ONLY_DEFAULT_ADDRESS',
      'Không thể xóa địa chỉ mặc định duy nhất. Vui lòng thêm một địa chỉ khác trước khi xóa địa chỉ này',
    );
  }

  await repo.deleteRecipient(id);

  if (existing.isDefault && total > 1) {
    const remainings = await repo.findRecipientsByCustomerId(customerId);
    if (remainings.length > 0) {
      await repo.setDefaultRecipient(remainings[0].id, customerId);
    }
  }

  return { message: 'Đã xóa địa chỉ thành công' };
}