import express from 'express';
import authRoutes from './authRoutes.js';
import profileRoutes from './profileRoutes.js';
import licenseRoutes from './licenseRoutes.js';
import clientRoutes from './clientRoutes.js';

const router = express.Router();

// Health check
router.get('/health', (req, res) => {
  res.json({
    success: true,
    message: 'API is healthy',
    timestamp: new Date().toISOString(),
  });
});

// API routes
router.use('/auth', authRoutes);
router.use('/profiles', profileRoutes);
router.use('/admin/licenses', licenseRoutes);  // ⭐ جدید - برای Admin
router.use('/client', clientRoutes);           // ⭐ جدید - برای Client

export default router;
