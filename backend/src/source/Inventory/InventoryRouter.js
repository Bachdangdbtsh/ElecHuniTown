import { Router } from 'express';
import { authenticate, requirePermission, requirePermissionOrRole, requireRole } from '../../common/middleware/auth.js';
import * as controller from './InventoryController.js';

const router = Router();

router.use(['/inventory', '/stock-receipts', '/stock-issues', '/suppliers'], authenticate, requireRole('SHOP_OWNER', 'STAFF'));

router.get('/inventory/low-stock', requirePermissionOrRole('INVENTORY_VIEW', 'STAFF'), controller.lowStock);
router.get('/inventory', requirePermissionOrRole('INVENTORY_VIEW', 'STAFF'), controller.inventory);
router.get('/inventory/suppliers', requirePermissionOrRole('INVENTORY_VIEW', 'STAFF'), controller.listSuppliers);

router.get('/suppliers', requirePermissionOrRole('SUPPLIER_MANAGE', 'STAFF'), controller.searchSuppliers);
router.post('/suppliers', requirePermissionOrRole('SUPPLIER_MANAGE', 'STAFF'), controller.createSupplier);
router.get('/suppliers/:id', requirePermissionOrRole('SUPPLIER_MANAGE', 'STAFF'), controller.getSupplier);
router.patch('/suppliers/:id', requirePermissionOrRole('SUPPLIER_MANAGE', 'STAFF'), controller.updateSupplier);
router.delete('/suppliers/:id', requirePermissionOrRole('SUPPLIER_MANAGE', 'STAFF'), controller.deleteSupplier);

router.get('/stock-receipts', requirePermissionOrRole('INVENTORY_VIEW', 'STAFF'), controller.listReceipts);
router.post('/stock-receipts', requirePermissionOrRole('STOCK_RECEIPT_CREATE', 'STAFF', 'SHOP_OWNER'), controller.createReceipt);
router.get('/stock-receipts/:id', requirePermissionOrRole('INVENTORY_VIEW', 'STAFF'), controller.getReceipt);
router.post('/stock-receipts/:id/approve', requireRole('SHOP_OWNER'), requirePermission('STOCK_RECEIPT_APPROVE'), controller.approveReceipt);
router.post('/stock-receipts/:id/reject', requireRole('SHOP_OWNER'), requirePermission('STOCK_RECEIPT_APPROVE'), controller.rejectReceipt);

router.get('/stock-issues', requirePermissionOrRole('INVENTORY_VIEW', 'STAFF'), controller.listIssues);
router.post('/stock-issues', requirePermissionOrRole('STOCK_ISSUE_CREATE', 'STAFF', 'SHOP_OWNER'), controller.createIssue);
router.get('/stock-issues/:id', requirePermissionOrRole('INVENTORY_VIEW', 'STAFF'), controller.getIssue);
router.post('/stock-issues/:id/approve', requireRole('SHOP_OWNER'), requirePermission('STOCK_ISSUE_APPROVE'), controller.approveIssue);
router.post('/stock-issues/:id/reject', requireRole('SHOP_OWNER'), requirePermission('STOCK_ISSUE_APPROVE'), controller.rejectIssue);

export default router;
