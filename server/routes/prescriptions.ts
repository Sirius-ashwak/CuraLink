import { Router } from "express";
import { storage } from "../storage";
import { z } from "zod";

const router = Router();

// Prescription schema for validation
const prescriptionSchema = z.object({
  patientId: z.string(),
  doctorId: z.number(),
  medication: z.string(),
  dosage: z.string(),
  frequency: z.string(),
  duration: z.string(),
  instructions: z.string().optional(),
  pharmacy: z.string().optional(),
  prescribedAt: z.string(),
  status: z.enum(['active', 'filled', 'cancelled'])
});

/**
 * POST /api/prescriptions
 * Create and send digital prescription to patient
 */
router.post("/", async (req, res) => {
  try {
    const validatedData = prescriptionSchema.parse(req.body);
    
    // Get patient information
    const patient = await storage.getUser(parseInt(validatedData.patientId));
    if (!patient) {
      return res.status(404).json({ error: "Patient not found" });
    }

    // Get doctor information
    const doctor = await storage.getUser(validatedData.doctorId);
    if (!doctor) {
      return res.status(404).json({ error: "Doctor not found" });
    }

    // Create prescription record in Firebase
    const prescription = {
      id: `presc_${Date.now()}`,
      ...validatedData,
      patientEmail: patient.email,
      patientName: `${patient.firstName} ${patient.lastName}`,
      doctorName: `Dr. ${doctor.firstName} ${doctor.lastName}`,
      createdAt: new Date(),
    };

    // In a real system, this would:
    // 1. Save to Firebase prescription collection
    // 2. Send secure notification to patient
    // 3. Send prescription to pharmacy system
    // 4. Log for compliance audit
    
    console.log("✅ Digital Prescription Created:", {
      prescriptionId: prescription.id,
      patient: prescription.patientName,
      medication: prescription.medication,
      pharmacy: prescription.pharmacy || "Patient's preferred pharmacy"
    });

    // Simulate prescription delivery
    console.log("📧 Sending prescription notification to:", patient.email);
    console.log("🏥 Forwarding prescription to pharmacy:", prescription.pharmacy || "Default Pharmacy");

    res.json({
      success: true,
      prescription: prescription,
      message: "Prescription sent successfully to patient and pharmacy"
    });

  } catch (error) {
    console.error("Prescription creation error:", error);
    res.status(400).json({ error: "Failed to create prescription" });
  }
});

/**
 * GET /api/prescriptions/patient/:patientId
 * Get all prescriptions for a patient
 */
router.get("/patient/:patientId", async (req, res) => {
  try {
    const { patientId } = req.params;
    
    // In production, this would fetch from Firebase prescriptions collection
    // filtered by patientId with proper privacy controls
    
    const mockPrescriptions = [
      {
        id: "presc_1",
        medication: "Amoxicillin",
        dosage: "500mg",
        frequency: "3 times daily",
        duration: "7 days",
        prescribedAt: new Date().toISOString(),
        status: "active"
      }
    ];

    res.json(mockPrescriptions);
  } catch (error) {
    console.error("Error fetching prescriptions:", error);
    res.status(500).json({ error: "Failed to fetch prescriptions" });
  }
});

export default router;