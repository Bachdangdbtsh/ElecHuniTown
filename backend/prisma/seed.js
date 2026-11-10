import bcrypt from 'bcrypt';
import { prisma } from '../src/lib/prisma.js';

const PERMISSION_GROUPS = [
  {
    code: 'AUTH_ACCOUNT',
    name: 'Quản lý tài khoản & Xác thực',
    permissions: [
      { code: 'USER_VIEW', name: 'Xem danh sách và chi tiết người dùng' },
      { code: 'USER_CREATE_STAFF', name: 'Tạo tài khoản nhân viên hoặc chủ cửa hàng' },
      { code: 'USER_LOCK', name: 'Khóa hoặc mở khóa tài khoản người dùng' },
      { code: 'CHANGE_REQUEST_REVIEW', name: 'Duyệt hoặc từ chối yêu cầu đổi thông tin' },
      { code: 'ACCESS_ANALYTICS_VIEW', name: 'Xem thống kê và lịch sử truy cập' },
      { code: 'ROLE_MANAGE', name: 'Quản lý vai trò và phân bổ quyền hạn' },
    ],
  },
  {
    code: 'CATALOG_PRODUCT',
    name: 'Quản lý danh mục & Sản phẩm',
    permissions: [
      { code: 'CATEGORY_MANAGE', name: 'Quản lý danh mục sản phẩm' },
      { code: 'PRODUCT_MANAGE', name: 'Quản lý thông tin và giá sản phẩm' },
    ],
  },
  {
    code: 'ORDER_SALES',
    name: 'Tiếp nhận & Xử lý đơn hàng',
    permissions: [
      { code: 'ORDER_VIEW', name: 'Xem danh sách và chi tiết đơn hàng' },
      { code: 'ORDER_PROCESS', name: 'Xác nhận hoặc từ chối đơn hàng' },
    ],
  },
  {
    code: 'INVENTORY_SUPPLIER',
    name: 'Quản lý kho & Nhà cung cấp',
    permissions: [
      { code: 'INVENTORY_VIEW', name: 'Xem tồn kho và biến động kho' },
      { code: 'STOCK_RECEIPT_CREATE', name: 'Tạo phiếu nhập kho' },
      { code: 'STOCK_RECEIPT_APPROVE', name: 'Phê duyệt phiếu nhập kho' },
      { code: 'STOCK_ISSUE_CREATE', name: 'Tạo phiếu xuất kho' },
      { code: 'STOCK_ISSUE_MANAGE', name: 'Lập và quản lý phiếu xuất kho' },
      { code: 'STOCK_ISSUE_APPROVE', name: 'Phê duyệt phiếu xuất kho' },
      { code: 'SUPPLIER_MANAGE', name: 'Quản lý thông tin nhà cung cấp' },
      { code: 'RETURN_MANAGE', name: 'Xem và xét duyệt đổi trả hoàn tiền' },
    ],
  },
  {
    code: 'STATISTIC_REPORT',
    name: 'Thống kê & Báo cáo',
    permissions: [
      { code: 'STATISTIC_VIEW', name: 'Xem bảng điều khiển và biểu đồ thống kê' },
      { code: 'STATISTIC_EXPORT', name: 'Xuất dữ liệu thống kê ra file Excel' },
    ],
  },
];

const ROLES = [
  {
    code: 'ADMIN',
    name: 'Quản trị viên',
    description: 'Quản trị hệ thống, tài khoản, phân quyền và kiểm soát an toàn',
    isSystem: true,
  },
  {
    code: 'SHOP_OWNER',
    name: 'Chủ ứng dụng',
    description: 'Chủ cửa hàng theo dõi toàn bộ hoạt động kinh doanh và phê duyệt kho',
    isSystem: true,
  },
  {
    code: 'STAFF',
    name: 'Nhân viên',
    description: 'Nhân viên vận hành xử lý đơn hàng, danh mục và lập phiếu kho',
    isSystem: true,
  },
  {
    code: 'CUSTOMER',
    name: 'Khách hàng',
    description: 'Khách hàng mua sắm và quản lý tài khoản cá nhân',
    isSystem: true,
  },
];

async function main() {
  const permMap = new Map();

  for (const g of PERMISSION_GROUPS) {
    const group = await prisma.permissionGroup.upsert({
      where: { code: g.code },
      update: { name: g.name },
      create: { code: g.code, name: g.name },
    });

    for (const p of g.permissions) {
      const perm = await prisma.permission.upsert({
        where: { code: p.code },
        update: { name: p.name, groupId: group.id },
        create: { code: p.code, name: p.name, groupId: group.id },
      });
      permMap.set(p.code, perm.id);
    }
  }

  const roleMap = new Map();
  for (const r of ROLES) {
    const role = await prisma.role.upsert({
      where: { code: r.code },
      update: { name: r.name, description: r.description, isSystem: r.isSystem },
      create: { code: r.code, name: r.name, description: r.description, isSystem: r.isSystem },
    });
    roleMap.set(r.code, role.id);
  }

  const allPermIds = Array.from(permMap.values());
  const adminRoleId = roleMap.get('ADMIN');
  for (const permId of allPermIds) {
    await prisma.rolePermission.upsert({
      where: {
        roleId_permissionId: {
          roleId: adminRoleId,
          permissionId: permId,
        },
      },
      update: {},
      create: {
        roleId: adminRoleId,
        permissionId: permId,
      },
    });
  }

  const staffPermCodes = [
    'ORDER_VIEW',
    'ORDER_PROCESS',
    'CATEGORY_MANAGE',
    'PRODUCT_MANAGE',
    'INVENTORY_VIEW',
    'STOCK_RECEIPT_CREATE',
    'STOCK_ISSUE_CREATE',
    'STOCK_ISSUE_MANAGE',
    'SUPPLIER_MANAGE',
    'STATISTIC_VIEW',
  ];
  const staffRoleId = roleMap.get('STAFF');
  for (const code of staffPermCodes) {
    const pId = permMap.get(code);
    if (!pId) continue;
    await prisma.rolePermission.upsert({
      where: {
        roleId_permissionId: {
          roleId: staffRoleId,
          permissionId: pId,
        },
      },
      update: {},
      create: {
        roleId: staffRoleId,
        permissionId: pId,
      },
    });
  }

  const shopOwnerPermCodes = [
    'ORDER_VIEW',
    'ORDER_PROCESS',
    'CATEGORY_MANAGE',
    'PRODUCT_MANAGE',
    'INVENTORY_VIEW',
    'STOCK_RECEIPT_CREATE',
    'STOCK_RECEIPT_APPROVE',
    'STOCK_ISSUE_CREATE',
    'STOCK_ISSUE_APPROVE',
    'STOCK_ISSUE_MANAGE',
    'SUPPLIER_MANAGE',
    'RETURN_MANAGE',
    'STATISTIC_VIEW',
    'STATISTIC_EXPORT',
  ];
  const shopOwnerRoleId = roleMap.get('SHOP_OWNER');
  for (const code of shopOwnerPermCodes) {
    const pId = permMap.get(code);
    if (!pId) continue;
    await prisma.rolePermission.upsert({
      where: {
        roleId_permissionId: {
          roleId: shopOwnerRoleId,
          permissionId: pId,
        },
      },
      update: {},
      create: {
        roleId: shopOwnerRoleId,
        permissionId: pId,
      },
    });
  }

  const adminEmail = 'admin@elechunitown.vn';
  const existingAdmin = await prisma.user.findUnique({
    where: { email: adminEmail },
  });

  if (!existingAdmin) {
    const passwordHash = await bcrypt.hash('Admin@123', 10);
    const user = await prisma.user.create({
      data: {
        email: adminEmail,
        passwordHash,
        fullName: 'Lê Văn C',
        phone: '+84905556677',
        roleId: adminRoleId,
        isActive: true,
      },
    });

    await prisma.admin.create({
      data: {
        userId: user.id,
      },
    });
  }

  const adminUsers = await prisma.user.findMany({
    where: { roleId: adminRoleId },
    select: { id: true },
  });
  for (const adminUser of adminUsers) {
    await prisma.admin.upsert({
      where: { userId: adminUser.id },
      update: {},
      create: { userId: adminUser.id },
    });
  }

  const ownerEmail = 'owner@elechunitown.vn';
  const existingOwner = await prisma.user.findUnique({
    where: { email: ownerEmail },
  });

  if (!existingOwner) {
    const passwordHash = await bcrypt.hash('Owner@123', 10);
    const user = await prisma.user.create({
      data: {
        email: ownerEmail,
        passwordHash,
        fullName: 'Đặng Quốc Huy',
        phone: '+84900000001',
        roleId: shopOwnerRoleId,
        isActive: true,
      },
    });

    await prisma.shopOwner.create({
      data: {
        userId: user.id,
      },
    });
  }
}

main()
  .catch((e) => {
    console.error(e);
    process.exitCode = 1;
  })
  .finally(() => prisma.$disconnect());
