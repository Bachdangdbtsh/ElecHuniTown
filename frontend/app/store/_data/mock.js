/** Dữ liệu mock UI — thay bằng API khi team đơn hàng/kho sẵn sàng */

export const PENDING_ORDERS = [
  {
    id: 'DH-1048',
    product: 'Điều hòa Panasonic 2 chiều 1HP',
    category: 'Điều hòa không khí',
    customer: 'Nguyễn Minh Anh',
    email: 'minhanh.nguyen@gmail.com',
    qty: 2,
    date: '28/09/2026 · 09:42',
    status: 'Chờ phê duyệt',
  },
  {
    id: 'DH-1047',
    product: 'Ấm siêu tốc WMF Stelio 1.7L',
    category: 'Bình siêu tốc',
    customer: 'Trần Hoàng Nam',
    email: 'hoangnam92@gmail.com',
    qty: 1,
    date: '28/09/2026 · 09:18',
    status: 'Chờ phê duyệt',
  },
  {
    id: 'DH-1046',
    product: 'Quạt cầm tay Turbo Mini',
    category: 'Quạt máy',
    customer: 'Lê Thu Hà',
    email: 'thuha.le@gmail.com',
    qty: 3,
    date: '28/09/2026 · 08:55',
    status: 'Chờ phê duyệt',
  },
  {
    id: 'DH-1045',
    product: 'Bếp từ Hafele HS-I281SL',
    category: 'Bếp điện',
    customer: 'Phạm Gia Huy',
    email: 'giahuy.pham@gmail.com',
    qty: 2,
    date: '27/09/2026 · 17:36',
    status: 'Chờ phê duyệt',
  },
  {
    id: 'DH-1044',
    product: 'Tủ lạnh Panasonic 50L',
    category: 'Tủ lạnh',
    customer: 'Vũ Ngọc Linh',
    email: 'ngoclinh.vu@gmail.com',
    qty: 1,
    date: '27/09/2026 · 16:20',
    status: 'Chờ phê duyệt',
  },
];

export const RETURNS = [
  {
    id: 'TH-301',
    product: 'Nồi cơm điện mini 1.8L',
    order: 'EHT-10231',
    customer: 'Nguyễn Văn A',
    reason: 'Sản phẩm bị móp khi nhận hàng',
    type: 'Đổi hàng',
    amount: '590.000đ',
    status: 'pending',
  },
  {
    id: 'TH-300',
    product: 'Máy sấy tóc Phillips',
    order: 'DH-10332',
    customer: 'Lê Thu Hà',
    reason: 'Không đúng màu đã đặt',
    type: 'Hoàn tiền',
    amount: '420.000đ',
    status: 'pending',
  },
  {
    id: 'TH-298',
    product: 'Bàn ủi hơi nước Pro',
    order: 'DH-1019',
    customer: 'Trần Hoàng Nam',
    reason: 'Lỗi không lên nguồn',
    type: 'Hoàn tiền',
    amount: '450.000đ',
    status: 'accepted',
  },
];

export const CATEGORIES = [
  { name: 'Điều hòa không khí', count: 1 },
  { name: 'Máy giặt', count: 1 },
  { name: 'Đồ dùng nhà bếp', count: 1 },
  { name: 'Tủ lạnh', count: 1 },
  { name: 'Quạt máy', count: 1 },
];

export const PRODUCTS = [
  { code: 'AC-1281', name: 'Điều hòa Inverter 1.5HP', category: 'Điều hòa không khí', price: '9.490.000đ', visible: true },
  { code: 'WH-8967', name: 'Máy giặt cửa trước 9kg', category: 'Máy giặt', price: '7.990.000đ', visible: true },
  { code: 'KT-3381', name: 'Nồi chiên không dầu 5.5L', category: 'Đồ dùng nhà bếp', price: '1.690.000đ', visible: true },
  { code: 'RF-8450', name: 'Tủ lạnh Panasonic 50L', category: 'Tủ lạnh', price: '2.390.000đ', visible: true },
  { code: 'FN-8302', name: 'Quạt cầm tay Turbo Mini', category: 'Quạt máy', price: '159.000đ', visible: false },
];

export const INVENTORY = [
  { code: 'AC-1281', name: 'Điều hòa Inverter 1.5HP', stock: 42, status: 'Còn hàng' },
  { code: 'WH-8967', name: 'Máy giặt cửa trước 9kg', stock: 18, status: 'Còn hàng' },
  { code: 'KT-3381', name: 'Nồi chiên không dầu 5.5L', stock: 120, status: 'Còn hàng' },
  { code: 'RF-8450', name: 'Tủ lạnh Panasonic 50L', stock: 6, status: 'Sắp hết' },
  { code: 'FN-8302', name: 'Quạt cầm tay Turbo Mini', stock: 0, status: 'Hết hàng' },
];

export const FINANCE = {
  revenue: '1,28 tỷ',
  revenueDelta: '+12,4% so với T8',
  orders: '2.418',
  refund: '12,6 triệu',
  refundRate: '0,98% doanh thu',
  months: [
    { label: 'T4', value: 0.82 },
    { label: 'T5', value: 0.94 },
    { label: 'T6', value: 1.05 },
    { label: 'T7', value: 0.98 },
    { label: 'T8', value: 1.14 },
    { label: 'T9', value: 1.28 },
  ],
  byCategory: [
    { name: 'Đồ dùng nhà bếp', pct: 38 },
    { name: 'Điều hòa không khí', pct: 24 },
    { name: 'Máy giặt', pct: 18 },
    { name: 'TV & Âm thanh', pct: 12 },
    { name: 'Gia dụng nhỏ', pct: 8 },
  ],
};
