import { documentAIClient, storage } from './googleCloudConfig';
import { firestore } from './firebaseConfig';
import { collection, doc, setDoc, getDoc } from 'firebase/firestore';
import * as fs from 'fs';
import * as path from 'path';
import * as os from 'os';

interface ProcessedDocument {
  id: string;
  patientId: string;
  documentType: string;
  content: string;
  entities: {
    type: string;
    text: string;
    confidence: number;
  }[];
  formFields: {
    name: string;
    value: string;
  }[];
  uploadedAt: Date;
  processedAt: Date;
  fileName: string;
  fileUrl: string;
}

/**
 * Advanced Medical Document Processing Service
 * Uses Google Document AI to process and categorize medical documents
 */
export class DocumentProcessingService {
  // Google Cloud project ID and Document AI processor IDs for different document types
  private readonly projectId: string = 'festive-freedom-460702-k4';
  private readonly location = 'us';
  private readonly processorIds = {
    medicalForm: 'medical-form-processor',
    medicalReport: 'medical-report-processor',
    prescription: 'prescription-processor',
    labReport: 'lab-report-processor'
  };
  
  /**
   * Process a medical document using Google Document AI
   */
  async processDocument(
    patientId: string, 
    filePath: string, 
    documentType: 'medicalForm' | 'medicalReport' | 'prescription' | 'labReport'
  ): Promise<ProcessedDocument> {
    try {
      // Ensure Document AI client is initialized
      if (!documentAIClient) {
        throw new Error('Document AI client is not initialized');
      }
      
      // Read the file content
      const buffer = fs.readFileSync(filePath);
      const fileContent = buffer.toString('base64');
      
      const fileName = path.basename(filePath);
      
      // Select the appropriate processor ID based on document type
      const processorId = this.processorIds[documentType];
      if (!processorId) {
        throw new Error('Invalid document type');
      }
      
      // Format the processor name
      const name = `projects/${this.projectId}/locations/${this.location}/processors/${processorId}`;
      
      // Process the document
      const [result] = await documentAIClient.processDocument({
        name,
        rawDocument: {
          content: fileContent,
          mimeType: this.getMimeType(filePath),
        },
      });
      
      const document = result.document;
      
      if (!document) {
        throw new Error('Document processing failed');
      }
      
      // Extract text content
      const content = document.text || '';
      
      // Extract entities
      const entities = document.entities?.map(entity => ({
        type: entity.type || '',
        text: this.getEntityText(entity, content),
        confidence: entity.confidence || 0,
      })) || [];
      
      // Extract form fields
      const formFields = document.pages?.flatMap(page => 
        page.formFields?.map(field => ({
          name: this.getEntityText(field.fieldName, content),
          value: this.getEntityText(field.fieldValue, content),
        })) || []
      ) || [];
      
      // Upload document to Google Cloud Storage
      const storageFilePath = `documents/${patientId}/${Date.now()}_${fileName}`;
      const fileUrl = await this.uploadToStorage(buffer, storageFilePath);
      
      // Create processed document record
      const processedDocument: ProcessedDocument = {
        id: doc(collection(firestore, 'documents')).id,
        patientId,
        documentType,
        content,
        entities,
        formFields,
        uploadedAt: new Date(),
        processedAt: new Date(),
        fileName,
        fileUrl,
      };
      
      // Store document in Firestore
      await this.storeDocument(processedDocument);
      
      return processedDocument;
    } catch (error) {
      console.error('Error processing document:', error);
      throw new Error(`Failed to process document: ${error.message}`);
    }
  }
  
  /**
   * Get the MIME type of a file based on its extension
   */
  private getMimeType(filePath: string): string {
    const ext = path.extname(filePath).toLowerCase();
    
    switch (ext) {
      case '.pdf':
        return 'application/pdf';
      case '.jpg':
      case '.jpeg':
        return 'image/jpeg';
      case '.png':
        return 'image/png';
      case '.tiff':
        return 'image/tiff';
      case '.gif':
        return 'image/gif';
      default:
        return 'application/octet-stream';
    }
  }
  
  /**
   * Get the text content of an entity based on its text anchor
   */
  private getEntityText(entity: any, content: string): string {
    if (!entity || !entity.textAnchor) {
      return '';
    }
    
    const textSegments = entity.textAnchor.textSegments || [];
    if (textSegments.length === 0) {
      return '';
    }
    
    const text = textSegments.map(segment => {
      const start = parseInt(segment.startIndex || '0');
      const end = parseInt(segment.endIndex || '0');
      return content.substring(start, end);
    }).join(' ');
    
    return text;
  }
  
  /**
   * Upload a file to Google Cloud Storage
   */
  private async uploadToStorage(buffer: Buffer, destination: string): Promise<string> {
    try {
      if (!storage) {
        throw new Error('Storage client is not initialized');
      }
      
      const bucket = storage.bucket('telehealth-documents');
      const file = bucket.file(destination);
      
      await file.save(buffer, {
        contentType: this.getMimeType(destination),
        metadata: {
          cacheControl: 'public, max-age=31536000',
        },
      });
      
      // Make the file publicly accessible
      await file.makePublic();
      
      // Return public URL
      return `https://storage.googleapis.com/telehealth-documents/${destination}`;
    } catch (error) {
      console.error('Error uploading to storage:', error);
      throw new Error(`Failed to upload file: ${error.message}`);
    }
  }
  
  /**
   * Store processed document in Firestore
   */
  private async storeDocument(document: ProcessedDocument): Promise<void> {
    try {
      const docRef = doc(collection(firestore, 'documents'), document.id);
      await setDoc(docRef, document);
      
      // Also store reference to this document in patient's documents collection
      const patientDocRef = doc(collection(firestore, 'patients', document.patientId, 'documents'), document.id);
      await setDoc(patientDocRef, {
        documentId: document.id,
        documentType: document.documentType,
        uploadedAt: document.uploadedAt,
        fileName: document.fileName
      });
    } catch (error) {
      console.error('Error storing document:', error);
      throw new Error(`Failed to store document: ${error.message}`);
    }
  }
  
  /**
   * Categorize a document based on its content using Document AI
   */
  async categorizeDocument(filePath: string): Promise<string> {
    try {
      // For automatic categorization, we'll process with a general processor first
      const buffer = fs.readFileSync(filePath);
      const fileContent = buffer.toString('base64');
      
      // We'll use the medical form processor as a default for initial processing
      const name = `projects/${this.projectId}/locations/${this.location}/processors/${this.processorIds.medicalForm}`;
      
      const [result] = await documentAIClient.processDocument({
        name,
        rawDocument: {
          content: fileContent,
          mimeType: this.getMimeType(filePath),
        },
      });
      
      const document = result.document;
      
      if (!document) {
        throw new Error('Document processing failed');
      }
      
      // Extract text content for classification
      const content = document.text || '';
      
      // Use simple keyword matching for categorization
      // A more sophisticated approach would use a dedicated classification model
      const contentLower = content.toLowerCase();
      
      if (contentLower.includes('prescription') || 
          contentLower.includes('rx') || 
          contentLower.includes('medication')) {
        return 'prescription';
      } else if (contentLower.includes('lab') || 
                contentLower.includes('test result') || 
                contentLower.includes('blood test')) {
        return 'labReport';
      } else if (contentLower.includes('diagnosis') || 
                contentLower.includes('medical history') || 
                contentLower.includes('examination')) {
        return 'medicalReport';
      } else {
        return 'medicalForm';
      }
    } catch (error) {
      console.error('Error categorizing document:', error);
      throw new Error(`Failed to categorize document: ${error.message}`);
    }
  }
  
  /**
   * Get all documents for a patient
   */
  async getPatientDocuments(patientId: string): Promise<ProcessedDocument[]> {
    try {
      const documents: ProcessedDocument[] = [];
      const patientDocsRef = collection(firestore, 'patients', patientId, 'documents');
      
      const snapshot = await getDocs(patientDocsRef);
      
      for (const docSnap of snapshot.docs) {
        const data = docSnap.data();
        const documentId = data.documentId;
        
        // Get the full document data
        const documentRef = doc(firestore, 'documents', documentId);
        const documentSnap = await getDoc(documentRef);
        
        if (documentSnap.exists()) {
          documents.push(documentSnap.data() as ProcessedDocument);
        }
      }
      
      return documents;
    } catch (error) {
      console.error('Error getting patient documents:', error);
      throw new Error(`Failed to get patient documents: ${error.message}`);
    }
  }
}

// Export a singleton instance
export const documentProcessing = new DocumentProcessingService();