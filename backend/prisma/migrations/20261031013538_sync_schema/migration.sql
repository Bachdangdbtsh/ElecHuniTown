-- AlterTable
ALTER TABLE "Category" ADD COLUMN     "imageUrl" TEXT,
ADD COLUMN     "parentID" INTEGER;

-- AlterTable
ALTER TABLE "Order" ADD COLUMN     "note" TEXT,
ADD COLUMN     "paymentMethod" TEXT,
ADD COLUMN     "paymentMethodStatus" BOOLEAN NOT NULL DEFAULT false;

-- CreateTable
CREATE TABLE "Customer" (
    "userId" INTEGER NOT NULL,

    CONSTRAINT "Customer_pkey" PRIMARY KEY ("userId")
);

-- CreateTable
CREATE TABLE "Staff" (
    "userId" INTEGER NOT NULL,

    CONSTRAINT "Staff_pkey" PRIMARY KEY ("userId")
);

-- CreateTable
CREATE TABLE "ShopOwner" (
    "userId" INTEGER NOT NULL,

    CONSTRAINT "ShopOwner_pkey" PRIMARY KEY ("userId")
);

-- CreateTable
CREATE TABLE "Admin" (
    "userId" INTEGER NOT NULL,

    CONSTRAINT "Admin_pkey" PRIMARY KEY ("userId")
);

-- CreateTable
CREATE TABLE "AdminManageRole" (
    "id" SERIAL NOT NULL,
    "adminId" INTEGER NOT NULL,
    "roleId" INTEGER NOT NULL,
    "type" TEXT NOT NULL,
    "at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "AdminManageRole_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Comment" (
    "id" SERIAL NOT NULL,
    "productId" INTEGER NOT NULL,
    "userId" INTEGER NOT NULL,
    "content" TEXT NOT NULL,
    "rating" INTEGER,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Comment_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "StaffManageProduct" (
    "id" SERIAL NOT NULL,
    "staffId" INTEGER NOT NULL,
    "productId" INTEGER NOT NULL,
    "type" TEXT NOT NULL,
    "at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "StaffManageProduct_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "StaffManageCategory" (
    "id" SERIAL NOT NULL,
    "staffId" INTEGER NOT NULL,
    "categoryId" INTEGER NOT NULL,
    "type" TEXT NOT NULL,
    "at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "StaffManageCategory_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "AdminManageRole_adminId_idx" ON "AdminManageRole"("adminId");

-- CreateIndex
CREATE INDEX "AdminManageRole_roleId_idx" ON "AdminManageRole"("roleId");

-- CreateIndex
CREATE INDEX "StaffManageProduct_staffId_idx" ON "StaffManageProduct"("staffId");

-- CreateIndex
CREATE INDEX "StaffManageProduct_productId_idx" ON "StaffManageProduct"("productId");

-- CreateIndex
CREATE INDEX "StaffManageCategory_staffId_idx" ON "StaffManageCategory"("staffId");

-- CreateIndex
CREATE INDEX "StaffManageCategory_categoryId_idx" ON "StaffManageCategory"("categoryId");

-- CreateIndex
CREATE INDEX "Category_parentID_idx" ON "Category"("parentID");

-- AddForeignKey
ALTER TABLE "Customer" ADD CONSTRAINT "Customer_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Staff" ADD CONSTRAINT "Staff_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ShopOwner" ADD CONSTRAINT "ShopOwner_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Admin" ADD CONSTRAINT "Admin_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AdminManageRole" ADD CONSTRAINT "AdminManageRole_adminId_fkey" FOREIGN KEY ("adminId") REFERENCES "Admin"("userId") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AdminManageRole" ADD CONSTRAINT "AdminManageRole_roleId_fkey" FOREIGN KEY ("roleId") REFERENCES "Role"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Comment" ADD CONSTRAINT "Comment_productId_fkey" FOREIGN KEY ("productId") REFERENCES "Product"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Comment" ADD CONSTRAINT "Comment_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "StaffManageProduct" ADD CONSTRAINT "StaffManageProduct_staffId_fkey" FOREIGN KEY ("staffId") REFERENCES "Staff"("userId") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "StaffManageProduct" ADD CONSTRAINT "StaffManageProduct_productId_fkey" FOREIGN KEY ("productId") REFERENCES "Product"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "StaffManageCategory" ADD CONSTRAINT "StaffManageCategory_staffId_fkey" FOREIGN KEY ("staffId") REFERENCES "Staff"("userId") ON DELETE RESTRICT ON UPDATE CASCADE;
