import { Router, Request, Response } from "express";
import { log } from "../vite";
import { z } from "zod";

const router = Router();

// In-memory storage for medicines
// In a real app, this would use the storage interface
const medicines = new Map<number, any>();
let medicineIdCounter = 1;

// Schemas for medicine operations
const medicineSchema = z.object({
  name: z.string().min(1),
  dosage: z.string().min(1),
  quantity: z.number().int().positive(),
  expiryDate: z.string(), // ISO date string
  prescriptionRequired: z.boolean()
});

const updateMedicineSchema = z.object({
  name: z.string().min(1).optional(),
  dosage: z.string().min(1).optional(),
  quantity: z.number().int().nonnegative().optional(),
  expiryDate: z.string().optional(),
  prescriptionRequired: z.boolean().optional()
});

// Seed some initial data
const seedMedicines = () => {
  const userId = 1; // Sample user ID
  
  const addMedicine = (data: any) => {
    const id = medicineIdCounter++;
    const now = new Date().toISOString();
    
    medicines.set(id, {
      id,
      ...data,
      userId,
      createdAt: now,
      updatedAt: now
    });
    
    return id;
  };
  
  // Add some sample medicines
  addMedicine({
    name: "Acetaminophen",
    dosage: "500mg",
    quantity: 20,
    expiryDate: new Date(new Date().setFullYear(new Date().getFullYear() + 1)).toISOString(),
    prescriptionRequired: false
  });
  
  addMedicine({
    name: "Ibuprofen",
    dosage: "200mg",
    quantity: 30,
    expiryDate: new Date(new Date().setFullYear(new Date().getFullYear() + 2)).toISOString(),
    prescriptionRequired: false
  });
  
  addMedicine({
    name: "Amoxicillin",
    dosage: "250mg",
    quantity: 14,
    expiryDate: new Date(new Date().setMonth(new Date().getMonth() + 2)).toISOString(),
    prescriptionRequired: true
  });
  
  addMedicine({
    name: "Lisinopril",
    dosage: "10mg",
    quantity: 3,
    expiryDate: new Date(new Date().setMonth(new Date().getMonth() + 3)).toISOString(),
    prescriptionRequired: true
  });
};

// Seed data on module load
seedMedicines();

/**
 * GET /api/medicines
 * Get all medicines for the current user
 */
router.get("/", (req: Request, res: Response) => {
  try {
    // In a real app, we would get the user ID from the authenticated session
    // For demo purposes, we'll use user ID 1
    const userId = 1;
    
    // Filter medicines for this user
    const userMedicines = Array.from(medicines.values())
      .filter(medicine => medicine.userId === userId);
    
    res.status(200).json(userMedicines);
  } catch (error) {
    console.error("Error fetching medicines:", error);
    res.status(500).json({ error: "Failed to fetch medicines" });
  }
});

/**
 * GET /api/medicines/:id
 * Get a specific medicine by ID
 */
router.get("/:id", (req: Request, res: Response) => {
  try {
    const medicineId = parseInt(req.params.id);
    const medicine = medicines.get(medicineId);
    
    if (!medicine) {
      return res.status(404).json({ error: "Medicine not found" });
    }
    
    // In a real app, verify the medicine belongs to the current user
    // For demo purposes, we'll use user ID 1
    const userId = 1;
    if (medicine.userId !== userId) {
      return res.status(403).json({ error: "Access denied" });
    }
    
    res.status(200).json(medicine);
  } catch (error) {
    console.error("Error fetching medicine:", error);
    res.status(500).json({ error: "Failed to fetch medicine" });
  }
});

/**
 * POST /api/medicines
 * Add a new medicine
 */
router.post("/", (req: Request, res: Response) => {
  try {
    // Validate request body
    const validatedData = medicineSchema.parse(req.body);
    
    // In a real app, get the user ID from the session
    // For demo purposes, we'll use user ID 1
    const userId = 1;
    
    // Create new medicine
    const id = medicineIdCounter++;
    const now = new Date().toISOString();
    
    const newMedicine = {
      id,
      ...validatedData,
      userId,
      createdAt: now,
      updatedAt: now
    };
    
    // Save to in-memory storage
    medicines.set(id, newMedicine);
    
    log(`Added new medicine: ${validatedData.name}`, "medicines");
    
    res.status(201).json(newMedicine);
  } catch (error) {
    console.error("Error adding medicine:", error);
    
    if (error instanceof z.ZodError) {
      return res.status(400).json({ error: "Invalid medicine data", details: error.errors });
    }
    
    res.status(500).json({ error: "Failed to add medicine" });
  }
});

/**
 * PATCH /api/medicines/:id
 * Update a medicine
 */
router.patch("/:id", (req: Request, res: Response) => {
  try {
    const medicineId = parseInt(req.params.id);
    const medicine = medicines.get(medicineId);
    
    if (!medicine) {
      return res.status(404).json({ error: "Medicine not found" });
    }
    
    // In a real app, verify the medicine belongs to the current user
    // For demo purposes, we'll use user ID 1
    const userId = 1;
    if (medicine.userId !== userId) {
      return res.status(403).json({ error: "Access denied" });
    }
    
    // Validate request body
    const validatedData = updateMedicineSchema.parse(req.body);
    
    // Update medicine
    const updatedMedicine = {
      ...medicine,
      ...validatedData,
      updatedAt: new Date().toISOString()
    };
    
    // Save to in-memory storage
    medicines.set(medicineId, updatedMedicine);
    
    log(`Updated medicine: ${medicine.name}`, "medicines");
    
    res.status(200).json(updatedMedicine);
  } catch (error) {
    console.error("Error updating medicine:", error);
    
    if (error instanceof z.ZodError) {
      return res.status(400).json({ error: "Invalid medicine data", details: error.errors });
    }
    
    res.status(500).json({ error: "Failed to update medicine" });
  }
});

/**
 * DELETE /api/medicines/:id
 * Delete a medicine
 */
router.delete("/:id", (req: Request, res: Response) => {
  try {
    const medicineId = parseInt(req.params.id);
    const medicine = medicines.get(medicineId);
    
    if (!medicine) {
      return res.status(404).json({ error: "Medicine not found" });
    }
    
    // In a real app, verify the medicine belongs to the current user
    // For demo purposes, we'll use user ID 1
    const userId = 1;
    if (medicine.userId !== userId) {
      return res.status(403).json({ error: "Access denied" });
    }
    
    // Delete from in-memory storage
    medicines.delete(medicineId);
    
    log(`Deleted medicine: ${medicine.name}`, "medicines");
    
    res.status(204).send();
  } catch (error) {
    console.error("Error deleting medicine:", error);
    res.status(500).json({ error: "Failed to delete medicine" });
  }
});

export default router;