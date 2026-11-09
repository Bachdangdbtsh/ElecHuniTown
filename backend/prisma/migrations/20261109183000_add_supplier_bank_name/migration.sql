ALTER TABLE "Supplier"
ADD COLUMN "bankName" TEXT;

INSERT INTO "RolePermission" ("roleId", "permissionId")
SELECT role."id", permission."id"
FROM "Role" AS role
JOIN "Permission" AS permission ON permission."code" = 'SUPPLIER_MANAGE'
WHERE role."code" = 'STAFF'
ON CONFLICT ("roleId", "permissionId") DO NOTHING;
