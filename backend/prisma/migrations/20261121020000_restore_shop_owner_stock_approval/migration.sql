-- Restore the stock approval permissions expected by the Shop Owner workflow.
-- The role may have been configured before these permissions were added to seed data.
INSERT INTO "RolePermission" ("roleId", "permissionId")
SELECT role.id, permission.id
FROM "Role" AS role
CROSS JOIN "Permission" AS permission
WHERE role.code = 'SHOP_OWNER'
  AND permission.code IN ('STOCK_RECEIPT_APPROVE', 'STOCK_ISSUE_APPROVE')
ON CONFLICT ("roleId", "permissionId") DO NOTHING;
