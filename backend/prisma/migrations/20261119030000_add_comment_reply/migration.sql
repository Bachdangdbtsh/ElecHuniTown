-- Phản hồi đánh giá sản phẩm của khách hàng (Staff, Shop Owner).
ALTER TABLE "Comment"
    ADD COLUMN "reply" TEXT,
    ADD COLUMN "repliedAt" TIMESTAMP(3),
    ADD COLUMN "repliedById" INTEGER;

-- AddForeignKey
ALTER TABLE "Comment" ADD CONSTRAINT "Comment_repliedById_fkey" FOREIGN KEY ("repliedById") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;
