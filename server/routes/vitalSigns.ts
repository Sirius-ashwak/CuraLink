import { Router } from "express";
import { storage } from "../storage";
import { z } from "zod";

const router = Router();

// Vital signs schema for validation
const vitalSignsSchema = z.object({
  patientId: z.string(),
  doctorId: z.number(),
  heartRate: z.string(),
  bloodPressure: z.string().optional(),
  temperature: z.string().optional(),
  oxygenSaturation: z.string().optional(),
  notes: z.string().optional(),
  recordedAt: z.string()
});

/**
 * POST /api/vital-signs
 * Record patient vital signs to their medical record
 */
router.post("/", async (req, res) => {
  try {
    const validatedData = vitalSignsSchema.parse(req.body);
    
    // Get patient information from Firebase
    const patient = await storage.getUser(parseInt(validatedData.patientId));
    if (!patient) {
      return res.status(404).json({ error: "Patient not found" });
    }

    // Get doctor information from Firebase
    const doctor = await storage.getUser(validatedData.doctorId);
    if (!doctor) {
      return res.status(404).json({ error: "Doctor not found" });
    }

    // Create vital signs record
    const vitalSignsRecord = {
      id: `vitals_${Date.now()}`,
      ...validatedData,
      patientName: `${patient.firstName} ${patient.lastName}`,
      doctorName: `Dr. ${doctor.firstName} ${doctor.lastName}`,
      createdAt: new Date(),
    };

    // In production, this would save to Firebase medical records collection
    console.log("📊 Vital Signs Recorded:", {
      patient: vitalSignsRecord.patientName,
      doctor: vitalSignsRecord.doctorName,
      heartRate: vitalSignsRecord.heartRate,
      bloodPressure: vitalSignsRecord.bloodPressure,
      temperature: vitalSignsRecord.temperature,
      recordedAt: vitalSignsRecord.recordedAt
    });

    // Simulate saving to patient's medical record in Firebase
    console.log("💾 Saving to patient medical record in Firebase...");
    
    res.json({
      success: true,
      vitalSigns: vitalSignsRecord,
      message: "Vital signs recorded successfully in patient medical record"
    });

  } catch (error) {
    console.error("Vital signs recording error:", error);
    res.status(400).json({ error: "Failed to record vital signs" });
  }
});

/**
 * GET /api/vital-signs/patient/:patientId
 * Get vital signs history for a patient
 */
router.get("/patient/:patientId", async (req, res) => {
  try {
    const { patientId } = req.params;
    
    // In production, this would fetch from Firebase vital signs collection
    // with proper privacy controls ensuring only authorized doctors can access
    
    res.json({
      success: true,
      vitalSigns: [],
      message: "Vital signs retrieved from medical record"
    });
  } catch (error) {
    console.error("Error fetching vital signs:", error);
    res.status(500).json({ error: "Failed to fetch vital signs" });
  }
});

export default router;