import { Router } from 'express';
import { register, login, getProfile } from '../controllers/auth.controller';
import { authGuard } from '../middleware/authGuard';

const router = Router();

router.post('/register', register);
router.post('/login', login);
router.get('/profile', authGuard, getProfile);

export default router;
