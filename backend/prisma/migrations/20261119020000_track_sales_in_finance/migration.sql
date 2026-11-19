CREATE TABLE "FinanceMovement" (
    "id" SERIAL NOT NULL,
    "orderId" INTEGER NOT NULL,
    "kind" TEXT NOT NULL,
    "amount" BIGINT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "FinanceMovement_pkey" PRIMARY KEY ("id"),
    CONSTRAINT "FinanceMovement_kind_check" CHECK ("kind" IN ('SALE', 'REFUND'))
);

CREATE UNIQUE INDEX "FinanceMovement_orderId_kind_key" ON "FinanceMovement"("orderId", "kind");
CREATE INDEX "FinanceMovement_createdAt_idx" ON "FinanceMovement"("createdAt");
ALTER TABLE "FinanceMovement" ADD CONSTRAINT "FinanceMovement_orderId_fkey" FOREIGN KEY ("orderId") REFERENCES "Order"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- VNPay is received at payment confirmation; cash on delivery is received at delivery.
INSERT INTO "FinanceMovement" ("orderId", "kind", "amount", "createdAt")
SELECT o."id", 'SALE', o."totalCost", o."orderDate"
FROM "Order" o
WHERE (o."paymentMethod" = 'bank' AND o."paymentMethodStatus" = true)
   OR (o."paymentMethod" = 'money' AND o."status" = 'DELIVERED');

INSERT INTO "FinanceMovement" ("orderId", "kind", "amount", "createdAt")
SELECT r."orderId", 'REFUND', r."refundAmount", COALESCE(r."refundedAt", r."createdAt")
FROM "ReturnRequest" r
JOIN "FinanceMovement" m ON m."orderId" = r."orderId" AND m."kind" = 'SALE'
WHERE r."status" = 'REFUNDED' AND r."refundAmount" > 0;

UPDATE "Finance"
SET "cashBalance" = "cashBalance" + COALESCE((
    SELECT SUM(CASE WHEN "kind" = 'SALE' THEN "amount" ELSE -"amount" END)
    FROM "FinanceMovement"
), 0),
"updatedAt" = CURRENT_TIMESTAMP
WHERE "id" = 1;
