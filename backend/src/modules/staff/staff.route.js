import { Router } from 'express';
import { authenticate, requirePermission, requireRole } from '../../common/middleware/auth.js';
import * as controller from './staff.controller.js';

const router = Router();

router.use(authenticate, requireRole('STAFF', 'SHOP_OWNER'));

router.get('/categories', requirePermission('CATEGORY_MANAGE'), controller.listCategories);
router.post('/categories', requirePermission('CATEGORY_MANAGE'), controller.createCategory);
router.patch('/categories/:id', requirePermission('CATEGORY_MANAGE'), controller.updateCategory);
router.patch('/categories/:id/status', requirePermission('CATEGORY_MANAGE'), controller.updateCategoryStatus);
router.delete('/categories/:id', requirePermission('CATEGORY_MANAGE'), controller.deleteCategory);
router.get('/products', requirePermission('PRODUCT_MANAGE'), controller.listProducts);
router.post('/products', requirePermission('PRODUCT_MANAGE'), controller.createProduct);
router.put('/products/:id', requirePermission('PRODUCT_MANAGE'), controller.updateProduct);
router.patch('/products/:id/status', requirePermission('PRODUCT_MANAGE'), controller.updateProductStatus);
router.delete('/products/:id', requirePermission('PRODUCT_MANAGE'), controller.deleteProduct);
router.get('/orders', requirePermission('ORDER_VIEW'), controller.listOrders);
router.get('/orders/:id/history', requirePermission('ORDER_VIEW'), controller.orderHistory);
router.patch('/orders/:id/status', requirePermission('ORDER_PROCESS'), controller.updateOrderStatus);

export default router;
