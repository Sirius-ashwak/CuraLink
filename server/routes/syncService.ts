import express, { Request, Response } from 'express';
import { syncService } from '../services/syncService';
import { authMiddleware, AuthenticatedRequest } from '../middleware/auth';

const router = express.Router();

/**
 * POST /api/sync/user-data/:userId/:dataType
 * Synchronize user data across devices
 */
router.post('/user-data/:userId/:dataType', authMiddleware, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { userId, dataType } = req.params;
    const data = req.body.data;
    const options = req.body.options || {};
    
    if (!data) {
      return res.status(400).json({ error: 'Data is required' });
    }
    
    await syncService.syncUserData(userId, dataType, data, options);
    res.json({ success: true });
  } catch (error) {
    console.error('Error syncing user data:', error);
    res.status(500).json({ error: 'Failed to sync user data' });
  }
});

/**
 * POST /api/sync/vital-signs/:userId
 * Sync vital signs data across devices
 */
router.post('/vital-signs/:userId', authMiddleware, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { userId } = req.params;
    const vitalSigns = req.body.vitalSigns;
    
    if (!vitalSigns || !Array.isArray(vitalSigns)) {
      return res.status(400).json({ error: 'Vital signs array is required' });
    }
    
    await syncService.syncVitalSigns(userId, vitalSigns);
    res.json({ success: true });
  } catch (error) {
    console.error('Error syncing vital signs:', error);
    res.status(500).json({ error: 'Failed to sync vital signs' });
  }
});

/**
 * POST /api/sync/medications/:userId
 * Sync medication schedule across devices
 */
router.post('/medications/:userId', authMiddleware, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { userId } = req.params;
    const medications = req.body.medications;
    
    if (!medications || !Array.isArray(medications)) {
      return res.status(400).json({ error: 'Medications array is required' });
    }
    
    await syncService.syncMedicationSchedule(userId, medications);
    res.json({ success: true });
  } catch (error) {
    console.error('Error syncing medications:', error);
    res.status(500).json({ error: 'Failed to sync medications' });
  }
});

/**
 * POST /api/sync/appointments/:userId
 * Synchronize appointment data
 */
router.post('/appointments/:userId', authMiddleware, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { userId } = req.params;
    const appointments = req.body.appointments;
    
    if (!appointments || !Array.isArray(appointments)) {
      return res.status(400).json({ error: 'Appointments array is required' });
    }
    
    await syncService.syncAppointments(userId, appointments);
    res.json({ success: true });
  } catch (error) {
    console.error('Error syncing appointments:', error);
    res.status(500).json({ error: 'Failed to sync appointments' });
  }
});

/**
 * GET /api/sync/offline-data/:userId
 * Get data for offline use
 */
router.get('/offline-data/:userId', authMiddleware, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { userId } = req.params;
    const offlineData = await syncService.getOfflineData(userId);
    res.json(offlineData);
  } catch (error) {
    console.error('Error getting offline data:', error);
    res.status(500).json({ error: 'Failed to get offline data' });
  }
});

export default router;