import { storage } from './googleCloudConfig';
import { firestore } from './firebaseConfig';
import { collection, doc, setDoc, getDoc, getDocs, query, where } from 'firebase/firestore';
import { ref as storageRef, uploadBytes, getDownloadURL } from 'firebase/storage';

interface ARModel {
  id: string;
  name: string;
  description: string;
  category: 'anatomy' | 'procedure' | 'device' | 'condition' | 'treatment';
  modelUrl: string;
  thumbnailUrl: string;
  scale: number;
  position: { x: number; y: number; z: number };
  rotation: { x: number; y: number; z: number };
  tags: string[];
  interactionPoints?: {
    position: { x: number; y: number; z: number };
    title: string;
    description: string;
  }[];
  createdAt: Date;
  lastUpdated: Date;
}

interface ARExplanation {
  id: string;
  modelId: string;
  title: string;
  explanationText: string;
  voiceoverUrl?: string;
  steps?: {
    stepNumber: number;
    title: string;
    description: string;
    highlightAreaId?: string;
  }[];
  createdAt: Date;
}

/**
 * Augmented Reality Medical Education Service
 * Enables interactive AR experiences for medical education
 */
export class ARMedicalEducationService {
  /**
   * Get AR models for specific medical category
   */
  async getARModels(category?: string): Promise<ARModel[]> {
    try {
      let modelsQuery;
      
      if (category) {
        modelsQuery = query(
          collection(firestore, 'arModels'),
          where('category', '==', category)
        );
      } else {
        modelsQuery = collection(firestore, 'arModels');
      }
      
      const snapshot = await getDocs(modelsQuery);
      
      if (snapshot.empty) {
        return [];
      }
      
      const models: ARModel[] = [];
      snapshot.forEach(doc => {
        const data = doc.data();
        models.push({
          ...data,
          id: doc.id,
          createdAt: data.createdAt.toDate(),
          lastUpdated: data.lastUpdated.toDate()
        } as ARModel);
      });
      
      return models;
    } catch (error: any) {
      console.error('Error getting AR models:', error);
      throw new Error(`Failed to get AR models: ${error.message}`);
    }
  }
  
  /**
   * Get a specific AR model by ID
   */
  async getARModel(modelId: string): Promise<ARModel | null> {
    try {
      const modelRef = doc(firestore, 'arModels', modelId);
      const modelSnap = await getDoc(modelRef);
      
      if (!modelSnap.exists()) {
        return null;
      }
      
      const data = modelSnap.data();
      return {
        ...data,
        id: modelSnap.id,
        createdAt: data.createdAt.toDate(),
        lastUpdated: data.lastUpdated.toDate()
      } as ARModel;
    } catch (error: any) {
      console.error('Error getting AR model:', error);
      throw new Error(`Failed to get AR model: ${error.message}`);
    }
  }
  
  /**
   * Get explanations for a specific AR model
   */
  async getARExplanations(modelId: string): Promise<ARExplanation[]> {
    try {
      const explanationsQuery = query(
        collection(firestore, 'arExplanations'),
        where('modelId', '==', modelId)
      );
      
      const snapshot = await getDocs(explanationsQuery);
      
      if (snapshot.empty) {
        return [];
      }
      
      const explanations: ARExplanation[] = [];
      snapshot.forEach(doc => {
        const data = doc.data();
        explanations.push({
          ...data,
          id: doc.id,
          createdAt: data.createdAt.toDate()
        } as ARExplanation);
      });
      
      return explanations;
    } catch (error: any) {
      console.error('Error getting AR explanations:', error);
      throw new Error(`Failed to get AR explanations: ${error.message}`);
    }
  }
  
  /**
   * Upload a 3D model for AR
   */
  async uploadARModel(
    file: Buffer, 
    filename: string, 
    metadata: Omit<ARModel, 'id' | 'modelUrl' | 'createdAt' | 'lastUpdated'>
  ): Promise<ARModel> {
    try {
      // Upload model file to Google Cloud Storage
      const modelPath = `ar-models/${Date.now()}_${filename}`;
      const modelFileRef = storageRef(storage, modelPath);
      
      await uploadBytes(modelFileRef, file, {
        contentType: this.getContentType(filename)
      });
      
      // Get download URL
      const modelUrl = await getDownloadURL(modelFileRef);
      
      // Create model record
      const now = new Date();
      const modelData: ARModel = {
        ...metadata,
        id: doc(collection(firestore, 'arModels')).id,
        modelUrl,
        createdAt: now,
        lastUpdated: now
      };
      
      // Store in Firestore
      await setDoc(doc(firestore, 'arModels', modelData.id), modelData);
      
      return modelData;
    } catch (error: any) {
      console.error('Error uploading AR model:', error);
      throw new Error(`Failed to upload AR model: ${error.message}`);
    }
  }
  
  /**
   * Create an explanation for an AR model
   */
  async createARExplanation(explanation: Omit<ARExplanation, 'id' | 'createdAt'>): Promise<ARExplanation> {
    try {
      // Check if model exists
      const modelExists = await this.getARModel(explanation.modelId);
      if (!modelExists) {
        throw new Error('AR model not found');
      }
      
      // Create explanation record
      const now = new Date();
      const explanationData: ARExplanation = {
        ...explanation,
        id: doc(collection(firestore, 'arExplanations')).id,
        createdAt: now
      };
      
      // Store in Firestore
      await setDoc(doc(firestore, 'arExplanations', explanationData.id), explanationData);
      
      return explanationData;
    } catch (error: any) {
      console.error('Error creating AR explanation:', error);
      throw new Error(`Failed to create AR explanation: ${error.message}`);
    }
  }
  
  /**
   * Upload a voiceover audio file for AR explanation
   */
  async uploadVoiceover(modelId: string, explanationId: string, audioFile: Buffer, filename: string): Promise<string> {
    try {
      // Upload audio file to Google Cloud Storage
      const audioPath = `ar-voiceovers/${modelId}/${explanationId}/${filename}`;
      const audioFileRef = storageRef(storage, audioPath);
      
      await uploadBytes(audioFileRef, audioFile, {
        contentType: 'audio/mp3'
      });
      
      // Get download URL
      const audioUrl = await getDownloadURL(audioFileRef);
      
      // Update explanation with voiceover URL
      await setDoc(
        doc(firestore, 'arExplanations', explanationId), 
        { voiceoverUrl: audioUrl },
        { merge: true }
      );
      
      return audioUrl;
    } catch (error: any) {
      console.error('Error uploading voiceover:', error);
      throw new Error(`Failed to upload voiceover: ${error.message}`);
    }
  }
  
  /**
   * Search AR models by keywords/tags
   */
  async searchARModels(keywords: string[]): Promise<ARModel[]> {
    try {
      const modelsRef = collection(firestore, 'arModels');
      const snapshot = await getDocs(modelsRef);
      
      if (snapshot.empty) {
        return [];
      }
      
      // Filter models client-side based on keywords (in tags, name, description)
      const keywordLower = keywords.map(k => k.toLowerCase());
      const models: ARModel[] = [];
      
      snapshot.forEach(doc => {
        const data = doc.data();
        const tags = data.tags || [];
        const name = data.name || '';
        const description = data.description || '';
        
        // Check if any keyword matches
        const isMatch = keywordLower.some(keyword => 
          tags.some((tag: string) => tag.toLowerCase().includes(keyword)) ||
          name.toLowerCase().includes(keyword) ||
          description.toLowerCase().includes(keyword)
        );
        
        if (isMatch) {
          models.push({
            ...data,
            id: doc.id,
            createdAt: data.createdAt.toDate(),
            lastUpdated: data.lastUpdated.toDate()
          } as ARModel);
        }
      });
      
      return models;
    } catch (error: any) {
      console.error('Error searching AR models:', error);
      throw new Error(`Failed to search AR models: ${error.message}`);
    }
  }
  
  /**
   * Get content type based on file extension
   */
  private getContentType(filename: string): string {
    const extension = filename.split('.').pop()?.toLowerCase() || '';
    
    switch (extension) {
      case 'glb':
        return 'model/gltf-binary';
      case 'gltf':
        return 'model/gltf+json';
      case 'obj':
        return 'text/plain';
      case 'fbx':
        return 'application/octet-stream';
      case 'usdz':
        return 'model/vnd.usdz+zip';
      default:
        return 'application/octet-stream';
    }
  }
}

// Export a singleton instance
export const arMedicalEducation = new ARMedicalEducationService();