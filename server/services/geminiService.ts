import { GoogleGenerativeAI, GenerativeModel, GenerationConfig } from '@google/generative-ai';

// Initialize the Gemini API
const apiKey = process.env.GEMINI_API_KEY;

if (!apiKey) {
  console.error('GEMINI_API_KEY is not defined. AI features will not work.');
}

const genAI = new GoogleGenerativeAI(apiKey || '');

// Model configuration
const modelName = 'gemini-1.5-pro';  // Updated to the latest Gemini model
const generationConfig: GenerationConfig = {
  temperature: 0.7,
  topP: 0.95,
  topK: 40,
  maxOutputTokens: 1024,
};

// Context for medical advice
const MEDICAL_SYSTEM_PROMPT = `
You are an AI health assistant helping with initial symptom assessment and general health advice.
Always begin responses with a clear disclaimer that you are not a doctor and this is not medical advice.
For any serious symptoms, recommend the user consult a healthcare professional.

When discussing symptoms:
1. Ask clarifying questions if needed
2. Provide general information about possible causes 
3. Suggest basic home remedies if appropriate
4. Clearly state when immediate medical attention might be required

Always be compassionate, clear, and factual without causing unnecessary alarm.
Avoid making definitive diagnoses or prescribing specific medications.
`;

export class GeminiService {
  private model: GenerativeModel;

  constructor() {
    this.model = genAI.getGenerativeModel({ 
      model: modelName,
      generationConfig,
    });
  }

  /**
   * Generate a response to a medical query
   */
  async getMedicalResponse(query: string, chatHistory: Array<{role: string, content: string}> = []): Promise<string> {
    try {
      // Start a chat session
      const chat = this.model.startChat({
        history: chatHistory.map(msg => ({
          role: msg.role === 'user' ? 'user' : 'model',
          parts: [{ text: msg.content }],
        })),
        systemInstruction: MEDICAL_SYSTEM_PROMPT,
      });

      // Generate a response
      const result = await chat.sendMessage(query);
      const response = result.response.text();
      
      return response;
    } catch (error: any) {
      console.error('Error getting AI response:', error);
      return 'I apologize, but I encountered an error processing your request. Please try again later.';
    }
  }

  /**
   * Analyze symptoms and provide health recommendations
   */
  async analyzeSymptoms(symptoms: string[], description: string): Promise<{
    recommendedAction: string;
    possibleCauses: string[];
    selfCare: string[];
    urgency: 'low' | 'medium' | 'high';
  }> {
    try {
      const promptText = `
        I need a structured analysis of the following health symptoms:
        Symptoms: ${symptoms.join(', ')}
        Additional description: ${description}
        
        Provide your response in the following JSON format:
        {
          "recommendedAction": "A short recommendation on what the person should do next",
          "possibleCauses": ["List 3-5 possible causes of these symptoms"],
          "selfCare": ["List 2-4 self-care recommendations if appropriate"],
          "urgency": "Rate urgency as low, medium, or high"
        }
        
        Only return the JSON with no additional text.
      `;

      const result = await this.model.generateContent(promptText);
      const response = result.response.text();
      
      try {
        // Handle responses that might be wrapped in markdown code blocks
        let jsonStr = response.trim();
        
        // Check if the response is wrapped in markdown code block ```json ... ```
        const codeBlockMatch = jsonStr.match(/```(?:json)?\s*([\s\S]*?)```/);
        if (codeBlockMatch && codeBlockMatch[1]) {
          jsonStr = codeBlockMatch[1].trim();
        }
        
        return JSON.parse(jsonStr);
      } catch (parseError) {
        console.error('Failed to parse AI response as JSON:', parseError);
        return {
          recommendedAction: "Please consult with a healthcare provider about your symptoms.",
          possibleCauses: ["Unable to determine based on available information"],
          selfCare: ["Rest and stay hydrated", "Monitor your symptoms"],
          urgency: "medium"
        };
      }
    } catch (error: any) {
      console.error('Error analyzing symptoms:', error);
      return {
        recommendedAction: "Please consult with a healthcare provider about your symptoms.",
        possibleCauses: ["Error in symptom analysis"],
        selfCare: ["Rest and stay hydrated", "Monitor your symptoms"],
        urgency: "medium"
      };
    }
  }

  /**
   * Get medicine information and recommendations
   */
  async getMedicineInfo(medicineName: string): Promise<{
    description: string;
    usages: string[];
    sideEffects: string[];
    precautions: string[];
    alternatives: string[];
  }> {
    try {
      const promptText = `
        I need information about this medication: ${medicineName}
        
        Provide your response in the following JSON format:
        {
          "description": "Brief description of what this medicine is",
          "usages": ["List 2-4 common uses of this medication"],
          "sideEffects": ["List 3-5 common side effects"],
          "precautions": ["List 2-3 important precautions"],
          "alternatives": ["List 2-3 alternative medications or treatments"]
        }
        
        Only return the JSON with no additional text.
      `;

      const result = await this.model.generateContent(promptText);
      const response = result.response.text();
      
      try {
        // Handle responses that might be wrapped in markdown code blocks
        let jsonStr = response.trim();
        
        // Check if the response is wrapped in markdown code block ```json ... ```
        const codeBlockMatch = jsonStr.match(/```(?:json)?\s*([\s\S]*?)```/);
        if (codeBlockMatch && codeBlockMatch[1]) {
          jsonStr = codeBlockMatch[1].trim();
        }
        
        return JSON.parse(jsonStr);
      } catch (parseError) {
        console.error('Failed to parse AI response as JSON:', parseError);
        return {
          description: "Information about this medication is not available.",
          usages: ["Consult with a healthcare provider"],
          sideEffects: ["Information not available"],
          precautions: ["Follow your doctor's instructions"],
          alternatives: ["Consult with a healthcare provider"]
        };
      }
    } catch (error: any) {
      console.error('Error getting medicine information:', error);
      return {
        description: "Information about this medication is not available.",
        usages: ["Consult with a healthcare provider"],
        sideEffects: ["Information not available"],
        precautions: ["Follow your doctor's instructions"],
        alternatives: ["Consult with a healthcare provider"]
      };
    }
  }
}

// Export a singleton instance
export const geminiService = new GeminiService();