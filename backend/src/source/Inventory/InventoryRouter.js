import { Router } from 'express';
import { authenticate, requirePermission } from '../../common/middleware/auth.js';
import * as controller from './InventoryController.js';

const router = Router();

router.use(authenticate);

router.get('/inventory/low-stock', requirePermission('INVENTORY_VIEW'), controller.lowStock);
router.get('/inventory', requirePermission('INVENTORY_VIEW'), controller.inventory);

router.get('/stock-receipts', requirePermission('INVENTORY_VIEW'), controller.listReceipts);
router.post('/stock-receipts', requirePermission('STOCK_RECEIPT_CREATE'), controller.createReceipt);
router.get('/stock-receipts/:id', requirePermission('INVENTORY_VIEW'), controller.getReceipt);
router.post('/stock-receipts/:id/approve', requirePermission('STOCK_RECEIPT_APPROVE'), controller.approveReceipt);
router.post('/stock-receipts/:id/reject', requirePermission('STOCK_RECEIPT_APPROVE'), controller.rejectReceipt);

router.get('/stock-issues', requirePermission('INVENTORY_VIEW'), controller.listIssues);
router.post('/stock-issues', requirePermission('STOCK_ISSUE_CREATE'), controller.createIssue);
router.get('/stock-issues/:id', requirePermission('INVENTORY_VIEW'), controller.getIssue);
router.post('/stock-issues/:id/approve', requirePermission('STOCK_ISSUE_APPROVE'), controller.approveIssue);
router.post('/stock-issues/:id/reject', requirePermission('STOCK_ISSUE_APPROVE'), controller.rejectIssue);

export default router;
