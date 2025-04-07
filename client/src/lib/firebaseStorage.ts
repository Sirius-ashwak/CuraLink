import { getStorage, FirebaseStorage } from 'firebase/storage';
import { app } from './firebase';
import {
  ref,
  uploadBytesResumable,
  getDownloadURL,
  listAll,
  deleteObject,
  UploadTaskSnapshot
} from 'firebase/storage';

/**
 * Firebase Storage Service
 * Handles uploading, downloading, listing, and deleting files from Firebase Storage
 */
export class FirebaseStorageService {
  private storage: FirebaseStorage;
  
  constructor() {
    this.storage = getStorage(app);
  }
  
  /**
   * Upload a file to Firebase Storage
   * @param file - The file to upload
   * @param path - The storage path (e.g., 'users/123/documents')
   * @param filename - Optional custom filename, defaults to file's name
   * @param onProgress - Optional callback for upload progress
   * @returns Promise with download URL
   */
  async uploadFile(
    file: File,
    path: string,
    filename?: string,
    onProgress?: (progress: number) => void
  ): Promise<string> {
    try {
      const storageRef = ref(this.storage, `${path}/${filename || file.name}`);
      const uploadTask = uploadBytesResumable(storageRef, file);

      return new Promise((resolve, reject) => {
        uploadTask.on(
          'state_changed',
          (snapshot: UploadTaskSnapshot) => {
            const progress = (snapshot.bytesTransferred / snapshot.totalBytes) * 100;
            if (onProgress) onProgress(progress);
          },
          (error) => {
            console.error('Upload failed:', error);
            reject(error);
          },
          async () => {
            const downloadURL = await getDownloadURL(uploadTask.snapshot.ref);
            resolve(downloadURL);
          }
        );
      });
    } catch (error) {
      console.error('Error uploading file:', error);
      throw error;
    }
  }

  /**
   * Upload multiple files to Firebase Storage
   * @param files - Array of files to upload
   * @param path - The storage path
   * @param onProgress - Optional callback for total upload progress
   * @returns Promise with array of download URLs
   */
  async uploadMultipleFiles(
    files: File[],
    path: string,
    onProgress?: (progress: number) => void
  ): Promise<string[]> {
    try {
      const uploadPromises = files.map((file, index) => {
        return this.uploadFile(file, path, undefined, (fileProgress) => {
          // Calculate total progress across all files
          if (onProgress) {
            const totalProgress = files.reduce((acc, _, i) => {
              // Weight each file equally
              return acc + (i === index ? fileProgress : 0);
            }, 0) / files.length;
            onProgress(totalProgress);
          }
        });
      });

      return Promise.all(uploadPromises);
    } catch (error) {
      console.error('Error uploading multiple files:', error);
      throw error;
    }
  }

  /**
   * Get download URL for a file
   * @param path - Path to the file
   * @returns Promise with download URL
   */
  async getFileUrl(path: string): Promise<string> {
    try {
      const fileRef = ref(this.storage, path);
      return await getDownloadURL(fileRef);
    } catch (error) {
      console.error('Error getting file URL:', error);
      throw error;
    }
  }

  /**
   * List all files in a directory
   * @param path - Directory path
   * @returns Promise with array of file references
   */
  async listFiles(path: string): Promise<{ name: string; path: string; url: string }[]> {
    try {
      const dirRef = ref(this.storage, path);
      const fileList = await listAll(dirRef);

      const fileDetails = await Promise.all(
        fileList.items.map(async (item) => {
          const url = await getDownloadURL(item);
          return {
            name: item.name,
            path: item.fullPath,
            url
          };
        })
      );

      return fileDetails;
    } catch (error) {
      console.error('Error listing files:', error);
      throw error;
    }
  }

  /**
   * Delete a file from storage
   * @param path - Path to the file
   * @returns Promise that resolves when deletion is complete
   */
  async deleteFile(path: string): Promise<void> {
    try {
      const fileRef = ref(this.storage, path);
      await deleteObject(fileRef);
    } catch (error) {
      console.error('Error deleting file:', error);
      throw error;
    }
  }
}

// Create a singleton instance
export const firebaseStorage = new FirebaseStorageService();