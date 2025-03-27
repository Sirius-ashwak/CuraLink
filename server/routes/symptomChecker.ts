import { Router, Request, Response } from "express";
import { log } from "../vite";

const router = Router();

// Symptom checker knowledge base
const symptomInfo: { [key: string]: string } = {
  headache: "Common symptom that can be related to various conditions from stress to serious medical issues.",
  fever: "Elevated body temperature, often indicating an infection or inflammation.",
  cough: "Could be due to irritation, infection, or chronic conditions affecting the respiratory system.",
  fatigue: "Feeling of tiredness or exhaustion that doesn't improve with rest, common in many medical conditions.",
  shortnessOfBreath: "Difficulty breathing or feeling like you can't get enough air, can indicate respiratory or cardiac issues.",
  chestPain: "Pain or discomfort in the chest, can be related to heart problems, respiratory issues, or muscle strain.",
  abdominalPain: "Pain in the stomach or belly area, may relate to digestive issues, infections, or other conditions.",
  nausea: "Feeling of sickness with an urge to vomit, can be caused by many factors including infections, medications, or motion sickness.",
  vomiting: "Forceful expulsion of stomach contents, often accompanying nausea and various medical conditions.",
  diarrhea: "Loose or watery stools, often indicating digestive system upset or infection.",
  rash: "Skin changes including redness, bumps, or itching, can be allergic reactions or symptoms of various conditions.",
  jointPain: "Pain in the joints, often related to inflammation, injury, or arthritis.",
  backPain: "Pain in the lower, middle, or upper back, can be due to strain, injury, or chronic conditions.",
  dizziness: "Feeling lightheaded, unsteady, or like the room is spinning, may indicate various conditions including inner ear issues.",
  weightLoss: "Unexplained loss of body weight, may indicate numerous medical conditions requiring evaluation."
};

// Function to analyze symptoms
const analyzeSymptoms = (symptoms: string[], urgencyLevel: number) => {
  const recommendations: string[] = [];
  let emergencyCare = false;
  let doctorVisit = false;
  
  // General recommendation based on urgency
  if (urgencyLevel >= 8) {
    recommendations.push("Seek immediate medical attention for your symptoms.");
    emergencyCare = true;
  } else if (urgencyLevel >= 5) {
    recommendations.push("Based on your symptoms, it's recommended to schedule a doctor appointment soon.");
    doctorVisit = true;
  } else {
    recommendations.push("Your symptoms appear mild. Monitor them and schedule a doctor visit if they worsen or persist.");
  }
  
  // Specific recommendations for common symptoms
  for (const symptom of symptoms) {
    if (symptom === "headache") {
      recommendations.push("headache: Schedule a doctor appointment if headaches are frequent or worsening.");
      doctorVisit = true;
    } else if (symptom === "fever") {
      recommendations.push("fever: Monitor your temperature. If it persists for more than 3 days, consult a doctor.");
      doctorVisit = true;
    } else if (symptom === "chestPain") {
      recommendations.push("chest pain: This may indicate a serious condition. Seek medical attention promptly.");
      emergencyCare = true;
    } else if (symptom === "shortnessOfBreath") {
      recommendations.push("shortness of breath: This may indicate a serious condition. Seek medical attention if severe.");
      emergencyCare = urgencyLevel >= 7;
    } else if (symptom === "abdominalPain") {
      recommendations.push("abdominal pain: If severe or accompanied by other symptoms, consult a doctor.");
      doctorVisit = true;
    } else if (symptom === "rash") {
      recommendations.push("rash: Monitor for changes. If it spreads or is accompanied by fever, consult a doctor.");
    }
  }
  
  // Add emergency recommendation if certain symptoms are present
  const emergencySymptoms = ["chestPain", "shortnessOfBreath"];
  if (emergencySymptoms.some(s => symptoms.includes(s)) && urgencyLevel >= 7) {
    emergencyCare = true;
    if (!recommendations.some(r => r.includes("emergency") || r.includes("immediate"))) {
      recommendations.unshift("Seek immediate medical attention for your symptoms.");
    }
  }
  
  return {
    recommendations,
    emergencyCare,
    doctorVisit
  };
};

/**
 * POST /api/symptom-checker
 * Analyze symptoms and provide recommendations
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
    
    // Analyze symptoms
    const analysis = analyzeSymptoms(symptoms, urgencyLevel);
    
    log(`Symptom checker used: ${symptoms.join(", ")} (Urgency: ${urgencyLevel})`, "symptom-checker");
    
    res.status(200).json(analysis);
  } catch (error) {
    console.error("Symptom checker error:", error);
    res.status(500).json({ error: "Failed to analyze symptoms" });
  }
});

export default router;