import { GoogleGenerativeAI, GenerativeModel, GenerationConfig } from '@google/generative-ai';

// Initialize the Gemini API
const apiKey = process.env.GEMINI_API_KEY || '';

if (!apiKey) {
  console.error('GEMINI_API_KEY is not defined. AI features will not work.');
} else {
  console.log('GEMINI_API_KEY is configured. AI features are available.');
}

const genAI = new GoogleGenerativeAI(apiKey);

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
      // Enhanced prompt that encourages structured responses
      const adjustedQuery = `${MEDICAL_SYSTEM_PROMPT}

Format your response with:
- Clear paragraphs with line breaks between them
- Bullet points for lists (use * or - for bullet points)
- Numbered lists where appropriate (1., 2., etc.)
- Bold text for important information (use ** around important text)

User question: ${query}`;
      
      // For the chat history, we'll ensure it follows Gemini API requirements
      // The first message must be from the user to meet API requirements
      let formattedHistory: Array<{role: string; parts: Array<{text: string}>}> = [];
      
      if (chatHistory.length > 0) {
        // Ensure the first message is from the user
        if (chatHistory[0].role !== 'user') {
          // If first message isn't from user, we'll use the direct content generation
          // instead of chat history
          formattedHistory = [];
        } else {
          // Format the chat history correctly for Gemini API
          formattedHistory = chatHistory.map(msg => ({
            role: msg.role === 'user' ? 'user' : 'model',
            parts: [{ text: msg.content }],
          }));
        }
      }
      
      // If we have valid chat history, use it, otherwise make a direct request
      let response;
      if (formattedHistory.length > 0) {
        const chat = this.model.startChat({
          history: formattedHistory
        });
        
        const result = await chat.sendMessage(adjustedQuery);
        response = result.response.text();
      } else {
        // For the first message, we can use generateContent directly
        const result = await this.model.generateContent(adjustedQuery);
        response = result.response.text();
      }
      
      // Ensure response has proper formatting and structure
      let formattedResponse = response;
      
      // Add line breaks if the response doesn't have them
      if (!formattedResponse.includes('\n\n') && formattedResponse.length > 200) {
        // Split long paragraphs for better readability
        formattedResponse = formattedResponse.replace(/\. /g, '.\n\n');
      }
      
      return formattedResponse;
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

  /**
   * Process and transcribe voice data
   * This method processes voice transcripts through Gemini for improved accuracy
   */
  async processVoiceTranscript(transcript: string): Promise<string> {
    try {
      const promptText = `
        I need you to correct and improve this voice transcript for a medical assistant:
        "${transcript}"
        
        Correct any obvious errors in the transcript.
        If medical terms are misrecognized, fix them to their likely correct versions.
        Return only the corrected transcript text without any additional explanation.
      `;

      const result = await this.model.generateContent(promptText);
      const response = result.response.text();
      
      return response.trim();
    } catch (error: any) {
      console.error('Error processing voice transcript:', error);
      // Return the original transcript if there's an error
      return transcript;
    }
  }

  /**
   * Analyze an image and provide medical insights
   * Takes a base64-encoded image and returns analysis
   */
  async analyzeImage(imageBase64: string, userDescription: string = ""): Promise<{
    observations: string[];
    possibleConditions: string[];
    recommendations: string[];
    furtherQuestions: string[];
  }> {
    try {
      // For Gemini 1.5 Pro that supports multimodal inputs
      // We need to create a model that accepts images
      const visionModel = genAI.getGenerativeModel({ 
        model: modelName, 
        generationConfig,
      });

      const prompt = `
        ${MEDICAL_SYSTEM_PROMPT}
        
        Analyze this medical image and provide insights.
        ${userDescription ? `User description: ${userDescription}` : ''}
        
        Provide your response in the following JSON format:
        {
          "observations": ["List 3-4 visible observations from the image"],
          "possibleConditions": ["List 2-3 potential conditions that might be related"],
          "recommendations": ["List 2-3 recommended steps or actions"],
          "furtherQuestions": ["List 2-3 questions you would ask to better assess the situation"]
        }
        
        Only return the JSON with no additional text.
      `;

      // Remove the data URL prefix if present to get just the base64 data
      const base64Data = imageBase64.replace(/^data:image\/\w+;base64,/, '');
      
      // Create the parts array with both the text prompt and the image
      const parts = [
        { text: prompt },
        { inlineData: { data: base64Data, mimeType: "image/jpeg" } }
      ];

      const result = await visionModel.generateContent({ contents: [{ role: "user", parts }] });
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
        console.error('Failed to parse AI image analysis as JSON:', parseError);
        return {
          observations: ["Unable to analyze the image clearly"],
          possibleConditions: ["Image analysis inconclusive"],
          recommendations: ["Consider taking a clearer image", "Consult with a healthcare provider"],
          furtherQuestions: ["Can you describe what you're concerned about?", "How long have you noticed this?"]
        };
      }
    } catch (error: any) {
      console.error('Error analyzing image:', error);
      return {
        observations: ["Error processing the image"],
        possibleConditions: ["Unable to analyze due to technical issues"],
        recommendations: ["Try uploading a different image", "Consult with a healthcare provider directly"],
        furtherQuestions: ["Can you describe your symptoms instead?"]
      };
    }
  }
}

// Export a singleton instance
export const geminiService = new GeminiService();