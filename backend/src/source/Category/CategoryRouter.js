import { Router } from 'express';
import * as categoryController from './CategoryController.js';

const router = Router();

router.get('/', categoryController.list);
router.get('/:id', categoryController.getById);
router.post('/', categoryController.create);
router.patch('/:id', categoryController.update);
router.patch('/:id/status', categoryController.updateStatus);
router.delete('/:id', categoryController.remove);

export default router;