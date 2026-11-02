import { Router } from 'express';
import { createDepartment, getDepartments, updateDepartment } from '../controllers/departmentController.js';

const router = Router();

router.get('/', getDepartments);
router.post('/', createDepartment);
router.patch('/:id', updateDepartment);

export default router;
