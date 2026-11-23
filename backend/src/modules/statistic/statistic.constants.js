// Các hằng số dùng chung cho module thống kê.
// Nếu nhóm đổi quy ước (trạng thái đơn, mã vai trò, múi giờ) thì chỉ cần sửa ở đây.

export const TZ = 'Asia/Ho_Chi_Minh';
export const TZ_OFFSET = '+07:00'; // Việt Nam không có giờ mùa hè

// Chỉ đơn ở trạng thái này mới được tính vào doanh thu / số lượng bán.
export const COUNTED_ORDER_STATUS = 'DELIVERED';

// Mã vai trò của khách hàng trong bảng Role (dùng để đếm "khách hàng mới").
export const CUSTOMER_ROLE_CODE = 'CUSTOMER';

// Khoảng thời gian tối đa của một lần thống kê (ngày). Chặn request đòi khoảng quá lớn
// để biểu đồ/báo cáo Excel không phải dựng hàng chục nghìn mốc.
export const MAX_RANGE_DAYS = 366;

// Mã quyền (phân quyền theo mã quyền, không theo tên vai trò - theo README).
export const PERMISSIONS = {
  VIEW: 'STATISTIC_VIEW',
  EXPORT: 'STATISTIC_EXPORT',
};
