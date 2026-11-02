import { Router } from 'express';
import { resetDatabase } from '../controllers/devController.js';

const router = Router();

router.post('/reset', resetDatabase);

export default router;
