import { Router, Request, Response } from "express";
import { storage } from "../storage";
import { log } from "../vite";

const router = Router();

// Symptom categories for the doctor matcher UI
const symptomCategories = [
  {
    id: "general",
    name: "General Health",
    symptoms: [
      { id: "fever", name: "Fever" },
      { id: "fatigue", name: "Fatigue" },
      { id: "weightLoss", name: "Unexplained Weight Loss" }
    ]
  },
  {
    id: "respiratory",
    name: "Respiratory System",
    symptoms: [
      { id: "cough", name: "Cough" },
      { id: "shortnessOfBreath", name: "Shortness of Breath" },
      { id: "soreThroat", name: "Sore Throat" },
      { id: "nasalCongestion", name: "Nasal Congestion" }
    ]
  },
  {
    id: "cardiovascular",
    name: "Cardiovascular System",
    symptoms: [
      { id: "chestPain", name: "Chest Pain" },
      { id: "palpitations", name: "Palpitations" },
      { id: "edema", name: "Swelling in Legs/Ankles" }
    ]
  },
  {
    id: "digestive",
    name: "Digestive System",
    symptoms: [
      { id: "abdominalPain", name: "Abdominal Pain" },
      { id: "nausea", name: "Nausea or Vomiting" },
      { id: "diarrhea", name: "Diarrhea" },
      { id: "constipation", name: "Constipation" }
    ]
  },
  {
    id: "musculoskeletal",
    name: "Musculoskeletal System",
    symptoms: [
      { id: "jointPain", name: "Joint Pain" },
      { id: "backPain", name: "Back Pain" },
      { id: "musclePain", name: "Muscle Pain" }
    ]
  },
  {
    id: "neurological",
    name: "Neurological System",
    symptoms: [
      { id: "headache", name: "Headache" },
      { id: "dizziness", name: "Dizziness" },
      { id: "numbness", name: "Numbness/Tingling" },
      { id: "visionChanges", name: "Vision Changes" }
    ]
  },
  {
    id: "mental",
    name: "Mental Health",
    symptoms: [
      { id: "anxiety", name: "Anxiety" },
      { id: "depression", name: "Depression" },
      { id: "sleepIssues", name: "Sleep Problems" }
    ]
  }
];

// Function to match doctors based on symptoms and urgency
const matchDoctors = async (symptoms: string[], urgencyLevel: number) => {
  const allDoctors = await storage.getDoctors();
  
  // Maps medical specialties to symptom categories
  const specialtyMap: { [key: string]: string[] } = {
    "General Practitioner": ["general", "respiratory", "digestive"],
    "Cardiology": ["cardiovascular", "general"],
    "Pulmonology": ["respiratory", "general"],
    "Gastroenterology": ["digestive", "general"],
    "Orthopedics": ["musculoskeletal"],
    "Neurology": ["neurological", "headache"],
    "Psychiatry": ["mental"],
    "Internal Medicine": ["general", "cardiovascular", "respiratory", "digestive"],
    "Emergency Medicine": ["general", "cardiovascular", "respiratory"]
  };
  
  // Get symptom categories from symptom IDs
  const getSymptomCategories = (symptomIds: string[]) => {
    const categories = new Set<string>();
    
    for (const category of symptomCategories) {
      for (const symptom of category.symptoms) {
        if (symptomIds.includes(symptom.id)) {
          categories.add(category.id);
          break;
        }
      }
    }
    
    return Array.from(categories);
  };
  
  // Calculate match score for each doctor
  const patientCategories = getSymptomCategories(symptoms);
  const matchResults = allDoctors.map(doctor => {
    // Get relevant specialty categories
    const doctorCategories = specialtyMap[doctor.specialty] || [];
    
    // Calculate category overlap
    const matchingCategories = patientCategories.filter(category => 
      doctorCategories.includes(category)
    );
    
    // Basic scoring algorithm
    let score = matchingCategories.length / patientCategories.length * 100;
    
    // Adjust score based on urgency
    if (urgencyLevel >= 8 && doctor.specialty === "Emergency Medicine") {
      score += 30;
    } else if (urgencyLevel >= 5 && doctor.specialty === "Internal Medicine") {
      score += 15;
    } else if (urgencyLevel <= 3 && doctor.specialty === "General Practitioner") {
      score += 10;
    }
    
    // Add some randomness to differentiate doctors with same specialty
    score += Math.random() * 5;
    
    // Generate reasoning text
    let reasoning = "";
    if (matchingCategories.length > 0) {
      reasoning = `Dr. ${doctor.user.lastName} specializes in ${doctor.specialty}, which addresses your ${matchingCategories.join(", ")} symptoms.`;
    } else {
      reasoning = `Dr. ${doctor.user.lastName} is a ${doctor.specialty} specialist.`;
    }
    
    if (urgencyLevel >= 8 && doctor.specialty === "Emergency Medicine") {
      reasoning += " Given the urgency of your situation, an Emergency Medicine specialist is recommended.";
    }
    
    return {
      score: Math.round(score),
      doctorId: doctor.id,
      specialty: doctor.specialty,
      reasoning
    };
  });
  
  // Sort by score (highest first) and return top results
  return matchResults.sort((a, b) => b.score - a.score);
};

/**
 * POST /api/doctor-match
 * Find matching doctors based on symptoms and urgency
 */
router.post("/", async (req: Request, res: Response) => {
  try {
    const { symptoms, urgencyLevel } = req.body;
    
    if (!symptoms || !Array.isArray(symptoms) || symptoms.length === 0) {
      return res.status(400).json({ error: "Please provide a list of symptoms" });
    }
    
    if (typeof urgencyLevel !== 'number' || urgencyLevel < 1 || urgencyLevel > 10) {
      return res.status(400).json({ error: "Urgency level must be a number between 1 and 10" });
    }
    
    // Get doctor matches
    const matches = await matchDoctors(symptoms, urgencyLevel);
    
    // Get full doctor information for the top matches
    const doctors = await Promise.all(
      matches.slice(0, 5).map(async match => {
        const doctor = await storage.getDoctor(match.doctorId);
        if (!doctor) return null;
        
        const user = await storage.getUser(doctor.userId);
        if (!user) return null;
        
        const { password: _, ...userData } = user;
        return { ...doctor, user: userData };
      })
    );
    
    // Filter out any null results
    const validDoctors = doctors.filter(doctor => doctor !== null);
    
    // Combine doctor info with match results
    const results = matches.slice(0, 5).map(match => {
      const doctorInfo = validDoctors.find(d => d?.id === match.doctorId);
      return { ...match, doctor: doctorInfo };
    }).filter(result => result.doctor !== undefined);
    
    log(`Doctor matcher used: ${symptoms.join(", ")} (Urgency: ${urgencyLevel})`, "doctor-matcher");
    
    res.status(200).json({ matches: results });
  } catch (error) {
    console.error("Doctor matcher error:", error);
    res.status(500).json({ error: "Failed to match doctors" });
  }
});

/**
 * GET /api/symptom-categories
 * Get symptom categories for the doctor matcher UI
 */
router.get("/symptom-categories", (_req: Request, res: Response) => {
  try {
    res.status(200).json(symptomCategories);
  } catch (error) {
    console.error("Get symptom categories error:", error);
    res.status(500).json({ error: "Failed to get symptom categories" });
  }
});

export default router;