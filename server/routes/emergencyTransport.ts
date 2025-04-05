import { Router, Request, Response } from "express";
import { storage } from "../storage";
import { insertEmergencyTransportSchema } from "@shared/schema";
import { z } from "zod";
import { wss } from "../routes";

const router = Router();

/**
 * GET /api/emergency-transport
 * Get all active emergency transport requests
 */
router.get("/", async (_req: Request, res: Response) => {
  try {
    const transports = await storage.getActiveEmergencyTransports();
    res.json(transports);
  } catch (error) {
    console.error("Error fetching active emergency transports:", error);
    res.status(500).json({ message: "Failed to fetch emergency transports" });
  }
});

/**
 * GET /api/emergency-transport/patient/:patientId
 * Get all emergency transport requests for a specific patient
 */
router.get("/patient/:patientId", async (req: Request, res: Response) => {
  try {
    const patientId = parseInt(req.params.patientId);
    if (isNaN(patientId)) {
      return res.status(400).json({ message: "Invalid patient ID" });
    }
    
    const transports = await storage.getEmergencyTransportsByPatient(patientId);
    res.json(transports);
  } catch (error) {
    console.error("Error fetching patient emergency transports:", error);
    res.status(500).json({ message: "Failed to fetch emergency transports" });
  }
});

/**
 * GET /api/emergency-transport/:id
 * Get a specific emergency transport request
 */
router.get("/:id", async (req: Request, res: Response) => {
  try {
    const id = parseInt(req.params.id);
    if (isNaN(id)) {
      return res.status(400).json({ message: "Invalid transport ID" });
    }
    
    const transport = await storage.getEmergencyTransport(id);
    if (!transport) {
      return res.status(404).json({ message: "Emergency transport not found" });
    }
    
    res.json(transport);
  } catch (error) {
    console.error("Error fetching emergency transport:", error);
    res.status(500).json({ message: "Failed to fetch emergency transport" });
  }
});

/**
 * POST /api/emergency-transport
 * Create a new emergency transport request
 */
router.post("/", async (req: Request, res: Response) => {
  try {
    const validationResult = insertEmergencyTransportSchema.safeParse(req.body);
    if (!validationResult.success) {
      return res.status(400).json({ 
        message: "Invalid emergency transport data",
        errors: validationResult.error.errors
      });
    }
    
    const transport = await storage.createEmergencyTransport(validationResult.data);
    
    // Send WebSocket notification to doctors about the new emergency transport request
    const patient = await storage.getUser(transport.patientId);
    wss.clients.forEach((client: any) => {
      if (client.readyState === 1 && client.role === 'doctor') { // OPEN = 1
        client.send(JSON.stringify({
          type: "newEmergencyTransport",
          transportId: transport.id,
          patientId: transport.patientId,
          patientName: patient ? `${patient.firstName} ${patient.lastName}` : "Unknown Patient",
          location: transport.pickupLocation,
          urgency: transport.urgency,
          reason: transport.reason,
          timestamp: new Date().toISOString()
        }));
      }
    });
    
    res.status(201).json(transport);
  } catch (error) {
    console.error("Error creating emergency transport:", error);
    res.status(500).json({ message: "Failed to create emergency transport" });
  }
});

/**
 * PATCH /api/emergency-transport/:id/assign
 * Assign a driver to an emergency transport request
 */
router.patch("/:id/assign", async (req: Request, res: Response) => {
  try {
    const id = parseInt(req.params.id);
    if (isNaN(id)) {
      return res.status(400).json({ message: "Invalid transport ID" });
    }
    
    const assignSchema = z.object({
      driverName: z.string(),
      driverPhone: z.string(),
      estimatedArrival: z.string().transform(val => new Date(val))
    });
    
    const validationResult = assignSchema.safeParse(req.body);
    if (!validationResult.success) {
      return res.status(400).json({ 
        message: "Invalid driver assignment data",
        errors: validationResult.error.errors
      });
    }
    
    const { driverName, driverPhone, estimatedArrival } = validationResult.data;
    
    const transport = await storage.assignDriverToEmergencyTransport(
      id,
      driverName,
      driverPhone,
      estimatedArrival
    );
    
    res.json(transport);
  } catch (error) {
    console.error("Error assigning driver to emergency transport:", error);
    res.status(500).json({ message: "Failed to assign driver to emergency transport" });
  }
});

/**
 * PATCH /api/emergency-transport/:id/complete
 * Mark an emergency transport request as complete
 */
router.patch("/:id/complete", async (req: Request, res: Response) => {
  try {
    const id = parseInt(req.params.id);
    if (isNaN(id)) {
      return res.status(400).json({ message: "Invalid transport ID" });
    }
    
    const transport = await storage.completeEmergencyTransport(id);
    res.json(transport);
  } catch (error) {
    console.error("Error completing emergency transport:", error);
    res.status(500).json({ message: "Failed to complete emergency transport" });
  }
});

/**
 * PATCH /api/emergency-transport/:id/cancel
 * Cancel an emergency transport request
 */
router.patch("/:id/cancel", async (req: Request, res: Response) => {
  try {
    const id = parseInt(req.params.id);
    if (isNaN(id)) {
      return res.status(400).json({ message: "Invalid transport ID" });
    }
    
    const transport = await storage.cancelEmergencyTransport(id);
    res.json(transport);
  } catch (error) {
    console.error("Error canceling emergency transport:", error);
    res.status(500).json({ message: "Failed to cancel emergency transport" });
  }
});

/**
 * PATCH /api/emergency-transport/:id
 * Update an emergency transport request
 */
router.patch("/:id", async (req: Request, res: Response) => {
  try {
    const id = parseInt(req.params.id);
    if (isNaN(id)) {
      return res.status(400).json({ message: "Invalid transport ID" });
    }
    
    // Only allow updating certain fields
    const updateSchema = z.object({
      pickupLocation: z.string().optional(),
      pickupCoordinates: z.string().optional(),
      destination: z.string().optional(),
      reason: z.string().optional(),
      urgency: z.enum(["low", "medium", "high", "critical"]).optional(),
      vehicleType: z.enum(["ambulance", "wheelchair_van", "medical_car", "helicopter"]).optional(),
      notes: z.string().optional(),
      assignedHospital: z.string().optional()
    });
    
    const validationResult = updateSchema.safeParse(req.body);
    if (!validationResult.success) {
      return res.status(400).json({ 
        message: "Invalid emergency transport update data",
        errors: validationResult.error.errors
      });
    }
    
    const transport = await storage.updateEmergencyTransport(id, validationResult.data);
    res.json(transport);
  } catch (error) {
    console.error("Error updating emergency transport:", error);
    res.status(500).json({ message: "Failed to update emergency transport" });
  }
});

export default router;
/**
 * GET /api/emergency-transport/:id/location
 * Get current location of emergency transport vehicle
 */
router.get("/:id/location", async (req: Request, res: Response) => {
  try {
    const id = parseInt(req.params.id);
    if (isNaN(id)) {
      return res.status(400).json({ message: "Invalid transport ID" });
    }
    
    const transport = await storage.getEmergencyTransport(id);
    if (!transport) {
      return res.status(404).json({ message: "Emergency transport not found" });
    }

    // This should be replaced with actual driver location tracking logic
    // For now, returning simulated location near the pickup coordinates
    const [lat, lng] = transport.pickupCoordinates.split(',').map(Number);
    res.json({
      location: {
        lat: lat + (Math.random() - 0.5) * 0.01,
        lng: lng + (Math.random() - 0.5) * 0.01
      }
    });
  } catch (error) {
    console.error("Error fetching transport location:", error);
    res.status(500).json({ message: "Failed to fetch transport location" });
  }
});
