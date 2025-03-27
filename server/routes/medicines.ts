import { Router, Request, Response } from "express";
import { log } from "../vite";
import { z } from "zod";
import { geminiService } from "../services/geminiService";

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
  prescriptionRequired: z.boolean(),
  reorderLevel: z.number().int().nonnegative().optional(),
  category: z.string().optional(),
  notes: z.string().optional(),
  supplier: z.string().optional()
});

const updateMedicineSchema = z.object({
  name: z.string().min(1).optional(),
  dosage: z.string().min(1).optional(),
  quantity: z.number().int().nonnegative().optional(),
  expiryDate: z.string().optional(),
  prescriptionRequired: z.boolean().optional(),
  reorderLevel: z.number().int().nonnegative().optional(),
  category: z.string().optional(),
  notes: z.string().optional(),
  supplier: z.string().optional()
});

const stockAdjustmentSchema = z.object({
  adjustment: z.number().int()
});

// Seed some initial data
const seedMedicines = () => {
  const userId = 1; // Sample user ID
  
  const addMedicine = (data: any) => {
    const id = medicineIdCounter++;
    const now = new Date().toISOString();
    
    // Add default values for new fields if not provided
    const medicineWithDefaults = {
      reorderLevel: 10,
      category: "General",
      inStock: true,
      notes: "",
      supplier: "",
      ...data,
      userId,
      createdAt: now,
      updatedAt: now
    };
    
    medicines.set(id, {
      id,
      ...medicineWithDefaults
    });
    
    return id;
  };
  
  // Add some sample medicines
  addMedicine({
    name: "Acetaminophen",
    dosage: "500mg",
    quantity: 20,
    expiryDate: new Date(new Date().setFullYear(new Date().getFullYear() + 1)).toISOString(),
    prescriptionRequired: false,
    category: "Pain Relief",
    reorderLevel: 15,
    notes: "For fever and pain relief. Take as directed."
  });
  
  addMedicine({
    name: "Ibuprofen",
    dosage: "200mg",
    quantity: 30,
    expiryDate: new Date(new Date().setFullYear(new Date().getFullYear() + 2)).toISOString(),
    prescriptionRequired: false,
    category: "Pain Relief",
    reorderLevel: 20,
    notes: "Anti-inflammatory, take with food."
  });
  
  addMedicine({
    name: "Amoxicillin",
    dosage: "250mg",
    quantity: 14,
    expiryDate: new Date(new Date().setMonth(new Date().getMonth() + 2)).toISOString(),
    prescriptionRequired: true,
    category: "Antibiotics",
    reorderLevel: 10,
    notes: "Complete the full course as prescribed."
  });
  
  addMedicine({
    name: "Lisinopril",
    dosage: "10mg",
    quantity: 3,
    expiryDate: new Date(new Date().setMonth(new Date().getMonth() + 3)).toISOString(),
    prescriptionRequired: true,
    category: "Blood Pressure",
    reorderLevel: 5,
    notes: "Take at the same time each day."
  });
  
  // Add a nearly expired medicine
  addMedicine({
    name: "Aspirin",
    dosage: "81mg",
    quantity: 45,
    expiryDate: new Date(new Date().setDate(new Date().getDate() + 20)).toISOString(),
    prescriptionRequired: false,
    category: "Pain Relief",
    reorderLevel: 15,
    notes: "Low-dose, take with water."
  });
  
  // Add a low stock medicine
  addMedicine({
    name: "Metformin",
    dosage: "500mg",
    quantity: 2,
    expiryDate: new Date(new Date().setMonth(new Date().getMonth() + 8)).toISOString(),
    prescriptionRequired: true,
    category: "Diabetes",
    reorderLevel: 15,
    notes: "Take with meals to reduce stomach upset."
  });
};

// Seed data on module load
seedMedicines();

/**
 * GET /api/medicines
 * Get all medicines for the current user with stock information
 */
router.get("/", (req: Request, res: Response) => {
  try {
    // In a real app, we would get the user ID from the authenticated session
    // For demo purposes, we'll use user ID 1
    const userId = 1;
    
    // Filter medicines for this user and add stock status
    const userMedicines = Array.from(medicines.values())
      .filter(medicine => medicine.userId === userId)
      .map(medicine => ({
        ...medicine,
        inStock: medicine.quantity > 0,
        lowStock: medicine.quantity <= (medicine.reorderLevel || 10)
      }));
    
    res.status(200).json(userMedicines);
  } catch (error) {
    console.error("Error fetching medicines:", error);
    res.status(500).json({ error: "Failed to fetch medicines" });
  }
});

/**
 * GET /api/medicines/low-stock
 * Get all medicines that are below their reorder level
 */
router.get("/low-stock", (req: Request, res: Response) => {
  try {
    const userId = 1; // Mock user ID
    
    const lowStockItems = Array.from(medicines.values())
      .filter(medicine => 
        medicine.userId === userId && 
        medicine.quantity <= (medicine.reorderLevel || 10)
      )
      .map(medicine => ({
        ...medicine,
        inStock: medicine.quantity > 0,
        lowStock: true
      }));
    
    res.status(200).json(lowStockItems);
    log(`Retrieved ${lowStockItems.length} low stock medicines`, "medicines");
  } catch (error) {
    console.error("Error fetching low stock medicines:", error);
    res.status(500).json({ error: "Failed to fetch low stock medicines" });
  }
});

/**
 * GET /api/medicines/expiring-soon
 * Get all medicines that are expiring within 90 days
 */
router.get("/expiring-soon", (req: Request, res: Response) => {
  try {
    const userId = 1; // Mock user ID
    const now = new Date();
    const ninetyDaysFromNow = new Date();
    ninetyDaysFromNow.setDate(now.getDate() + 90);
    
    const expiringItems = Array.from(medicines.values())
      .filter(medicine => {
        const expiryDate = new Date(medicine.expiryDate);
        return medicine.userId === userId &&
               expiryDate <= ninetyDaysFromNow && 
               expiryDate >= now;
      })
      .map(medicine => ({
        ...medicine,
        inStock: medicine.quantity > 0,
        daysUntilExpiry: Math.floor((new Date(medicine.expiryDate).getTime() - now.getTime()) / (1000 * 60 * 60 * 24))
      }));
    
    res.status(200).json(expiringItems);
    log(`Retrieved ${expiringItems.length} expiring medicines`, "medicines");
  } catch (error) {
    console.error("Error fetching expiring medicines:", error);
    res.status(500).json({ error: "Failed to fetch expiring medicines" });
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
router.post("/", async (req: Request, res: Response) => {
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
      inStock: validatedData.quantity > 0,
      userId,
      createdAt: now,
      updatedAt: now
    };
    
    // Try to get additional medicine info from Gemini AI
    try {
      const medicineInfo = await geminiService.getMedicineInfo(validatedData.name);
      
      // Only update notes if they weren't provided and we got something from the AI
      if (!validatedData.notes && medicineInfo.description) {
        newMedicine.notes = medicineInfo.description;
      }
      
      // Add usage information if available
      if (medicineInfo.usages && medicineInfo.usages.length > 0) {
        const usageText = medicineInfo.usages.join(', ');
        if (!newMedicine.notes?.includes(usageText)) {
          newMedicine.notes = (newMedicine.notes || '') + 
            (newMedicine.notes ? '\n\nUsage: ' : 'Usage: ') + 
            usageText;
        }
      }
      
      // Add side effects information if available
      if (medicineInfo.sideEffects && medicineInfo.sideEffects.length > 0) {
        const sideEffectsText = medicineInfo.sideEffects.join(', ');
        newMedicine.notes = (newMedicine.notes || '') + 
          (newMedicine.notes ? '\n\nPossible side effects: ' : 'Possible side effects: ') + 
          sideEffectsText;
      }
      
      log(`Enhanced medicine info for ${validatedData.name} with AI data`, "medicines");
    } catch (aiError) {
      console.error('Failed to get AI medicine info:', aiError);
      // Continue with adding the medicine even if AI enhancement fails
    }
    
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
 * GET /api/medicines/:id/info
 * Get detailed information about a medicine using AI
 */
router.get("/:id/info", async (req: Request, res: Response) => {
  try {
    const medicineId = parseInt(req.params.id);
    const medicine = medicines.get(medicineId);
    
    if (!medicine) {
      return res.status(404).json({ error: "Medicine not found" });
    }
    
    // In a real app, verify the medicine belongs to the current user
    const userId = 1;
    if (medicine.userId !== userId) {
      return res.status(403).json({ error: "Access denied" });
    }
    
    // Get additional information from Gemini AI
    try {
      const medicineInfo = await geminiService.getMedicineInfo(medicine.name);
      
      res.status(200).json({
        ...medicine,
        aiGeneratedInfo: medicineInfo
      });
      
      log(`Retrieved AI info for medicine: ${medicine.name}`, "medicines");
    } catch (error) {
      console.error("Error getting AI medicine info:", error);
      // Return the medicine without AI data if there's an error
      res.status(200).json({
        ...medicine,
        aiGeneratedInfo: {
          error: "Unable to retrieve AI-generated information at this time."
        }
      });
    }
  } catch (error) {
    console.error("Error fetching medicine info:", error);
    res.status(500).json({ error: "Failed to fetch medicine information" });
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
 * POST /api/medicines/:id/adjust-stock
 * Adjust the stock level of a medicine (increase or decrease)
 */
router.post("/:id/adjust-stock", (req: Request, res: Response) => {
  try {
    const medicineId = parseInt(req.params.id);
    const medicine = medicines.get(medicineId);
    
    if (!medicine) {
      return res.status(404).json({ error: "Medicine not found" });
    }
    
    // In a real app, verify the medicine belongs to the current user
    const userId = 1;
    if (medicine.userId !== userId) {
      return res.status(403).json({ error: "Access denied" });
    }
    
    // Validate the adjustment data
    const { adjustment } = stockAdjustmentSchema.parse(req.body);
    
    // Calculate the new quantity, ensuring it doesn't go below zero
    const newQuantity = Math.max(0, medicine.quantity + adjustment);
    
    // Update the medicine
    const updatedMedicine = {
      ...medicine,
      quantity: newQuantity,
      inStock: newQuantity > 0,
      lowStock: newQuantity <= (medicine.reorderLevel || 10),
      updatedAt: new Date().toISOString()
    };
    
    // Save to in-memory storage
    medicines.set(medicineId, updatedMedicine);
    
    if (adjustment > 0) {
      log(`Stock increased for ${medicine.name} by ${adjustment} units`, "medicines");
    } else {
      log(`Stock decreased for ${medicine.name} by ${Math.abs(adjustment)} units`, "medicines");
    }
    
    res.status(200).json(updatedMedicine);
  } catch (error) {
    console.error("Error adjusting stock:", error);
    
    if (error instanceof z.ZodError) {
      return res.status(400).json({ error: "Invalid adjustment data", details: error.errors });
    }
    
    res.status(500).json({ error: "Failed to adjust stock" });
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