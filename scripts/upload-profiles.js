// Upload sample profiles to Firebase Storage
import 'dotenv/config';
import { initializeApp } from 'firebase/app';
import { getStorage, ref, uploadString, getDownloadURL } from 'firebase/storage';

// Firebase configuration from environment variables
const firebaseConfig = {
  apiKey: process.env.VITE_FIREBASE_API_KEY,
  authDomain: process.env.VITE_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.VITE_FIREBASE_PROJECT_ID,
  storageBucket: process.env.VITE_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.VITE_FIREBASE_APP_ID,
  measurementId: process.env.VITE_FIREBASE_MEASUREMENT_ID
};

console.log('Firebase config:', {
  apiKey: process.env.VITE_FIREBASE_API_KEY ? '✓ Set' : '✗ Not set',
  authDomain: process.env.VITE_FIREBASE_AUTH_DOMAIN ? '✓ Set' : '✗ Not set',
  projectId: process.env.VITE_FIREBASE_PROJECT_ID ? '✓ Set' : '✗ Not set',
  storageBucket: process.env.VITE_FIREBASE_STORAGE_BUCKET ? '✓ Set' : '✗ Not set',
  messagingSenderId: process.env.VITE_FIREBASE_MESSAGING_SENDER_ID ? '✓ Set' : '✗ Not set',
  appId: process.env.VITE_FIREBASE_APP_ID ? '✓ Set' : '✗ Not set'
});

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const storage = getStorage(app);

// Sample profile data (SVG images as strings)
const sampleProfiles = [
  { 
    name: 'profile1.svg',
    content: `<svg xmlns="http://www.w3.org/2000/svg" width="100" height="100" viewBox="0 0 100 100">
      <circle cx="50" cy="35" r="25" fill="#4285f4" />
      <rect x="20" y="65" width="60" height="30" fill="#4285f4" />
    </svg>`
  },
  {
    name: 'profile2.svg',
    content: `<svg xmlns="http://www.w3.org/2000/svg" width="100" height="100" viewBox="0 0 100 100">
      <circle cx="50" cy="35" r="25" fill="#db4437" />
      <rect x="20" y="65" width="60" height="30" fill="#db4437" />
    </svg>`
  },
  {
    name: 'profile3.svg',
    content: `<svg xmlns="http://www.w3.org/2000/svg" width="100" height="100" viewBox="0 0 100 100">
      <circle cx="50" cy="35" r="25" fill="#f4b400" />
      <rect x="20" y="65" width="60" height="30" fill="#f4b400" />
    </svg>`
  },
  {
    name: 'profile4.svg',
    content: `<svg xmlns="http://www.w3.org/2000/svg" width="100" height="100" viewBox="0 0 100 100">
      <circle cx="50" cy="35" r="25" fill="#0f9d58" />
      <rect x="20" y="65" width="60" height="30" fill="#0f9d58" />
    </svg>`
  }
];

// Function to upload a profile image to Firebase Storage
async function uploadProfileImage(profile) {
  try {
    // Create a reference to the file in Firebase Storage
    const storageRef = ref(storage, `profiles/${profile.name}`);
    
    // Upload the SVG content as a string with data URL format
    const snapshot = await uploadString(storageRef, profile.content, 'raw', {
      contentType: 'image/svg+xml'
    });
    
    // Get the download URL
    const downloadURL = await getDownloadURL(snapshot.ref);
    
    console.log(`✅ Successfully uploaded ${profile.name}`);
    console.log(`🔗 Download URL: ${downloadURL}`);
    
    return downloadURL;
  } catch (error) {
    console.error(`❌ Error uploading ${profile.name}:`, error);
    throw error;
  }
}

// Main function to upload all sample profiles
async function uploadSampleProfiles() {
  console.log('🚀 Starting sample profile uploads to Firebase Storage...');
  
  try {
    const results = [];
    
    for (const profile of sampleProfiles) {
      const url = await uploadProfileImage(profile);
      results.push({
        name: profile.name,
        url
      });
    }
    
    console.log('\n📋 Summary of uploaded profiles:');
    results.forEach(result => {
      console.log(`- ${result.name}: ${result.url}`);
    });
    
    console.log('\n✨ All sample profiles uploaded successfully!');
    console.log('🔍 Check your Firebase Storage console to see the uploaded files.');
  } catch (error) {
    console.error('❌ Failed to upload sample profiles:', error);
  }
}

// Run the upload function
uploadSampleProfiles();