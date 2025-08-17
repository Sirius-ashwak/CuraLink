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

// Seed comprehensive demo data
const seedMedicines = () => {
  const userId = 1; // Sample user ID
  
  const addMedicine = (data: any) => {
    const id = medicineIdCounter++;
    const now = new Date().toISOString();
    
    // Add default values for new fields if not provided
    const medicineWithDefaults = {
      reorderLevel: 10,
      category: "General",
      inStock: data.quantity > 0,
      lowStock: data.quantity <= (data.reorderLevel || 10),
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

  // Clear existing medicines first
  medicines.clear();
  medicineIdCounter = 1;
  // Clear existing medicines first
  medicines.clear();
  medicineIdCounter = 1;

  // Pain Relief & Anti-inflammatory
  addMedicine({
    name: "Acetaminophen",
    dosage: "500mg",
    quantity: 48,
    expiryDate: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000).toISOString(),
    prescriptionRequired: false,
    category: "Pain Relief",
    reorderLevel: 20,
    notes: "For fever and pain relief. Maximum 4g per day."
  });

  addMedicine({
    name: "Ibuprofen",
    dosage: "400mg",
    quantity: 30,
    expiryDate: new Date(Date.now() + 730 * 24 * 60 * 60 * 1000).toISOString(),
    prescriptionRequired: false,
    category: "Pain Relief",
    reorderLevel: 15,
    notes: "Anti-inflammatory. Take with food to avoid stomach upset."
  });

  addMedicine({
    name: "Aspirin",
    dosage: "81mg",
    quantity: 5, // Low stock
    expiryDate: new Date(Date.now() + 25 * 24 * 60 * 60 * 1000).toISOString(), // Expiring soon
    prescriptionRequired: false,
    category: "Pain Relief",
    reorderLevel: 15,
    notes: "Low-dose aspirin for heart protection. Take with water."
  });

  addMedicine({
    name: "Naproxen",
    dosage: "220mg",
    quantity: 20,
    expiryDate: new Date(Date.now() + 18 * 30 * 24 * 60 * 60 * 1000).toISOString(),
    prescriptionRequired: false,
    category: "Pain Relief",
    reorderLevel: 10,
    notes: "Long-acting pain relief. Take with food."
  });

  // Antibiotics
  addMedicine({
    name: "Amoxicillin",
    dosage: "500mg",
    quantity: 21,
    expiryDate: new Date(Date.now() + 60 * 24 * 60 * 60 * 1000).toISOString(),
    prescriptionRequired: true,
    category: "Antibiotics",
    reorderLevel: 15,
    notes: "Complete full course. Take every 8 hours with or without food."
  });

  addMedicine({
    name: "Azithromycin",
    dosage: "250mg",
    quantity: 6,
    expiryDate: new Date(Date.now() + 12 * 30 * 24 * 60 * 60 * 1000).toISOString(),
    prescriptionRequired: true,
    category: "Antibiotics",
    reorderLevel: 10,
    notes: "Z-pack antibiotic. Take once daily for 5 days."
  });

  addMedicine({
    name: "Ciprofloxacin",
    dosage: "500mg",
    quantity: 14,
    expiryDate: new Date(Date.now() + 15 * 30 * 24 * 60 * 60 * 1000).toISOString(),
    prescriptionRequired: true,
    category: "Antibiotics",
    reorderLevel: 10,
    notes: "Broad-spectrum antibiotic. Avoid dairy products within 2 hours."
  });

  // Diabetes Medications
  addMedicine({
    name: "Metformin",
    dosage: "500mg",
    quantity: 90,
    expiryDate: new Date(Date.now() + 24 * 30 * 24 * 60 * 60 * 1000).toISOString(),
    prescriptionRequired: true,
    category: "Diabetes",
    reorderLevel: 30,
    notes: "Take with meals to reduce GI upset. Monitor kidney function."
  });

  addMedicine({
    name: "Insulin Glargine",
    dosage: "100 units/mL",
    quantity: 2, // Low stock
    expiryDate: new Date(Date.now() + 3 * 30 * 24 * 60 * 60 * 1000).toISOString(),
    prescriptionRequired: true,
    category: "Diabetes",
    reorderLevel: 3,
    notes: "Long-acting insulin. Store in refrigerator. Inject once daily at same time."
  });

  addMedicine({
    name: "Glipizide",
    dosage: "5mg",
    quantity: 30,
    expiryDate: new Date(Date.now() + 18 * 30 * 24 * 60 * 60 * 1000).toISOString(),
    prescriptionRequired: true,
    category: "Diabetes",
    reorderLevel: 15,
    notes: "Take 30 minutes before meals. Monitor blood sugar levels."
  });

  // Blood Pressure Medications
  addMedicine({
    name: "Lisinopril",
    dosage: "10mg",
    quantity: 30,
    expiryDate: new Date(Date.now() + 20 * 30 * 24 * 60 * 60 * 1000).toISOString(),
    prescriptionRequired: true,
    category: "Blood Pressure",
    reorderLevel: 15,
    notes: "ACE inhibitor. Take at same time daily. Monitor for dry cough."
  });

  addMedicine({
    name: "Amlodipine",
    dosage: "5mg",
    quantity: 30,
    expiryDate: new Date(Date.now() + 22 * 30 * 24 * 60 * 60 * 1000).toISOString(),
    prescriptionRequired: true,
    category: "Blood Pressure",
    reorderLevel: 15,
    notes: "Calcium channel blocker. May cause ankle swelling."
  });

  addMedicine({
    name: "Losartan",
    dosage: "50mg",
    quantity: 30,
    expiryDate: new Date(Date.now() + 18 * 30 * 24 * 60 * 60 * 1000).toISOString(),
    prescriptionRequired: true,
    category: "Blood Pressure",
    reorderLevel: 15,
    notes: "ARB medication. Good alternative to ACE inhibitors."
  });

  // Cholesterol Medications
  addMedicine({
    name: "Atorvastatin",
    dosage: "20mg",
    quantity: 30,
    expiryDate: new Date(Date.now() + 15 * 30 * 24 * 60 * 60 * 1000).toISOString(),
    prescriptionRequired: true,
    category: "Cholesterol",
    reorderLevel: 15,
    notes: "Take in evening. Monitor liver function. Avoid grapefruit juice."
  });

  addMedicine({
    name: "Simvastatin",
    dosage: "40mg",
    quantity: 30,
    expiryDate: new Date(Date.now() + 16 * 30 * 24 * 60 * 60 * 1000).toISOString(),
    prescriptionRequired: true,
    category: "Cholesterol",
    reorderLevel: 15,
    notes: "Statin medication. Take in evening with dinner."
  });

  // Gastric Medications
  addMedicine({
    name: "Omeprazole",
    dosage: "20mg",
    quantity: 28,
    expiryDate: new Date(Date.now() + 24 * 30 * 24 * 60 * 60 * 1000).toISOString(),
    prescriptionRequired: false,
    category: "Gastric",
    reorderLevel: 14,
    notes: "Proton pump inhibitor. Take before breakfast on empty stomach."
  });

  addMedicine({
    name: "Ranitidine",
    dosage: "150mg",
    quantity: 30,
    expiryDate: new Date(Date.now() + 12 * 30 * 24 * 60 * 60 * 1000).toISOString(),
    prescriptionRequired: false,
    category: "Gastric",
    reorderLevel: 15,
    notes: "H2 blocker for acid reduction. Take with or without food."
  });

  // Vitamins & Supplements
  addMedicine({
    name: "Vitamin D3",
    dosage: "1000 IU",
    quantity: 60,
    expiryDate: new Date(Date.now() + 36 * 30 * 24 * 60 * 60 * 1000).toISOString(),
    prescriptionRequired: false,
    category: "Vitamins",
    reorderLevel: 30,
    notes: "Take with fat-containing meal for better absorption."
  });

  addMedicine({
    name: "Vitamin B12",
    dosage: "1000mcg",
    quantity: 100,
    expiryDate: new Date(Date.now() + 30 * 30 * 24 * 60 * 60 * 1000).toISOString(),
    prescriptionRequired: false,
    category: "Vitamins",
    reorderLevel: 50,
    notes: "For energy and nerve function. Sublingual tablets dissolve under tongue."
  });

  addMedicine({
    name: "Multivitamin",
    dosage: "1 tablet",
    quantity: 100,
    expiryDate: new Date(Date.now() + 24 * 30 * 24 * 60 * 60 * 1000).toISOString(),
    prescriptionRequired: false,
    category: "Vitamins",
    reorderLevel: 30,
    notes: "Daily multivitamin. Take with breakfast for best absorption."
  });

  // Respiratory Medications
  addMedicine({
    name: "Albuterol Inhaler",
    dosage: "90mcg/spray",
    quantity: 1, // Low stock
    expiryDate: new Date(Date.now() + 12 * 30 * 24 * 60 * 60 * 1000).toISOString(),
    prescriptionRequired: true,
    category: "Respiratory",
    reorderLevel: 2,
    notes: "Rescue inhaler for asthma. Shake well before use. 2 puffs as needed."
  });

  addMedicine({
    name: "Montelukast",
    dosage: "10mg",
    quantity: 30,
    expiryDate: new Date(Date.now() + 18 * 30 * 24 * 60 * 60 * 1000).toISOString(),
    prescriptionRequired: true,
    category: "Respiratory",
    reorderLevel: 15,
    notes: "Asthma prevention medication. Take in the evening."
  });

  // Antihistamines
  addMedicine({
    name: "Cetirizine",
    dosage: "10mg",
    quantity: 30,
    expiryDate: new Date(Date.now() + 36 * 30 * 24 * 60 * 60 * 1000).toISOString(),
    prescriptionRequired: false,
    category: "Antihistamines",
    reorderLevel: 15,
    notes: "For allergies. Non-drowsy formula. Take once daily."
  });

  addMedicine({
    name: "Loratadine",
    dosage: "10mg",
    quantity: 30,
    expiryDate: new Date(Date.now() + 30 * 30 * 24 * 60 * 60 * 1000).toISOString(),
    prescriptionRequired: false,
    category: "Antihistamines",
    reorderLevel: 15,
    notes: "24-hour allergy relief. Take once daily with or without food."
  });

  // Thyroid Medications
  addMedicine({
    name: "Levothyroxine",
    dosage: "75mcg",
    quantity: 30,
    expiryDate: new Date(Date.now() + 24 * 30 * 24 * 60 * 60 * 1000).toISOString(),
    prescriptionRequired: true,
    category: "Thyroid",
    reorderLevel: 15,
    notes: "Take on empty stomach, 30-60 minutes before breakfast. No coffee for 1 hour."
  });

  // Sleep & Anxiety
  addMedicine({
    name: "Melatonin",
    dosage: "3mg",
    quantity: 60,
    expiryDate: new Date(Date.now() + 24 * 30 * 24 * 60 * 60 * 1000).toISOString(),
    prescriptionRequired: false,
    category: "Sleep Aid",
    reorderLevel: 30,
    notes: "Natural sleep aid. Take 30 minutes before bedtime."
  });

  // Neurological
  addMedicine({
    name: "Gabapentin",
    dosage: "300mg",
    quantity: 90,
    expiryDate: new Date(Date.now() + 18 * 30 * 24 * 60 * 60 * 1000).toISOString(),
    prescriptionRequired: true,
    category: "Neurological",
    reorderLevel: 30,
    notes: "For nerve pain. May cause dizziness. Take with food."
  });

  // Blood Thinners
  addMedicine({
    name: "Warfarin",
    dosage: "5mg",
    quantity: 30,
    expiryDate: new Date(Date.now() + 24 * 30 * 24 * 60 * 60 * 1000).toISOString(),
    prescriptionRequired: true,
    category: "Blood Thinners",
    reorderLevel: 15,
    notes: "Monitor INR levels regularly. Consistent vitamin K intake. Same time daily."
  });

  // Diuretics
  addMedicine({
    name: "Furosemide",
    dosage: "40mg",
    quantity: 30,
    expiryDate: new Date(Date.now() + 12 * 30 * 24 * 60 * 60 * 1000).toISOString(),
    prescriptionRequired: true,
    category: "Diuretics",
    reorderLevel: 10,
    notes: "Water pill. Take in morning. May cause frequent urination and dizziness."
  });

  // Expired medicines for testing
  addMedicine({
    name: "Expired Cough Syrup",
    dosage: "10mL",
    quantity: 1,
    expiryDate: new Date(Date.now() - 60 * 24 * 60 * 60 * 1000).toISOString(), // 2 months ago
    prescriptionRequired: false,
    category: "Cough & Cold",
    reorderLevel: 5,
    notes: "EXPIRED - Dispose safely at pharmacy. Do not use."
  });

  addMedicine({
    name: "Old Antibiotic",
    dosage: "250mg",
    quantity: 8,
    expiryDate: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString(), // 1 month ago
    prescriptionRequired: true,
    category: "Antibiotics",
    reorderLevel: 10,
    notes: "EXPIRED - Return to pharmacy for proper disposal. Effectiveness reduced."
  });

  console.log(`🌱 Seeded ${medicines.size} demo medicines to database`);
  
  const allCategories = Array.from(medicines.values()).map(m => m.category);
  const uniqueCategories = Array.from(new Set(allCategories));
  console.log(`📋 Medicine categories added:`, uniqueCategories);
};

// Seed data on module load
console.log('🚀 Starting medicine seeding...');
seedMedicines();
console.log('✅ Medicine seeding completed');

/**
 * GET /api/medicines/health
 * Health check endpoint for medicines API
 */
router.get("/health", (req: Request, res: Response) => {
  try {
    const totalMedicines = medicines.size;
    const allCategories = Array.from(medicines.values()).map(m => m.category);
    const categories = Array.from(new Set(allCategories));
    
    res.status(200).json({ 
      status: "healthy",
      totalMedicines,
      categories,
      message: `Medicines API is working. ${totalMedicines} medicines available in ${categories.length} categories.`
    });
  } catch (error) {
    console.error("Health check error:", error);
    res.status(500).json({ error: "Health check failed" });
  }
});

/**
 * GET /api/medicines
 * Get all medicines for the current user with stock information
 */
router.get("/", (req: Request, res: Response) => {
  try {
    // In a real app, we would get the user ID from the authenticated session
    // For demo purposes, we'll use user ID 1
    const userId = 1;
    
    // Debug: Log total medicines count
    console.log(`📊 Total medicines in database: ${medicines.size}`);
    
    // Debug: Log all medicines
    const allMedicines = Array.from(medicines.values());
    console.log(`🔍 All medicines:`, allMedicines.map(m => `${m.name} (userId: ${m.userId})`));
    
    // Filter medicines for this user and add stock status
    const userMedicines = allMedicines
      .filter(medicine => medicine.userId === userId)
      .map(medicine => ({
        ...medicine,
        inStock: medicine.quantity > 0,
        lowStock: medicine.quantity <= (medicine.reorderLevel || 10)
      }));
    
    console.log(`👤 User ${userId} medicines count: ${userMedicines.length}`);
    
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

/**
 * POST /api/medicines/seed
 * Bulk seed medicines for demo purposes
 */
router.post("/seed", (req: Request, res: Response) => {
  try {
    const { medicines: seedMedicines } = req.body;
    
    if (!Array.isArray(seedMedicines)) {
      return res.status(400).json({ error: "Expected an array of medicines" });
    }
    
    const userId = 1; // Demo user ID
    let addedCount = 0;
    
    seedMedicines.forEach((medicineData: any) => {
      try {
        // Validate each medicine
        const validatedData = medicineSchema.parse(medicineData);
        
        const id = medicineIdCounter++;
        const now = new Date().toISOString();
        
        const newMedicine = {
          id,
          ...validatedData,
          lowStock: validatedData.quantity <= (validatedData.reorderLevel || 10),
          inStock: validatedData.quantity > 0,
          userId,
          createdAt: now,
          updatedAt: now
        };
        
        medicines.set(id, newMedicine);
        addedCount++;
        
      } catch (error) {
        console.error(`Failed to add medicine ${medicineData.name}:`, error);
      }
    });
    
    log(`Bulk seeded ${addedCount} medicines`, "medicines");
    
    res.status(201).json({ 
      message: `Successfully added ${addedCount} medicines`, 
      added: addedCount,
      total: medicines.size
    });
    
  } catch (error) {
    console.error("Error bulk seeding medicines:", error);
    res.status(500).json({ error: "Failed to seed medicines" });
  }
});

/**
 * POST /api/medicines/clear
 * Clear all medicines (for demo purposes)
 */
router.post("/clear", (req: Request, res: Response) => {
  try {
    const beforeCount = medicines.size;
    medicines.clear();
    medicineIdCounter = 1;
    
    log(`Cleared all medicines (${beforeCount} removed)`, "medicines");
    
    res.status(200).json({ 
      message: `Cleared ${beforeCount} medicines`,
      removed: beforeCount
    });
    
  } catch (error) {
    console.error("Error clearing medicines:", error);
    res.status(500).json({ error: "Failed to clear medicines" });
  }
});

export default router;