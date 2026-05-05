import express from 'express';
import { getProducts, getCategories, getProductById, createProduct, createBulkProducts, updateProduct, deleteProduct } from '../controllers/productsController';
import protect from '../middleware/auth';
import { authorizeRoles } from '../middleware/role';
import { validateProduct } from '../middleware/validate';

const router = express.Router();

router.get('/', getProducts);
router.get('/categories', getCategories);
router.get('/:id', getProductById);
router.post('/bulk', protect, authorizeRoles('admin'), createBulkProducts);
router.post('/', protect, authorizeRoles('admin'), validateProduct, createProduct);
router.put('/:id', protect, authorizeRoles('admin'), validateProduct, updateProduct);
router.delete('/:id', protect, authorizeRoles('admin'), deleteProduct);

export default router;
