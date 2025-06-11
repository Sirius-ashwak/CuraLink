import { Router } from "express";
import { storage } from "../storage";

const router = Router();

/**
 * Check if doctor has active appointment relationship with patient
 */
router.get("/doctor-patient-relation/:doctorId/:patientId", async (req, res) => {
  try {
    const { doctorId, patientId } = req.params;
    
    // Get all appointments for this doctor
    const appointments = await storage.getAppointmentsByDoctor(parseInt(doctorId));
    
    // Check if there's an active appointment with this patient
    const hasActiveRelation = appointments.some(appointment => 
      appointment.patientId === parseInt(patientId) && 
      appointment.status !== 'canceled' && 
      appointment.status !== 'completed'
    );
    
    res.json({ hasActiveRelation });
  } catch (error) {
    console.error("Error checking doctor-patient relation:", error);
    res.status(500).json({ error: "Failed to validate relationship" });
  }
});

/**
 * Get patient consent for data access
 */
router.get("/consent/:patientId/:doctorId", async (req, res) => {
  try {
    const { patientId, doctorId } = req.params;
    
    // For now, return default consultation_only consent
    // In production, this would fetch from consent database
    const consent = {
      id: `consent-${patientId}-${doctorId}`,
      patientId: parseInt(patientId),
      doctorId: parseInt(doctorId),
      consentType: 'consultation_only',
      grantedAt: new Date(),
      isActive: true
    };
    
    res.json(consent);
  } catch (error) {
    console.error("Error checking patient consent:", error);
    res.status(500).json({ error: "Failed to check consent" });
  }
});

/**
 * Update patient consent
 */
router.post("/consent", async (req, res) => {
  try {
    const { patientId, doctorId, consentType, expiresAt } = req.body;
    
    // In production, this would save to consent database
    const consent = {
      id: `consent-${patientId}-${doctorId}`,
      patientId,
      doctorId,
      consentType,
      grantedAt: new Date(),
      expiresAt: expiresAt ? new Date(expiresAt) : undefined,
      isActive: true
    };
    
    res.json(consent);
  } catch (error) {
    console.error("Error updating consent:", error);
    res.status(500).json({ error: "Failed to update consent" });
  }
});

export default router;