ALTER TABLE "Order" ADD COLUMN "shippedAt" TIMESTAMP(3);

-- Preserve the actual SHIPPING transition time for orders already in transit.
UPDATE "Order" AS o
SET "shippedAt" = COALESCE(
  (SELECT MAX(a."createdAt") FROM "AuditLog" AS a
   WHERE a."entityType" = 'Order' AND a."entityId" = o.id
     AND a.details->>'to' = 'SHIPPING'),
  o."orderDate"
)
WHERE o.status = 'SHIPPING';

CREATE INDEX "Order_status_shippedAt_idx" ON "Order"("status", "shippedAt");
