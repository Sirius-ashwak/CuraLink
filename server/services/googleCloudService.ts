import { Firestore } from '@google-cloud/firestore';
import { Storage } from '@google-cloud/storage';
import { OAuth2Client } from 'google-auth-library';

// Google Cloud configuration
const googleCloudConfig = {
  projectId: process.env.GOOGLE_CLOUD_PROJECT_ID,
  apiKey: process.env.GOOGLE_CLOUD_API_KEY,
  clientId: process.env.GOOGLE_CLOUD_CLIENT_ID,
  clientSecret: process.env.GOOGLE_CLOUD_CLIENT_SECRET,
};

// Check if credentials are configured
const isConfigured = Boolean(
  googleCloudConfig.projectId && 
  googleCloudConfig.apiKey && 
  googleCloudConfig.clientId && 
  googleCloudConfig.clientSecret
);

if (!isConfigured) {
  console.error('Google Cloud credentials are not fully configured. Some features will not work.');
} else {
  console.log('Google Cloud credentials are configured. Cloud features are available.');
}

// Initialize Google Cloud services
let firestore: Firestore;
let storage: Storage;
let authClient: OAuth2Client;

try {
  // Initialize Firestore
  firestore = new Firestore({
    projectId: googleCloudConfig.projectId
  });
  
  // Initialize Cloud Storage
  storage = new Storage({
    projectId: googleCloudConfig.projectId
  });
  
  // Initialize Auth Client for OAuth flows
  authClient = new OAuth2Client(
    googleCloudConfig.clientId,
    googleCloudConfig.clientSecret
  );
} catch (error) {
  console.error("Google Cloud initialization error:", error);
  // Create empty instances to prevent crashes
  firestore = {} as any;
  storage = {} as any;
  authClient = {} as any;
}

// Collections for Firestore
const collections = {
  users: firestore.collection('users'),
  doctors: firestore.collection('doctors'),
  appointments: firestore.collection('appointments'),
  emergencyTransports: firestore.collection('emergencyTransports'),
  availability: firestore.collection('availability'),
  timeOff: firestore.collection('timeOff'),
  medicines: firestore.collection('medicines'),
  medicalRecords: firestore.collection('medicalRecords'),
};

// Storage buckets
const buckets = {
  profileImages: 'profile-images',
  medicalImages: 'medical-images', 
  medicalDocuments: 'medical-documents',
};

// Helper function to verify a Google ID token
const verifyGoogleIdToken = async (idToken: string) => {
  try {
    const ticket = await authClient.verifyIdToken({
      idToken,
      audience: googleCloudConfig.clientId,
    });
    return ticket.getPayload();
  } catch (error) {
    console.error('Error verifying Google ID token:', error);
    return null;
  }
};

// Helper function to generate a signed URL for accessing private Cloud Storage files
const getSignedUrl = async (bucket: string, filename: string, expiresIn = 3600) => {
  try {
    const options = {
      version: 'v4' as const,
      action: 'read' as const,
      expires: Date.now() + expiresIn * 1000,
    };
    
    const [url] = await storage.bucket(bucket).file(filename).getSignedUrl(options);
    return url;
  } catch (error) {
    console.error('Error generating signed URL:', error);
    return null;
  }
};

// Helper function to upload a file to Cloud Storage
const uploadFile = async (bucket: string, filename: string, file: Buffer, metadata: any = {}) => {
  try {
    const storageBucket = storage.bucket(bucket);
    const blob = storageBucket.file(filename);
    
    await blob.save(file, {
      metadata: {
        contentType: metadata.contentType || 'application/octet-stream',
        ...metadata,
      },
    });
    
    return true;
  } catch (error) {
    console.error('Error uploading file to Cloud Storage:', error);
    return false;
  }
};

export {
  isConfigured,
  firestore,
  storage,
  authClient,
  collections,
  buckets,
  verifyGoogleIdToken,
  getSignedUrl,
  uploadFile,
};