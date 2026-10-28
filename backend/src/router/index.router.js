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

    const { productID, quantity } = req.body ?? {};
    if (quantity <= 0) {
      res.json({
        code: "error",
        message: "Sản phẩm không hợp lệ",
      })
      return;
    }

    // Kiểm tra sản phẩm có thật
    const product = await prisma.product.findUnique({
      where: { id: productID },
      select: { id: true, productName: true, newPrice: true, oldPrice: true, stock: true, pictures: true, },
    });
    if (!product) {
      return res.status(404).json({ code: "error", message: "Sản phẩm không tồn tại" });
    }
    if (product.stock <= 0) {
      return res.status(400).json({ code: "error", message: "Sản phẩm đã hết hàng" });
    }
    const currentCart = req.body.currentCart;
    const index = currentCart.findIndex(item => item.id == productID);
    if (index != -1) {
      currentCart[index].quantity = Number(currentCart[index].quantity) + quantity;
      if (currentCart[index].quantity > product.stock) {
        currentCart[index].quantity = product.stock
      }
    }
    else {
      currentCart.push({
        id: productID,
        productName: product.productName,
        newPrice: product.newPrice,
        oldPrice: product.oldPrice,
        quantity: quantity,
        image: product.pictures[0].url,
        selected: true,
      })
    }
    return res.json({
      code: "success",
      message: "Đã thêm vào giỏ hàng",
      currentCart,
    });
  } catch (err) {
    console.error("[cart/add] Lỗi:", err);
    return res.status(500).json({ code: "error", message: err.message });
  }

})

router.post("/cart/get", async (req, res) => {
  try {
    const currentCart = req.body.currentCart;
    for (const p of currentCart) {
      const product = await prisma.product.findUnique({
        where: { id: p.id },
        include: {
          pictures: true,
        }
      });
      p.picture = product.pictures[0]?.url ?? null;
    }
    console.log(currentCart);
    return res.json({
      code: "success",
      currentCart,
    });
  } catch (err) {
    console.error("[cart/add] Lỗi:", err);
    return res.status(500).json({ code: "error", message: err.message });
  }

})

router.post("/order/create", async (req, res) => {
  try {
    const { name, phone, address, note, paymentMethod, cart, addressType } = req.body;
    console.log("Tạo đơn hàng", req.body);
    const customerId = req.user ? req.user.id : null;

    if (!cart || cart.length === 0) {
      return res.status(400).json({ code: "error", message: "Giỏ hàng đang trống!" });
    }

    let subtotal = 0;
    let total = 0;
    const orderItems = cart.map(item => {
      subtotal += item.oldPrice * item.quantity;
      total += item.newPrice * item.quantity;
      return {
        productId: item.id,
        quantity: parseInt(item.quantity),
        price: item.newPrice
      };
    });

    const shippingFee = total > 1000000 ? 0 : 30000;
    const discount = subtotal - total;
    const totalCost = total + shippingFee;

    let recipient = await prisma.recipientInfo.findFirst({
      where: {
        customerId: customerId,
        recipientPhoneNumber: phone,
        address: address
      }
    });

    if (!recipient) {
      recipient = await prisma.recipientInfo.create({
        data: {
          customerId: customerId,
          recipientName: name,
          recipientPhoneNumber: phone,
          address: address,
          recipientType: addressType
        }
      });
    }

    const newOrder = await prisma.$transaction(async (tx) => {
      const order = await tx.order.create({
        data: {
          customerId: customerId,
          recipientId: recipient.id,
          status: 'PENDING',
          shippingFee,
          paymentMethod,
          note,
          discount,
          subtotal,
          totalCost,
          items: {
            create: orderItems
          }
        }
      });

      return order;
    });

    console.log(newOrder);
    return res.status(201).json({
      code: "success",
      message: "Đặt hàng thành công",
      newOrder,
    });

  } catch (error) {
    console.error("Lỗi tạo order:", error);
    return res.status(500).json({ code: "error", message: "Lỗi server khi tạo đơn hàng" });
  }
})

router.get("/order/payment/:id", async (req, res) => {
  try {
    const orderId = Number(req.params.id);

    if (isNaN(orderId)) {
      return res.status(400).json({ code: "error", message: "ID không hợp lệ" });
    }

    const order = await prisma.order.findUnique({
      where: { id: orderId },
      include: {
        recipient: true,
        items: {
          include: {
            product: {
              include: {
                pictures: true,
              }
            }
          }
        },
        customer: {
          select: { email: true, fullName: true }
        }
      }
    });

    if (!order) {
      return res.status(404).json({ code: "error", message: "Không tìm thấy đơn hàng" });
    }

    return res.status(200).json({
      code: "success",
      order,
    });

  } catch (error) {
    console.error("Lỗi lấy chi tiết đơn hàng:", error);
    return res.status(500).json({ code: 'error', message: "Lỗi server" });
  }
})

import { VNPay, HashAlgorithm, ProductCode, ignoreLogger, VnpLocale } from 'vnpay';

const vnpay = new VNPay({
  tmnCode: 'SUYBCG99',
  secureSecret: 'JODQGSBQOVJOTXBQRELQCRHWKGGSRAGP',
  vnpayHost: 'https://sandbox.vnpayment.vn',
  queryDrAndRefundHost: 'https://sandbox.vnpayment.vn', // tùy chọn, trường hợp khi url của querydr và refund khác với url khởi tạo thanh toán (thường sẽ sử dụng cho production)

  testMode: true, // tùy chọn, ghi đè vnpayHost thành sandbox nếu là true
  hashAlgorithm: 'SHA512', // tùy chọn

  enableLog: true, // tùy chọn

  loggerFn: ignoreLogger, // tùy chọn

  endpoints: {
    paymentEndpoint: 'paymentv2/vpcpay.html',
    queryDrRefundEndpoint: 'merchant_webapi/api/transaction',
    getBankListEndpoint: 'qrpayauth/api/merchant/get_bank_list',
  }, // tùy chọn
});

// API xử lý đơn hàng
router.post('/order/pay/:id', async (req, res) => {
  try {
    const order = await prisma.order.findUnique({
      where: { id: Number(req.params.id) },
    });

    const paymentUrl = vnpay.buildPaymentUrl({
      vnp_Amount: order.totalCost,
      vnp_IpAddr:
        req.headers['x-forwarded-for'] ||
        req.connection.remoteAddress ||
        req.socket.remoteAddress ||
        req.ip,
      vnp_TxnRef: order.id,
      vnp_OrderInfo: `Thanh toan don hang ${order.id}`,
      vnp_OrderType: ProductCode.Other,
      vnp_ReturnUrl: `http://localhost:4000/vnpay-return`,
      vnp_Locale: VnpLocale.VN,
    });

    return res.json({
      code: "success",
      paymentUrl,
      order,
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: 'Lỗi khi tạo đơn hàng',
      error: error.message,
    });
  }
});

// Route xử lý URL trả về
// Thay vì hiển thị văn bản, bạn có thể render một template hoặc chuyển hướng khách hàng đến trang cần thiết
router.get('/vnpay-return', async (req, res) => {
  try {
    const verifyResult = await vnpay.verifyReturnUrl(req.query);

    if (!verifyResult.isVerified) {
      return res.send('Xác thực tính toàn vẹn dữ liệu thất bại');
    }
    if (!verifyResult.isSuccess) {
      return res.send('Đơn hàng thanh toán thất bại');
    }

    const orderId = verifyResult.vnp_TxnRef;
    await prisma.order.update({
      where: { id: Number(orderId) },
      data: {
        paymentMethodStatus: true, 
      }
    });
    return res.redirect(`http://localhost:3000/order/payment/${orderId}?payment=success`);

  } catch (error) {
    console.error('Lỗi xác thực Return URL:', error);
    return res.send('Dữ liệu không hợp lệ');
  }
});

export default router;