-- Restore the permission record itself when it is absent from an existing database.
INSERT INTO "Permission" ("code", "name", "groupId")
SELECT 'STOCK_ISSUE_APPROVE', 'Phê duyệt phiếu xuất kho', "id"
FROM "PermissionGroup"
WHERE "code" = 'INVENTORY_SUPPLIER'
ON CONFLICT ("code") DO NOTHING;

INSERT INTO "RolePermission" ("roleId", "permissionId")
SELECT role.id, permission.id
FROM "Role" AS role
CROSS JOIN "Permission" AS permission
WHERE role.code = 'SHOP_OWNER'
  AND permission.code = 'STOCK_ISSUE_APPROVE'
ON CONFLICT ("roleId", "permissionId") DO NOTHING;
