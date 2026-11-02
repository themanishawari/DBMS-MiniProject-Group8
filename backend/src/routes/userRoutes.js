import { Router } from 'express';
import { createUser, getUserById, getUsers, updateUser } from '../controllers/userController.js';

const router = Router();

router.get('/', getUsers);
router.get('/:id', getUserById);
router.post('/', createUser);
router.patch('/:id', updateUser);

export default router;
