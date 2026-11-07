import { Router } from 'express';
import { authenticate } from '../../middleware/auth';
import { authLimiter } from '../../middleware/rateLimit';
import * as c from './auth.controller';

export const authRoutes = Router();

authRoutes.post('/register', authLimiter, c.register);
authRoutes.post('/login', authLimiter, c.login);
authRoutes.post('/refresh', c.refresh);
authRoutes.post('/logout', c.logout);
authRoutes.get('/me', authenticate, c.me);
authRoutes.patch('/me', authenticate, c.updateProfile);
authRoutes.post('/change-password', authenticate, authLimiter, c.changePassword);

