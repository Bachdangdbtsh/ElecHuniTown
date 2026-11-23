-- Đồng bộ database với schema.prisma: bổ sung các cột/bảng còn thiếu so với migration trước.
-- Gồm: Order.transactionID, User.avatar và hai bảng giỏ hàng Cart / CartItem.

-- AlterTable
ALTER TABLE "Order" ADD COLUMN IF NOT EXISTS "transactionID" TEXT;

-- AlterTable
ALTER TABLE "User" ADD COLUMN IF NOT EXISTS "avatar" TEXT;

-- CreateTable
CREATE TABLE IF NOT EXISTS "Cart" (
    "id" SERIAL NOT NULL,
    "customerId" INTEGER NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Cart_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE IF NOT EXISTS "CartItem" (
    "id" SERIAL NOT NULL,
    "cartId" INTEGER NOT NULL,
    "productId" INTEGER NOT NULL,
    "quantity" INTEGER NOT NULL DEFAULT 1,

    CONSTRAINT "CartItem_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX IF NOT EXISTS "Cart_customerId_key" ON "Cart"("customerId");

-- CreateIndex
CREATE UNIQUE INDEX IF NOT EXISTS "CartItem_cartId_productId_key" ON "CartItem"("cartId", "productId");

-- AddForeignKey
DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'Cart_customerId_fkey') THEN
    ALTER TABLE "Cart" ADD CONSTRAINT "Cart_customerId_fkey" FOREIGN KEY ("customerId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
  END IF;
END $$;

-- AddForeignKey
DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'CartItem_cartId_fkey') THEN
    ALTER TABLE "CartItem" ADD CONSTRAINT "CartItem_cartId_fkey" FOREIGN KEY ("cartId") REFERENCES "Cart"("id") ON DELETE CASCADE ON UPDATE CASCADE;
  END IF;
END $$;

-- AddForeignKey
DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'CartItem_productId_fkey') THEN
    ALTER TABLE "CartItem" ADD CONSTRAINT "CartItem_productId_fkey" FOREIGN KEY ("productId") REFERENCES "Product"("id") ON DELETE CASCADE ON UPDATE CASCADE;
  END IF;
END $$;
