import express from 'express';
import * as clientController from '../controllers/clientController.js';

const router = express.Router();

/**
 * Client Routes
 * API‌های ساده برای Client App
 * این route‌ها Public هستند (بدون نیاز به JWT)
 * ولی با License Key احراز هویت می‌شوند
 */

// احراز هویت
router.post('/auth', clientController.authenticate);

// دریافت پروفایل
router.get('/profile', clientController.getProfile);

// Heartbeat
router.post('/heartbeat', clientController.heartbeat);

// Session Management
router.post('/session-start', clientController.startSession);
router.post('/session-end', clientController.endSession);

// چک به‌روزرسانی
router.get('/check-update', clientController.checkUpdate);

export default router;
