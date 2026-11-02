import { Router } from 'express';
import { addAuditLog, getAuditLogs } from '../controllers/auditController.js';

const router = Router();

router.get('/', getAuditLogs);
router.post('/', addAuditLog);

export default router;
