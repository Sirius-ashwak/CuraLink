import { storage, buckets } from './googleCloudService';
import { v4 as uuidv4 } from 'uuid';

/**
 * Cloud Storage Service - Provides methods for interacting with Google Cloud Storage
 */
class StorageService {
  // Check if the Storage service is properly configured
  isConfigured(): boolean {
    return storage && typeof storage.bucket === 'function';
  }

  /**
   * Upload a file to Cloud Storage
   * @param file - The file buffer to upload
   * @param bucketName - The name of the bucket to upload to (uses constants from googleCloudService)
   * @param customFilename - Optional custom filename, otherwise generates UUID
   * @param contentType - The content type of the file
   * @returns The public URL of the uploaded file
   */
  async uploadFile(
    file: Buffer,
    bucketName: string,
    customFilename?: string,
    contentType: string = 'application/octet-stream'
  ): Promise<string> {
    if (!this.isConfigured()) {
      throw new Error('Cloud Storage is not properly configured');
    }
    
    try {
      // Generate a unique filename if not provided
      const filename = customFilename || `${uuidv4()}-${Date.now()}`;
      
      // Get the bucket
      const bucket = storage.bucket(bucketName);
      
      // Create a file reference
      const blob = bucket.file(filename);
      
      // Upload the file
      await blob.save(file, {
        contentType,
        public: true, // Make it publicly accessible
        metadata: {
          contentType,
          cacheControl: 'public, max-age=31536000', // Cache for 1 year
        },
      });
      
      // Make the file public
      await blob.makePublic();
      
      // Get the public URL
      return `https://storage.googleapis.com/${bucketName}/${filename}`;
    } catch (error) {
      console.error('Error uploading file to Cloud Storage:', error);
      throw error;
    }
  }

  /**
   * Upload a profile image
   * @param file - The image file buffer
   * @param userId - The ID of the user
   * @param contentType - The content type of the image
   * @returns The public URL of the uploaded image
   */
  async uploadProfileImage(
    file: Buffer,
    userId: string | number,
    contentType: string = 'image/jpeg'
  ): Promise<string> {
    const filename = `profile-${userId}-${Date.now()}`;
    return this.uploadFile(file, buckets.profileImages, filename, contentType);
  }

  /**
   * Upload a medical image
   * @param file - The image file buffer
   * @param patientId - The ID of the patient
   * @param contentType - The content type of the image
   * @returns The public URL of the uploaded image
   */
  async uploadMedicalImage(
    file: Buffer,
    patientId: string | number,
    contentType: string = 'image/jpeg'
  ): Promise<string> {
    const filename = `medical-${patientId}-${Date.now()}`;
    return this.uploadFile(file, buckets.medicalImages, filename, contentType);
  }

  /**
   * Upload a medical document
   * @param file - The document file buffer
   * @param patientId - The ID of the patient
   * @param contentType - The content type of the document
   * @returns The public URL of the uploaded document
   */
  async uploadMedicalDocument(
    file: Buffer,
    patientId: string | number,
    contentType: string = 'application/pdf'
  ): Promise<string> {
    const filename = `document-${patientId}-${Date.now()}`;
    return this.uploadFile(file, buckets.medicalDocuments, filename, contentType);
  }

  /**
   * Delete a file from Cloud Storage
   * @param bucketName - The name of the bucket
   * @param filename - The name of the file to delete
   * @returns True if successful
   */
  async deleteFile(bucketName: string, filename: string): Promise<boolean> {
    if (!this.isConfigured()) {
      throw new Error('Cloud Storage is not properly configured');
    }
    
    try {
      // Get the bucket
      const bucket = storage.bucket(bucketName);
      
      // Delete the file
      await bucket.file(filename).delete();
      
      return true;
    } catch (error) {
      console.error('Error deleting file from Cloud Storage:', error);
      throw error;
    }
  }

  /**
   * Get a signed URL for a private file
   * @param bucketName - The name of the bucket
   * @param filename - The name of the file
   * @param expiresIn - How long the URL should be valid for (in seconds)
   * @returns The signed URL
   */
  async getSignedUrl(
    bucketName: string,
    filename: string,
    expiresIn: number = 3600
  ): Promise<string> {
    if (!this.isConfigured()) {
      throw new Error('Cloud Storage is not properly configured');
    }
    
    try {
      // Get the bucket
      const bucket = storage.bucket(bucketName);
      
      // Create a signed URL
      const [url] = await bucket.file(filename).getSignedUrl({
        version: 'v4',
        action: 'read',
        expires: Date.now() + expiresIn * 1000,
      });
      
      return url;
    } catch (error) {
      console.error('Error generating signed URL from Cloud Storage:', error);
      throw error;
    }
  }
}

// Export a singleton instance
export const storageService = new StorageService();