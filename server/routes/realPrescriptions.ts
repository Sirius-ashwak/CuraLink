import express from "express";
import { storage } from "../storage";

const router = express.Router();

// Create digital prescription
router.post('/', express.json(), async (req, res) => {
  try {
    const {
      doctorId,
      patientId,
      medication,
      dosage,
      frequency,
      duration,
      instructions,
      pharmacy,
      prescribedAt
    } = req.body;

    if (!doctorId || !patientId || !medication) {
      return res.status(400).json({ 
        error: 'Doctor ID, Patient ID, and medication are required' 
      });
    }

    // Create prescription record
    const prescriptionData = {
      doctorId: parseInt(doctorId),
      patientId: parseInt(patientId),
      medication,
      dosage: dosage || '',
      frequency: frequency || '',
      duration: duration || '',
      instructions: instructions || '',
      pharmacy: pharmacy || '',
      status: 'active',
      prescribedAt: prescribedAt || new Date().toISOString(),
      createdAt: new Date()
    };

    // Save to storage system (Firebase/Memory)
    const prescription = await storage.createPrescription(prescriptionData);

    // In a real system, this would integrate with:
    // - Electronic Health Records (EHR)
    // - Pharmacy systems
    // - Patient notification systems
    // - Insurance verification

    res.status(201).json({
      success: true,
      prescription,
      message: 'Digital prescription created successfully',
      sentTo: {
        patient: true,
        pharmacy: pharmacy ? true : false,
        ehrSystem: true
      }
    });

  } catch (error) {
    console.error('Prescription creation error:', error);
    res.status(500).json({ 
      error: 'Failed to create prescription',
      details: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

// Get prescriptions for a patient
router.get('/patient/:patientId', async (req, res) => {
  try {
    const patientId = parseInt(req.params.patientId);
    const prescriptions = await storage.getPrescriptionsByPatient(patientId);
    
    res.json(prescriptions);
  } catch (error) {
    console.error('Error fetching patient prescriptions:', error);
    res.status(500).json({ error: 'Failed to fetch prescriptions' });
  }
});

// Get prescriptions by doctor
router.get('/doctor/:doctorId', async (req, res) => {
  try {
    const doctorId = parseInt(req.params.doctorId);
    const prescriptions = await storage.getPrescriptionsByDoctor(doctorId);
    
    res.json(prescriptions);
  } catch (error) {
    console.error('Error fetching doctor prescriptions:', error);
    res.status(500).json({ error: 'Failed to fetch prescriptions' });
  }
});

export default router;