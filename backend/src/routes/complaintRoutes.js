import { Router } from 'express';
import {
  archiveComplaint,
  assignComplaint,
  createComplaint,
  getComplaintById,
  getComplaints,
  getStatusHistory,
  addStatusHistory,
  updateComplaint,
} from '../controllers/complaintController.js';
import { addComment, getComments } from '../controllers/commentController.js';
import { submitFeedback } from '../controllers/feedbackController.js';

const router = Router();

// Core Complaints List & Detail
router.get('/', getComplaints);
router.post('/', createComplaint);
router.get('/:id', getComplaintById);
router.patch('/:id', updateComplaint);
router.post('/:id/archive', archiveComplaint);
router.post('/:id/assign', assignComplaint);

// Status Transition Audit History
router.get('/:id/history', getStatusHistory);
router.post('/:id/history', addStatusHistory);

// Comments & Notes
router.get('/:id/comments', getComments);
router.post('/:id/comments', addComment);

// Feedback
router.post('/:id/feedback', submitFeedback);

export default router;
