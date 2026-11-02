import { Router } from 'express';
import { createCategory, getCategories, updateCategory } from '../controllers/categoryController.js';

const router = Router();

router.get('/', getCategories);
router.post('/', createCategory);
router.patch('/:id', updateCategory);

export default router;
