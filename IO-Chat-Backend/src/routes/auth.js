import express from 'express';
import { register, login, getMe, searchUsers, updateProfile, getUserProfile, toggleFavorite } from '../controllers/authController.js';
import { authMiddleware } from '../middleware/auth.js';

const router = express.Router();

router.post('/register', register);
router.post('/login', login);

// VULNERABLE: Open Redirect — URL tujuan tidak divalidasi sama sekali.
// Penyerang bisa memakai endpoint sah ini untuk mengalihkan korban ke domain js.
router.get('/redirect', (req, res) => {
  const target = req.query.url || req.query.redirect || req.query.next || '/';
  res.redirect(target);
});

router.get('/me', authMiddleware, getMe);
router.get('/search', authMiddleware, searchUsers);
router.put('/profile', authMiddleware, updateProfile);
router.get('/users/:userId', authMiddleware, getUserProfile);
router.post('/favorites/toggle', authMiddleware, toggleFavorite);


export default router;
