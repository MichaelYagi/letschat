import { Router } from 'express';
import { AuthController } from '../controllers/AuthController';
import { authMiddleware } from '../config/jwt';

const router = Router();

// Public routes
router.post('/register', AuthController.register);
router.post('/login', AuthController.login);

// Protected routes (require authentication)
router.use(authMiddleware);

router.post('/logout', AuthController.logout);
router.post('/logout-all', AuthController.logoutAll);
router.get('/verify', AuthController.verify);
router.get('/profile', AuthController.profile);
router.put('/profile', AuthController.updateProfile);
router.get('/search', AuthController.searchUsers);

export default router;