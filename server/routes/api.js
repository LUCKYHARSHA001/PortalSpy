import express from 'express';
import { register, login, logout, getMe, updateWhatsapp, googleAuth } from '../controllers/authController.js';
import { getPortals, createPortal, updatePortal, deletePortal, triggerScrape, resetCircuitBreaker } from '../controllers/portalController.js';
import { getFilters, updateFilters } from '../controllers/filterController.js';
import { getAlerts, updateAlertStatus, resendWhatsappAlert, sendTestAlert, getDashboardStats } from '../controllers/alertController.js';
import { getWhatsappStatus, resetWhatsappSession } from '../services/whatsappService.js';
import { authMiddleware } from '../middleware/auth.js';

const router = express.Router();

// Auth Routes (Public)
router.post('/auth/register', register);
router.post('/auth/login', login);
router.post('/auth/google', googleAuth);
router.post('/auth/logout', logout);

// Auth & User Profile Routes (Protected)
router.get('/auth/me', authMiddleware, getMe);
router.post('/auth/whatsapp-number', authMiddleware, updateWhatsapp);
router.get('/user/whatsapp-status', authMiddleware, (req, res) => {
  res.json(getWhatsappStatus());
});
router.post('/user/whatsapp-reset', authMiddleware, async (req, res) => {
  try {
    await resetWhatsappSession();
    res.json({ message: 'WhatsApp session reset initiated. Generating new QR code...' });
  } catch (err) {
    res.status(500).json({ message: 'Failed to reset WhatsApp session.' });
  }
});

// Tracked Portals Management Routes (Protected)
router.get('/portals', authMiddleware, getPortals);
router.post('/portals', authMiddleware, createPortal);
router.put('/portals/:id', authMiddleware, updatePortal);
router.delete('/portals/:id', authMiddleware, deletePortal);
router.post('/portals/:id/trigger', authMiddleware, triggerScrape);
router.post('/portals/:id/reset-circuit', authMiddleware, resetCircuitBreaker);

// Filter Settings Routes (Protected)
router.get('/filters', authMiddleware, getFilters);
router.put('/filters', authMiddleware, updateFilters);

// Job Alerts & Stats Routes (Protected)
router.get('/alerts', authMiddleware, getAlerts);
router.put('/alerts/:id/status', authMiddleware, updateAlertStatus);
router.post('/alerts/test', authMiddleware, sendTestAlert);
router.post('/alerts/:id/resend', authMiddleware, resendWhatsappAlert);
router.get('/dashboard/stats', authMiddleware, getDashboardStats);

export default router;
