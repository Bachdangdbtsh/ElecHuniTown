import { Router } from "express";
const router = Router();
import { prisma } from '../lib/prisma.js';

router.post("/", async (req, res) => {
  const featureProducts = await prisma.product.findMany({
    where: { is_Feature: true, status: 'ACTIVE' },
    include: {
      category: true,
      pictures: true,
      tags: true,
    },
    orderBy: { createdAt: 'desc' },
    take: 8,
  });
  const suggestProducts = await prisma.product.findMany({
    where: { status: 'ACTIVE' },
    include: {
      category: true,
      pictures: true,
      tags: true,
    },
    orderBy: { createdAt: 'asc' },
    take: 10,
  });
  res.json({
    code: "success",
    message: "Lấy thành công",
    featureProducts,
    suggestProducts,
  })
})

router.post("/header/category/list", async (req, res) => {
  try {
    const categories = await prisma.category.findMany({
      where: { status: "VISIBLE" },
      include: {
        parent: { select: { id: true, categoryName: true } },
        products: {
          where: { status: "ACTIVE" },        // chỉ lấy sản phẩm đang bán
          select: {
            id: true,
            productName: true,
            slug: true,
            oldPrice: true,
            newPrice: true,
            stock: true,
            is_Feature: true,
            pictures: { select: { link: true }, take: 1 },  // 1 ảnh đại diện
          },
          orderBy: { createdAt: "desc" },
          take: 8,                             // mỗi category tối đa 8 sp
        },
        _count: { select: { products: true } }, // tổng số sản phẩm
      },
      orderBy: { categoryName: "asc" },
    });

    res.json({ categories});
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
})

export default router;