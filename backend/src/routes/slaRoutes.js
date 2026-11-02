import { Router } from 'express';
import { getSLARules, updateSLARules } from '../controllers/slaController.js';

const router = Router();

router.get('/', getSLARules);
router.put('/', updateSLARules);

export default router;
