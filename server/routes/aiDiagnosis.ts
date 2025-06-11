import express from "express";
import { GoogleGenerativeAI } from "@google/generative-ai";

const router = express.Router();

// Initialize Gemini AI
const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY || '');

router.post('/analyze', express.json(), async (req, res) => {
  try {
    const { symptoms, patientHistory, vitalSigns } = req.body;

    if (!symptoms || symptoms.length === 0) {
      return res.status(400).json({ error: 'Symptoms are required' });
    }

    const model = genAI.getGenerativeModel({ model: "gemini-pro" });

    const prompt = `
As a medical AI assistant, analyze the following patient information and provide clinical insights:

Symptoms: ${symptoms.join(', ')}
Patient History: ${patientHistory || 'Not provided'}
Current Vital Signs: ${vitalSigns ? JSON.stringify(vitalSigns) : 'Not provided'}

Please provide:
1. Possible differential diagnoses (most likely to least likely)
2. Recommended diagnostic tests or examinations
3. Treatment suggestions
4. Red flags or urgent concerns
5. Follow-up recommendations

Format your response as structured medical advice for healthcare professionals.
Note: This is AI-generated medical insight to assist healthcare providers and should not replace clinical judgment.
`;

    const result = await model.generateContent(prompt);
    const response = await result.response;
    const analysis = response.text();

    res.json({
      analysis,
      timestamp: new Date().toISOString(),
      symptoms,
      confidence: 'AI-Generated Medical Insight'
    });

  } catch (error) {
    console.error('AI Diagnosis error:', error);
    res.status(500).json({ 
      error: 'Failed to generate medical analysis',
      details: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

router.post('/drug-interactions', express.json(), async (req, res) => {
  try {
    const { medications } = req.body;

    if (!medications || medications.length === 0) {
      return res.status(400).json({ error: 'Medications list is required' });
    }

    const model = genAI.getGenerativeModel({ model: "gemini-pro" });

    const prompt = `
Analyze potential drug interactions for the following medications:
${medications.join(', ')}

Please provide:
1. Significant drug interactions
2. Severity levels (Major, Moderate, Minor)
3. Clinical recommendations
4. Monitoring requirements
5. Alternative medication suggestions if interactions are severe

Format as structured medical guidance for healthcare professionals.
`;

    const result = await model.generateContent(prompt);
    const response = await result.response;
    const analysis = response.text();

    res.json({
      analysis,
      medications,
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    console.error('Drug interaction analysis error:', error);
    res.status(500).json({ error: 'Failed to analyze drug interactions' });
  }
});

export default router;