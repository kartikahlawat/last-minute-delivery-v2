import { Router } from 'express';
import {
  getQuote,
  createOrder,
  getOrders,
  getOrderById,
  getOrderTimeline,
  autoAssignOrder,
  manualAssignOrder,
  updateOrderStatus,
  overrideOrderStatus,
  rescheduleOrder,
} from '../controllers/order.controller';
import { authGuard, roleGuard } from '../middleware/authGuard';

const router = Router();

router.post('/orders/quote', getQuote);
router.post('/orders', authGuard, createOrder);
router.get('/orders', authGuard, getOrders);
router.get('/orders/:id', authGuard, getOrderById);
router.get('/orders/:id/timeline', getOrderTimeline);

// Assignment Endpoints
router.post('/orders/:id/auto-assign', authGuard, roleGuard(['ADMIN']), autoAssignOrder);
router.patch('/orders/:id/assign', authGuard, roleGuard(['ADMIN']), manualAssignOrder);

// Status Progression & Override Endpoints
router.patch('/orders/:id/status', authGuard, roleGuard(['AGENT', 'ADMIN']), updateOrderStatus);
router.patch('/orders/:id/override-status', authGuard, roleGuard(['ADMIN']), overrideOrderStatus);
router.post('/orders/:id/reschedule', authGuard, rescheduleOrder);

export default router;
