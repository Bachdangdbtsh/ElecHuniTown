/**
 * Trang "nhà" theo role khi bấm icon tài khoản.
 * Login luôn về `/` (trang chủ shop).
 */
export function accountHomeByRole(role) {
  const code = typeof role === 'string' ? role : role?.code || '';
  if (code === 'ADMIN') return '/admin/dashboard';
  if (code === 'SHOP_OWNER' || code === 'STAFF') return '/store/orders';
  return '/account/overview';
}

export function roleLabel(role) {
  const code = typeof role === 'string' ? role : role?.code || '';
  const map = {
    ADMIN: 'Quản trị viên',
    SHOP_OWNER: 'Chủ cửa hàng',
    STAFF: 'Nhân viên',
    CUSTOMER: 'Khách hàng',
  };
  return map[code] || code || 'Người dùng';
}
