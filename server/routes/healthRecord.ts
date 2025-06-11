import express, { Request, Response } from 'express';
import { healthcareService } from '../services/healthcareService';
import { authMiddleware, AuthenticatedRequest } from '../middleware/auth';
import multer from 'multer';
import { storage } from '../storage';

const router = express.Router();
const upload = multer({ storage: multer.memoryStorage() });

// Check if Healthcare API is configured
router.get('/status', async (_req: Request, res: Response) => {
  try {
    const status = healthcareService.getStatus();
    return res.status(200).json(status);
  } catch (error) {
    console.error('Error checking Healthcare API status:', error);
    return res.status(500).json({ error: 'Failed to check Healthcare API status' });
  }
});

// Create patient health record
router.post('/patient', authMiddleware, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { firstName, lastName, gender, birthDate, phoneNumber, email, address } = req.body;
    
    // Validate required fields
    if (!firstName || !lastName || !gender || !birthDate) {
      return res.status(400).json({ error: 'Missing required fields' });
    }
    
    // Create patient in Healthcare API
    const patientRecord = await healthcareService.createPatient({
      firstName,
      lastName,
      gender,
      birthDate,
      phoneNumber,
      email,
      address
    });
    
    return res.status(201).json(patientRecord);
  } catch (error) {
    console.error('Error creating patient health record:', error);
    return res.status(500).json({ error: 'Failed to create patient health record' });
  }
});

// Get patient health record
router.get('/patient/:id', authMiddleware, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const patientId = req.params.id;
    
    // Get patient from Healthcare API
    const patientRecord = await healthcareService.getPatient(patientId);
    
    return res.status(200).json(patientRecord);
  } catch (error) {
    console.error('Error getting patient health record:', error);
    return res.status(500).json({ error: 'Failed to get patient health record' });
  }
});

// Create appointment record
router.post('/appointment', authMiddleware, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { 
      patientId, 
      practitionerId, 
      startDateTime, 
      endDateTime, 
      status, 
      description, 
      appointmentType, 
      reasonCode 
    } = req.body;
    
    // Validate required fields
    if (!patientId || !practitionerId || !startDateTime || !endDateTime || !status) {
      return res.status(400).json({ error: 'Missing required fields' });
    }
    
    // Create appointment in Healthcare API
    const appointmentRecord = await healthcareService.createAppointment({
      patientId,
      practitionerId,
      startDateTime,
      endDateTime,
      status,
      description,
      appointmentType,
      reasonCode
    });
    
    return res.status(201).json(appointmentRecord);
  } catch (error) {
    console.error('Error creating appointment record:', error);
    return res.status(500).json({ error: 'Failed to create appointment record' });
  }
});

// Get patient appointments
router.get('/patient/:id/appointments', authMiddleware, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const patientId = req.params.id;
    
    // Get patient appointments from Healthcare API
    const appointments = await healthcareService.getPatientAppointments(patientId);
    
    return res.status(200).json(appointments);
  } catch (error) {
    console.error('Error getting patient appointments:', error);
    return res.status(500).json({ error: 'Failed to get patient appointments' });
  }
});

// Create observation/vital sign record
router.post('/observation', authMiddleware, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { 
      patientId, 
      practitionerId, 
      code, 
      display, 
      value, 
      unit, 
      dateTime, 
      status 
    } = req.body;
    
    // Validate required fields
    if (!patientId || !code || !display || !value || !dateTime || !status) {
      return res.status(400).json({ error: 'Missing required fields' });
    }
    
    // Create observation in Healthcare API
    const observationRecord = await healthcareService.createObservation({
      patientId,
      practitionerId,
      code,
      display,
      value,
      unit,
      dateTime,
      status
    });
    
    return res.status(201).json(observationRecord);
  } catch (error) {
    console.error('Error creating observation record:', error);
    return res.status(500).json({ error: 'Failed to create observation record' });
  }
});

// Get patient observations (vital signs, lab results)
router.get('/patient/:id/observations', authMiddleware, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const patientId = req.params.id;
    
    // Get patient observations from Healthcare API
    const observations = await healthcareService.getPatientObservations(patientId);
    
    return res.status(200).json(observations);
  } catch (error) {
    console.error('Error getting patient observations:', error);
    return res.status(500).json({ error: 'Failed to get patient observations' });
  }
});

// Upload DICOM image
router.post('/dicom', authMiddleware, upload.single('dicomFile'), async (req: AuthenticatedRequest, res: Response) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: 'No DICOM file uploaded' });
    }
    
    // Upload DICOM image to Healthcare API
    const result = await healthcareService.uploadDicomImage(req.file.buffer);
    
    return res.status(201).json(result);
  } catch (error) {
    console.error('Error uploading DICOM image:', error);
    return res.status(500).json({ error: 'Failed to upload DICOM image' });
  }
});

// Search patients
router.get('/patients/search', authMiddleware, async (req: AuthenticatedRequest, res: Response) => {
  try {
    // Extract search parameters from query
    const searchParams: Record<string, string> = {};
    
    // Add allowed search parameters
    const allowedParams = ['name', 'given', 'family', 'gender', 'birthdate', 'email', 'phone'];
    
    for (const param of allowedParams) {
      if (req.query[param]) {
        searchParams[param] = req.query[param] as string;
      }
    }
    
    // Search patients in Healthcare API
    const patients = await healthcareService.searchPatients(searchParams);
    
    return res.status(200).json(patients);
  } catch (error) {
    console.error('Error searching patients:', error);
    return res.status(500).json({ error: 'Failed to search patients' });
  }
});

export default router;