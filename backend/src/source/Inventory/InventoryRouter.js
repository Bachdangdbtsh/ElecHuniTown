import { Router } from 'express';
import { authenticate, requirePermission, requirePermissionOrRole } from '../../common/middleware/auth.js';
import * as controller from './InventoryController.js';

const router = Router();

router.use(['/inventory', '/stock-receipts', '/stock-issues', '/suppliers'], authenticate);

router.get('/inventory/low-stock', requirePermission('INVENTORY_VIEW'), controller.lowStock);
router.get('/inventory', requirePermission('INVENTORY_VIEW'), controller.inventory);
router.get('/inventory/suppliers', requirePermission('INVENTORY_VIEW'), controller.listSuppliers);

router.get('/suppliers', requirePermission('SUPPLIER_MANAGE'), controller.searchSuppliers);
router.post('/suppliers', requirePermission('SUPPLIER_MANAGE'), controller.createSupplier);
router.get('/suppliers/:id', requirePermission('SUPPLIER_MANAGE'), controller.getSupplier);
router.patch('/suppliers/:id', requirePermission('SUPPLIER_MANAGE'), controller.updateSupplier);
router.delete('/suppliers/:id', requirePermission('SUPPLIER_MANAGE'), controller.deleteSupplier);

router.get('/stock-receipts', requirePermission('INVENTORY_VIEW'), controller.listReceipts);
router.post('/stock-receipts', requirePermission('STOCK_RECEIPT_CREATE'), controller.createReceipt);
router.get('/stock-receipts/:id', requirePermission('INVENTORY_VIEW'), controller.getReceipt);
router.post('/stock-receipts/:id/approve', requirePermission('STOCK_RECEIPT_APPROVE'), controller.approveReceipt);
router.post('/stock-receipts/:id/reject', requirePermission('STOCK_RECEIPT_APPROVE'), controller.rejectReceipt);

router.get('/stock-issues', requirePermission('INVENTORY_VIEW'), controller.listIssues);
router.post('/stock-issues', requirePermissionOrRole('STOCK_ISSUE_CREATE', 'STAFF'), controller.createIssue);
router.get('/stock-issues/:id', requirePermission('INVENTORY_VIEW'), controller.getIssue);
router.post('/stock-issues/:id/approve', requirePermission('STOCK_ISSUE_APPROVE'), controller.approveIssue);
router.post('/stock-issues/:id/reject', requirePermission('STOCK_ISSUE_APPROVE'), controller.rejectIssue);

export default router;
