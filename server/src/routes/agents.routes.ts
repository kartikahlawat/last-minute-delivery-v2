import { Router } from 'express';
import { getAgents, getAgentById, updateAgentStatus } from '../controllers/agent.controller';
import { authGuard, roleGuard } from '../middleware/authGuard';

const router = Router();

router.get('/agents', authGuard, roleGuard(['ADMIN']), getAgents);
router.get('/agents/:id', authGuard, getAgentById);
router.patch('/agents/:id/status', authGuard, roleGuard(['AGENT', 'ADMIN']), updateAgentStatus);

export default router;
