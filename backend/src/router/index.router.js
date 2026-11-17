import { Router } from "express";
import slugify from "slugify";
import jwt from 'jsonwebtoken';
import { prisma } from '../lib/prisma.js';
import { env } from '../config/env.js';
import { isSessionInvalidated } from '../common/sessionInvalidation.js';

import upload from "./cloudinary.js";
const router = Router();

/** Extract userId from httpOnly cookie token without throwing (guest-safe). */
function getUserIdFromCookie(req) {
  const token = req.cookies?.token;
  if (!token) return null;
  try {
    const decoded = jwt.verify(token, env.jwtSecret);
    return decoded.userId ?? null;
  } catch {
    return null;
  }
}

const getMyCart = async (userId) => {
  try {
    let cart = await prisma.cart.findUnique({
      where: { customerId: userId },
      include: {
        items: {
          include: {
            product: true,
          },
          orderBy: { id: 'desc' }
        }
      }
    });

    if (!cart) {
      cart = await prisma.cart.create({
        data: { customerId: userId },
        include: {
          items: {
            include: {
              product: true,
            }
          }
        }
      });
    }
    return cart

  } catch (error) {
    console.error("Lỗi lấy giỏ hàng:", error);
  }
};


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
        take: 6,
      }),
      prisma.product.findMany({
        where: { status: "ACTIVE" },
        include: productInclude,
        orderBy: { createdAt: "asc" },
        take: 6,
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
    let orderCondition = {};
    if (req.query.sort) {
      orderCondition = { newPrice: req.query.sort };
    }
    let whereCondition = {
      categoryId: id,
      status: "ACTIVE",
    }
    if (req.query.tag && req.query.tag !== "null") {
      whereCondition.tags = {
        some: {
          tag: req.query.tag
        }
      };
    }
    //pagination
    const page = parseInt(req.query.page || 1);
    const limit = 9;
    const skip = (page - 1) * limit
    const total = await prisma.product.count({
      where: whereCondition,
    });
    const totalPage = Math.ceil(total / limit);
    if (page <= 0) page = 1;
    if (page > totalPage) page = totalPage;
    const pagination = {
      page,
      totalPage,
      total,
    }
    //end pagination

    const productList = await prisma.product.findMany({
      where: whereCondition,
      orderBy: orderCondition,
      take: limit,
      skip: skip,
      include: {
        category: { select: { id: true, name: true, slug: true } },
        pictures: { select: { url: true } },
        tags: { select: { tag: true } },
      },
      orderBy: { createdAt: "desc" },
    });
    const allTags = productList.flatMap(p => p.tags.map(t => t.tag));
    const uniqueTags = [...new Set(allTags)];
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
      parent,
      productList,
      category: child,
      pagination,
      tags: uniqueTags,
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

    const { productID, quantity, currentCart } = req.body ?? {};
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
    let userId = null;
    const token = req.cookies.token;
    if (token) {
      try {
        const decoded = jwt.verify(token, env.jwtSecret);
        userId = decoded.userId;
      } catch (error) {
      }
    }
    // ==========================================
    // TRƯỜNG HỢP 1: KHÁCH VÃNG LAI (Chưa đăng nhập)
    // ==========================================
    if (!userId) {
      const cart = currentCart || [];
      const index = cart.findIndex(item => item.id == productID);

      if (index !== -1) {
        cart[index].quantity = Number(cart[index].quantity) + quantity;
        if (cart[index].quantity > product.stock) cart[index].quantity = product.stock;
      } else {
        cart.push({
          id: productID,
          productName: product.productName,
          newPrice: product.newPrice,
          oldPrice: product.oldPrice,
          quantity: quantity,
          image: product.pictures[0]?.url || "",
          selected: true,
        });
      }
      return res.json({ code: "success", message: "Đã thêm vào giỏ", currentCart: cart });
    }

    // ==========================================
    // TRƯỜNG HỢP 2: ĐÃ ĐĂNG NHẬP (Lưu vào Database)
    // ==========================================
    let userCart = await prisma.cart.findUnique({ where: { customerId: userId } });
    if (!userCart) {
      userCart = await prisma.cart.create({ data: { customerId: userId } });
    }

    // Kiểm tra sản phẩm đã có trong giỏ DB chưa
    const existingItem = await prisma.cartItem.findUnique({
      where: { cartId_productId: { cartId: userCart.id, productId: productID } }
    });

    if (existingItem) {
      let newQuantity = existingItem.quantity + quantity;
      if (newQuantity > product.stock) newQuantity = product.stock;

      await prisma.cartItem.update({
        where: { id: existingItem.id },
        data: { quantity: newQuantity }
      });
    } else {
      await prisma.cartItem.create({
        data: {
          cartId: userCart.id,
          productId: productID,
          quantity: quantity
        }
      });
    }
    return res.json({ code: "success", message: "Đã thêm vào giỏ hàng" });
  } catch (err) {
    console.error("[cart/add] Lỗi:", err);
    return res.status(500).json({ code: "error", message: err.message });
  }

})

router.post("/cart/get", async (req, res) => {
  try {
    let userId = null;
    const token = req.cookies.token;

    if (token) {
      try {
        const decoded = jwt.verify(token, env.jwtSecret);
        userId = decoded.userId;
      } catch (error) {
      }
    }

    // ==========================================
    // TRƯỜNG HỢP 1: ĐÃ ĐĂNG NHẬP (Lấy từ Database)
    // ==========================================
    if (userId) {
      const userCart = await prisma.cart.findUnique({
        where: { customerId: userId },
        include: {
          items: {
            include: {
              product: {
                include: { pictures: true }
              }
            }
          }
        }
      });

      const formattedCart = userCart?.items.map(item => ({
        id: item.product.id,
        productName: item.product.productName,
        newPrice: item.product.newPrice,
        oldPrice: item.product.oldPrice,
        quantity: item.quantity,
        image: item.product.pictures[0]?.url ?? null, // Lấy ảnh
        stock: item.product.stock,
        selected: false,
      })) || [];

      return res.json({ code: "success", currentCart: formattedCart });
    }

    // ==========================================
    // TRƯỜNG HỢP 2: CHƯA ĐĂNG NHẬP (Lấy từ LocalStorage)
    // ==========================================
    const currentCart = req.body.currentCart || [];

    for (const p of currentCart) {
      const product = await prisma.product.findUnique({
        where: { id: p.id },
        include: { pictures: true }
      });
      if (product) {
        p.image = product.pictures[0]?.url ?? null;
        p.stock = product.stock;
      }
    }

    return res.json({
      code: "success",
      currentCart,
    });

  } catch (err) {
    console.error("[cart/get] Lỗi:", err);
    return res.status(500).json({ code: "error", message: err.message });
  }
});

router.post("/cart/remove", async (req, res) => {
  try {
    const { productId } = req.body;

    let userId = null;
    const token = req.cookies.token;
    if (token) {
      try {
        const decoded = jwt.verify(token, env.jwtSecret);
        userId = decoded.userId;
      } catch (error) { }
    }

    if (userId) {
      const userCart = await prisma.cart.findUnique({
        where: { customerId: userId }
      });

      if (userCart) {
        await prisma.cartItem.deleteMany({
          where: {
            cartId: userCart.id,
            productId: productId
          }
        });
      }
    }

    return res.json({ code: "success", message: "Đã xóa sản phẩm" });

  } catch (err) {
    console.error("[cart/remove] Lỗi:", err);
    return res.status(500).json({ code: "error", message: err.message });
  }
});

router.post("/cart/update", async (req, res) => {
  try {
    const { productId, quantity } = req.body;

    // Kiểm tra đăng nhập
    let userId = null;
    const token = req.cookies.token;
    if (token) {
      try {
        const decoded = jwt.verify(token, env.jwtSecret);
        userId = decoded.userId;
      } catch (error) { }
    }

    if (userId) {
      const userCart = await prisma.cart.findUnique({
        where: { customerId: userId }
      });

      if (userCart) {
        const existingItem = await prisma.cartItem.findUnique({
          where: { cartId_productId: { cartId: userCart.id, productId: productId } }
        });

        if (existingItem) {
          const product = await prisma.product.findUnique({ where: { id: productId } });
          let newQuantity = Number(quantity);
          if (newQuantity > product.stock) newQuantity = product.stock;
          if (newQuantity < 1) newQuantity = 1;

          await prisma.cartItem.update({
            where: { id: existingItem.id },
            data: { quantity: newQuantity }
          });
        }
      }
    }

    return res.json({ code: "success", message: "Cập nhật thành công" });
  } catch (err) {
    console.error("[cart/update] Lỗi:", err);
    return res.status(500).json({ code: "error", message: err.message });
  }
});

router.post("/order/create", async (req, res) => {
  try {
    const { name, phone, address, note, paymentMethod, cart, addressType } = req.body;
    let customerId = null;
    const token = req.cookies.token;

    if (token) {
      try {
        const decoded = jwt.verify(token, env.jwtSecret);
        customerId = decoded.userId; // Lấy ID từ token
      } catch (error) {
        console.log("Token không hợp lệ:", error.message);
      }
    }

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
      if (customerId) {
        const userCart = await tx.cart.findUnique({
          where: { customerId: customerId }
        });

        if (userCart) {
          for (const item of orderItems) {
            await tx.cartItem.deleteMany({
              where: {
                cartId: userCart.id,
                productId: item.productId
              }
            });
          }
        }
      }

      return order;
    });

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
  tmnCode: env.vnpayTmnCode,
  secureSecret: env.vnpaySecureSecret,
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
    const transactionID = verifyResult.vnp_TransactionNo;
    await prisma.order.update({
      where: { id: Number(orderId) },
      data: {
        paymentMethodStatus: true,
        transactionID: transactionID,
      }
    });
    return res.redirect(`http://localhost:3000/order/payment/${orderId}?payment=success`);

  } catch (error) {
    console.error('Lỗi xác thực Return URL:', error);
    return res.send('Dữ liệu không hợp lệ');
  }
});

async function handleCheckLogin(req, res) {
  try {
    const token = req.cookies?.token;
    if (!token) {
      return res.json({ code: 'error', message: 'Chưa đăng nhập' });
    }

    let decoded;
    try {
      decoded = jwt.verify(token, env.jwtSecret);
    } catch {
      return res.status(401).json({ code: 'error', message: 'Token không hợp lệ hoặc đã hết hạn' });
    }

    if (decoded.userId && decoded.iat && isSessionInvalidated(decoded.userId, decoded.iat)) {
      return res.status(401).json({ code: 'error', message: 'Phiên đăng nhập đã hết hiệu lực' });
    }

    const user = await prisma.user.findUnique({
      where: { id: decoded.userId },
      select: {
        id: true,
        email: true,
        fullName: true,
        phone: true,
        avatar: true,
        isActive: true,
        role: { select: { code: true, name: true } },
        recipientInfos: true,
      },
    });

    if (!user || !user.isActive) {
      return res.status(401).json({ code: 'error', message: 'Tài khoản không hợp lệ hoặc đã bị khóa' });
    }

    const cart = await getMyCart(user.id);
    return res.json({
      code: 'success',
      account: {
        id: user.id,
        email: user.email,
        fullName: user.fullName,
        phone: user.phone,
        avatar: user.avatar,
        role: user.role?.code,
        roleName: user.role?.name,
        recipientInfos: user.recipientInfos,
      },
      cart,
    });
  } catch (error) {
    console.error('[checkLogin]', error.message);
    return res.status(401).json({ code: 'error', message: 'Token không hợp lệ hoặc đã hết hạn' });
  }
}

// Accept both casings used by different frontend files.
router.get('/checkLogin', handleCheckLogin);
router.get('/checklogin', handleCheckLogin);

router.post("/comment/create", async (req, res) => {
  try {
    const { productId, rating, content } = req.body;

    let userId = null;
    const token = req.cookies.token;

    if (!token) {
      return res.status(401).json({ code: "error", message: "Vui lòng đăng nhập để đánh giá sản phẩm" });
    }

    try {
      const decoded = jwt.verify(token, env.jwtSecret);
      userId = decoded.userId;
    } catch (error) {
      return res.status(401).json({ code: "error", message: "Phiên đăng nhập đã hết hạn, vui lòng đăng nhập lại" });
    }
    if (!userId) {
      return res.json({
        code: "error",
        message: "Vui lòng đăng nhập"
      })
    }

    const pId = parseInt(productId);
    const starRating = parseInt(rating);

    await prisma.comment.create({
      data: {
        productId: pId,
        userId: userId,
        content: content,
        rating: starRating,
      }
    });

    const allComments = await prisma.comment.findMany({
      where: {
        productId: pId,
        isActive: true // Chỉ tính những comment đang hiển thị
      }
    });

    let averageRating = 0;
    if (allComments.length > 0) {
      const totalScore = allComments.reduce((sum, c) => sum + (c.rating || 0), 0);
      averageRating = totalScore / allComments.length;
      averageRating = Math.round(averageRating * 10) / 10;
    }

    await prisma.product.update({
      where: { id: pId },
      data: { rate: averageRating }
    });

    return res.status(201).json({
      code: "success",
      message: "Đánh giá sản phẩm thành công",
      newRate: averageRating
    });

  } catch (error) {
    console.error("[comment/create] Lỗi:", error);
    return res.status(500).json({ code: "error", message: "Lỗi server khi tạo đánh giá" });
  }
});

router.post("/search", async (req, res) => {
  try {
    let title = "";
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 9;
    const skip = page > 0 ? (page - 1) * limit : 0;
    let whereCondition = {}
    let orderCondition = { createdAt: 'desc' }
    if (req.query.isFeature === "true") {
      whereCondition.isFeature = true;
      title = "Sản phẩm hot"
    }
    if (req.query.key != "null") {
      const keyword = slugify(req.query.key);
      title = `Kết quả tìm kiếm: ${req.query.key}`
      whereCondition.slug = {
        contains: keyword,       // Tìm slug có chứa keyword
        mode: 'insensitive',     // Không phân biệt chữ hoa/thường 
      }
    }
    if (req.query.tag && req.query.tag !== "null") {
      whereCondition.tags = {
        some: {
          tag: req.query.tag
        }
      };
    }
    if (req.query.sort) {
      orderCondition = { newPrice: req.query.sort };
    }
    const total = await prisma.product.count({ where: whereCondition });
    const product = await prisma.product.findMany({
      where: whereCondition,
      take: limit,
      skip: skip,
      orderBy: orderCondition,

      include: {
        category: true,
        pictures: true,
        tags: true,
        Comment: {
          where: { isActive: true },
          include: {
            User: {
              select: {
                fullName: true,
                avatar: true
              }
            }
          },
          orderBy: { createdAt: 'desc' }
        }
      }
    });
    const allTags = product.flatMap(p => p.tags.map(t => t.tag));
    const uniqueTags = [...new Set(allTags)];
    // Trả về kết quả
    return res.json({
      code: "success",
      productList: product,
      title,
      tags: uniqueTags,
      pagination: {
        limit: limit,
        page: page,
        totalPage: Math.ceil(total / limit),
      }
    });

  } catch (error) {
    console.error("Lỗi lấy sản phẩm theo slug:", error);
    return res.status(500).json({
      code: "error",
      message: "Lỗi server"
    });
  }
})

router.post("/update/avatar",
  upload.single('avatar'),
  async (req, res) => {
    // console.log(req.file);
    const token = req.cookies?.token;
    if (!token) {
      return res.status(401).json({ error: "Chưa đăng nhập" });
    }

    let payload;
    try {
      payload = jwt.verify(token, process.env.JWT_SECRET);
    } catch {
      return res.status(401).json({ error: "Token không hợp lệ" });
    }
    console.log(payload);
    const updated = await prisma.user.update({
      where: { id: payload.userId },
      data: { avatar: req.file?.path||null },
    });
    return res.json({
      code:"success",
      message: "Cập nhật avatar thành công",
      avatar: updated.avatar,
    });
  })


export default router;