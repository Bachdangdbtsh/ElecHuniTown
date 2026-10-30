# Module `auth`, `account` & `role` (Xác thực, Tài khoản & Phân quyền) — UC_00 → UC_10

Tất cả API trả về chuẩn `{ "code": "success", "data": ... }` (khi thành công) hoặc `{ "code": "...", "message": "..." }` (khi lỗi).
Xác thực phiên qua HttpOnly Cookie (`token`) hoặc Header `Authorization: Bearer <token>`.

| Endpoint | Method | UC | Tham số / Body | Dữ liệu trả về (`data`) | Quyền hạn yêu cầu |
|---|---|---|---|---|---|
| `/auth/register` | POST | 00 | `fullName`, `email`, `password`, `confirmPassword`, `phone?` | `{ id, email, fullName }` | Public |
| `/auth/login` | POST | 01 | `email`, `password` | `{ token, user: { id, email, fullName, role, permissions, ... } }` | Public (Set cookie) |
| `/auth/logout` | POST | 02 | — | `{ message: "Đăng xuất thành công" }` | Public (Xóa cookie) |
| `/auth/forgot-password` | POST | 03 | `email` | `{ message, resetToken? }` | Public |
| `/auth/reset-password` | POST | 03 | `email`, `token`, `newPassword`, `confirmPassword` | `{ message }` | Public |
| `/auth/me` | GET | 04 | — | `{ id, email, fullName, phone, role, permissions, ... }` | Đăng nhập |
| `/auth/change-password` | POST | 05 | `currentPassword`, `newPassword`, `confirmPassword` | `{ message }` | Đăng nhập |
| `/recipients` | GET | 06 | — | `[{ id, recipientName, recipientPhone, address, recipientType, isDefault }]` | Đăng nhập (`Customer`) |
| `/recipients` | POST | 06 | `recipientName`, `recipientPhone`, `address`, `recipientType?`, `isDefault?` | Bản ghi `RecipientInfo` vừa tạo | Đăng nhập (`Customer`) |
| `/recipients/:id` | PUT | 06 | `recipientName?`, `recipientPhone?`, `address?`, `recipientType?`, `isDefault?` | Bản ghi `RecipientInfo` sau khi sửa | Đăng nhập (`Customer`) |
| `/recipients/:id/default` | PATCH | 06 | — | Bản ghi `RecipientInfo` đặt làm mặc định | Đăng nhập (`Customer`) |
| `/recipients/:id` | DELETE | 06 | — | `{ message: "Đã xóa địa chỉ thành công" }` | Đăng nhập (`Customer`) |
| `/account-change-requests` | POST | 04 | `reason`, `changes: { fullName?, email?, phone? }` | Bản ghi `AccountChangeRequest` (`PENDING`) | Đăng nhập |
| `/account-change-requests/mine` | GET | 04 | — | `[{ id, reason, previous, changes, status, createdAt, ... }]` | Đăng nhập |
| `/account-change-requests/profile` | PATCH | 04 | `fullName?`, `phone?` | `{ id, email, fullName, phone, updatedAt }` | Đăng nhập |
| `/admin/users` | POST | 07 | `fullName`, `email`, `phone?`, `roleCode`, `temporaryPassword` | `{ id, email, fullName, role, ... }` | `USER_CREATE_STAFF` (`Admin`) |
| `/admin/users` | GET | 09, 10 | `role?`, `status?` (active/locked/all), `search?`, `page`, `limit` | `{ kpis, pagination, items: [...] }` | `USER_VIEW` (`Admin`) |
| `/admin/users/:id` | GET | 09, 10 | — | Chi tiết người dùng kèm `loginHistory` (10 phiên gần nhất) | `USER_VIEW` (`Admin`) |
| `/admin/users/:id/status` | PATCH | 09, 10 | `isActive` (boolean), `reason?` | Bản ghi `User` sau cập nhật trạng thái | `USER_LOCK` (`Admin`) |
| `/admin/change-requests` | GET | 04 | — | Danh sách các yêu cầu đang chờ (`PENDING`) | `CHANGE_REQUEST_REVIEW` (`Admin`) |
| `/admin/change-requests/:id/review` | PATCH | 04 | `status` (APPROVED / REJECTED) | Bản ghi `AccountChangeRequest` sau khi duyệt | `CHANGE_REQUEST_REVIEW` (`Admin`) |
| `/admin/access-analytics` | GET | — | `days?` (mặc định 90), `userId?` | `{ activeDaysCount, totalSessions, peakHour, weekdayDistribution, hourlyDistribution, topUsers }` | `ACCESS_ANALYTICS_VIEW` (`Admin`) |
| `/roles/matrix` | GET | 08 | — | `{ roles: [...], permissionGroups: [...] }` | `ROLE_MANAGE` (`Admin`) |
| `/roles/:id/permissions` | PUT | 08 | `permissionIds: number[]` | Bản ghi `Role` kèm danh sách quyền mới | `ROLE_MANAGE` (`Admin`) |

## Quy ước nghiệp vụ
- **Tạo tài khoản Customer:** Tạo đồng thời bản ghi trong bảng `User` và `Customer` qua transaction. Mật khẩu băm `bcrypt` salt 10.
- **Đăng nhập & Điều hướng:** Một form đăng nhập chung duy nhất (`/login`). Sau khi đăng nhập, hệ thống dựa vào `role.code` để chuyển trang: `ADMIN` → `/admin/dashboard`, `STAFF` / `SHOP_OWNER` → `/statistics`, `CUSTOMER` → `/account/overview`.
- **Nhật ký truy cập (`LoginHistory`):** Ghi nhận tất cả lượt đăng nhập (kể cả khi sai thông tin, tài khoản bị khóa), lưu IP và User-Agent.
- **Sổ địa chỉ (`RecipientInfo`):** Mỗi khách hàng có tối đa 1 địa chỉ `isDefault = true`. Nếu tài khoản chỉ còn đúng 1 địa chỉ mặc định thì không cho phép xóa (bắt buộc thêm địa chỉ mới trước).
- **Yêu cầu đổi thông tin (`AccountChangeRequest`):** Người dùng gửi yêu cầu đổi thông tin nhạy cảm (SĐT, Email...). Hệ thống lưu snapshot `previous` và `changes`. Khi Admin chọn `APPROVED`, hệ thống tự động cập nhật sang bảng `User` qua transaction.
- **Khóa tài khoản:** Quản trị viên không được phép tự khóa tài khoản của chính mình (`Admin`).
- **Phân quyền vai trò:** Cập nhật quyền cho `Role` tự động ghi log kiểm toán vào `AdminManageRole`.

## Phân quyền & Tích hợp
Hệ thống sử dụng middleware `authenticate` tại `src/common/middleware/auth.js`. Khi xác thực thành công, middleware tự động gán:
```javascript
req.user = {
  id: user.id,
  email: user.email,
  fullName: user.fullName,
  role: user.role.code,
  permissions: ['STATISTIC_VIEW', 'USER_VIEW', ...]
};
```
Các module khác (như `statistic`, `inventory`) dùng `requirePermission(code)` hoặc kiểm tra trực tiếp qua `req.user.permissions.includes(code)`.

Mã quyền cốt lõi thuộc module:
- Tài khoản: `USER_VIEW`, `USER_CREATE_STAFF`, `USER_LOCK`, `CHANGE_REQUEST_REVIEW`
- Truy cập & Phân quyền: `ACCESS_ANALYTICS_VIEW`, `ROLE_MANAGE`

## Dữ liệu mẫu
Khởi tạo danh mục nhóm quyền, mã quyền, 4 vai trò chuẩn và tài khoản quản trị mặc định:
```bash
npm run db:seed
```
Tài khoản khởi tạo sẵn:
- **Quản trị viên (`ADMIN`):** `admin@elechunitown.vn` / `Admin@123`
- **Chủ ứng dụng (`SHOP_OWNER`):** `owner@elechunitown.vn` / `Owner@123`