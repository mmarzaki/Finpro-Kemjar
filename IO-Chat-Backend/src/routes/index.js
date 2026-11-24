import express from 'express';
import authRoutes from './auth.js';
import chatRoutes from './chats.js';
import debugRoutes from './debug.js';

const router = express.Router();

router.use('/auth', authRoutes);
router.use('/chats', chatRoutes);
// VULNERABLE: endpoint eksperimen yang sengaja tidak diamankan (lihat docs)
router.use('/debug', debugRoutes);

export default router;
