import { Router } from "express";
const router = Router();
import { prisma } from '../lib/prisma.js';

router.post("/", async (req, res) => {
  try {
    const productInclude = {
      category: { select: { id: true, name: true, slug: true, imageUrl: true } },
      pictures: { select: { url: true } },
      tags: { select: { tag: true } },
    };
    const [featureProducts, suggestProducts] = await Promise.all([
      prisma.product.findMany({
        where: { isFeature: true, status: "ACTIVE" },
        include: productInclude,
        orderBy: { createdAt: "desc" },
        take: 8,
      }),
      prisma.product.findMany({
        where: { status: "ACTIVE" },
        include: productInclude,
        orderBy: { createdAt: "asc" },
        take: 10,
      }),
    ]);

    res.json({
      code: "success",
      message: "Lấy thành công",
      featureProducts,
      suggestProducts,
    });
  } catch (err) {
    res.status(500).json({ code: "error", message: err.message });
  }
})

// src/utils/categoryTree.js
function buildCategoryTree(rows, parentID = null) {
  return rows
    .filter((r) => r.parentID === parentID)
    .map((r) => {
      const { parentID, ...rest } = r;
      return { ...rest, children: buildCategoryTree(rows, r.id) };
    });
}

router.post("/header/category/list", async (req, res) => {
  try {
    const rows = await prisma.category.findMany({
      where: { isActive: true },
      orderBy: { name: "asc" },
      include: {
        _count: { select: { products: true } },
        products: {
          where: { status: "ACTIVE" },
          select: {
            id: true,
            productName: true,
            slug: true,
            oldPrice: true,
            newPrice: true,
            stock: true,
            isFeature: true,
            pictures: { select: { url: true }, take: 1 },
          },
          orderBy: { createdAt: "desc" },
          take: 8,
        },
      },
    });
    const categories = buildCategoryTree(rows);

    res.json({ code: "success", categories });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.post("/category/:id", async (req, res) => {
  try {
    const id = Number(req.params.id);
    console.log(id);
    if (!Number.isInteger(id)) {
      return res.status(400).json({
        code: "error",
        message: "ID danh mục không hợp lệ",
      });
    }
    const child = await prisma.category.findUnique({
      where: { id },
    });

    if (!child) {
      return res.status(404).json({ code: "error", message: "Không tìm thấy category" });
    }

    const productList = await prisma.product.findMany({
      where: {
        categoryId: id,
        status: "ACTIVE",
      },
      include: {
        category: { select: { id: true, name: true, slug: true } },
        pictures: { select: { url: true } },
        tags: { select: { tag: true } },
      },
      orderBy: { createdAt: "desc" },
    });
    const parent = child.parentID === null ? null : await prisma.category.findUnique({
      where: { id: child.parentID },
      select: { id: true, name: true, slug: true, imageUrl: true, parentID: true },
    });
    if (productList.length === 0) {
      return res.status(404).json({
        code: "error",
        message: "Không tìm thấy sản phẩm nào cho danh mục này",
        productList: [],
      });
    }

    return res.status(200).json({
      code: "success",
      message: "Lấy sản phẩm thành công",
      count: productList.length,
      parent,
      productList,
      category: child,
    });
  } catch (error) {
    console.error("Lỗi khi lấy danh sách sản phẩm:", error);
    return res.status(500).json({
      code: "error",
      message: "Lỗi server nội bộ",
      error: error.message,
    });
  }
});

router.post("/product/detail/:id", async (req, res) => {
  try {
    const id = Number(req.params.id);
    console.log(id);
    if (!Number.isInteger(id)) {
      return res.status(400).json({
        code: "error",
        message: "ID sản phẩm không hợp lệ",
      });
    }
    const product = await prisma.product.findUnique({
      where: { id },
      include: {
        category: { select: { id: true, name: true } },
        pictures: true,
        Comment: {
          where: { isActive: true },
          include: {
            User: {
              select: { id: true, fullName: true },
            },
          },
          orderBy: { createdAt: "desc" },
        }
      }
    });

    if (!product) {
      return res.status(404).json({ code: "error", message: "Không tìm thấy sản phẩm" });
    }

    return res.status(200).json({
      code: "success",
      message: "Lấy sản phẩm thành công",
      product,
    });
  } catch (error) {
    console.error("Lỗi khi lấy danh sách sản phẩm:", error);
    return res.status(500).json({
      code: "error",
      message: "Lỗi server nội bộ",
      error: error.message,
    });
  }
});

router.post("/cart/add", async (req, res) => {
  try {
    console.log("[cart/add] Body:", req.body);

    const { productID, quantity } = req.body ?? {};
    if(quantity<=0){
      res.json({
        code:"error",
        message:"Sản phẩm không hợp lệ",
      })
      return;
    }

    // Kiểm tra sản phẩm có thật
    const product = await prisma.product.findUnique({
      where: { id: productID },
      select: { id: true, productName: true, newPrice: true, stock: true },
    });
    if (!product) {
      return res.status(404).json({ code: "error", message: "Sản phẩm không tồn tại" });
    }
    if (product.stock <= 0) {
      return res.status(400).json({ code: "error", message: "Sản phẩm đã hết hàng" });
    }

    const cart = readCart(req);

    const existing = cart.find((item) => item.productId === pid);
    if (existing) {
      existing.quantity = Math.min(existing.quantity + qty, product.stock);
    } else {
      cart.push({ productId: pid, quantity: Math.min(qty, product.stock) });
    }

    saveCart(res, cart);

    return res.json({
      code: "success",
      message: "Đã thêm vào giỏ hàng",
    });
  } catch (err) {
    console.error("[cart/add] Lỗi:", err);
    return res.status(500).json({ code: "error", message: err.message });
  }

})

export default router;