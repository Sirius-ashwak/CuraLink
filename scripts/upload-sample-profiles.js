// Upload sample profiles to Firebase Storage
import 'dotenv/config';
import { initializeApp } from 'firebase/app';
import { getStorage, ref, uploadString, getDownloadURL } from 'firebase/storage';
import { v4 as uuidv4 } from 'uuid';

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

console.log('Starting upload to Firebase Storage bucket:', process.env.VITE_FIREBASE_STORAGE_BUCKET);

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const storage = getStorage(app);

// Sample user profiles
const sampleProfiles = [
  {
    id: 1,
    name: "Dr. Sarah Johnson",
    specialty: "Cardiology",
    profileImage: `<svg xmlns="http://www.w3.org/2000/svg" width="200" height="200" viewBox="0 0 200 200">
      <circle cx="100" cy="70" r="50" fill="#4285f4" />
      <rect x="40" y="130" width="120" height="60" fill="#4285f4" />
      <text x="100" y="170" font-family="Arial" font-size="20" fill="white" text-anchor="middle">Dr. Johnson</text>
    </svg>`
  },
  {
    id: 2,
    name: "Dr. Michael Chen",
    specialty: "Neurology",
    profileImage: `<svg xmlns="http://www.w3.org/2000/svg" width="200" height="200" viewBox="0 0 200 200">
      <circle cx="100" cy="70" r="50" fill="#db4437" />
      <rect x="40" y="130" width="120" height="60" fill="#db4437" />
      <text x="100" y="170" font-family="Arial" font-size="20" fill="white" text-anchor="middle">Dr. Chen</text>
    </svg>`
  },
  {
    id: 3,
    name: "Dr. Emily Rodriguez",
    specialty: "Pediatrics",
    profileImage: `<svg xmlns="http://www.w3.org/2000/svg" width="200" height="200" viewBox="0 0 200 200">
      <circle cx="100" cy="70" r="50" fill="#f4b400" />
      <rect x="40" y="130" width="120" height="60" fill="#f4b400" />
      <text x="100" y="170" font-family="Arial" font-size="20" fill="white" text-anchor="middle">Dr. Rodriguez</text>
    </svg>`
  },
  {
    id: 4,
    name: "Dr. James Wilson",
    specialty: "Orthopedics",
    profileImage: `<svg xmlns="http://www.w3.org/2000/svg" width="200" height="200" viewBox="0 0 200 200">
      <circle cx="100" cy="70" r="50" fill="#0f9d58" />
      <rect x="40" y="130" width="120" height="60" fill="#0f9d58" />
      <text x="100" y="170" font-family="Arial" font-size="20" fill="white" text-anchor="middle">Dr. Wilson</text>
    </svg>`
  },
  {
    id: 5,
    name: "Alex Thompson",
    specialty: "Patient",
    profileImage: `<svg xmlns="http://www.w3.org/2000/svg" width="200" height="200" viewBox="0 0 200 200">
      <circle cx="100" cy="70" r="50" fill="#9c27b0" />
      <rect x="40" y="130" width="120" height="60" fill="#9c27b0" />
      <text x="100" y="170" font-family="Arial" font-size="20" fill="white" text-anchor="middle">Alex T.</text>
    </svg>`
  }
];

// Function to upload a profile image
async function uploadProfileImage(profile) {
  try {
    const filename = `profile-${profile.id}-${uuidv4()}.svg`;
    const storagePath = `profiles/${filename}`;
    
    // Create storage reference
    const storageRef = ref(storage, storagePath);
    
    // Upload SVG string
    await uploadString(storageRef, profile.profileImage, 'raw', {
      contentType: 'image/svg+xml'
    });
    
    // Get the download URL
    const downloadURL = await getDownloadURL(storageRef);
    
    console.log(`✅ Uploaded profile for ${profile.name}`);
    console.log(`   URL: ${downloadURL}`);
    
    return {
      ...profile,
      profileImageUrl: downloadURL,
      storagePath
    };
  } catch (error) {
    console.error(`❌ Error uploading profile for ${profile.name}:`, error.message);
    throw error;
  }
}

// Upload all profiles
async function uploadAllProfiles() {
  console.log('Starting to upload sample profiles...');
  
  const results = [];
  
  for (const profile of sampleProfiles) {
    try {
      const result = await uploadProfileImage(profile);
      results.push(result);
    } catch (error) {
      console.error(`Failed to upload profile for ${profile.name}`);
    }
  }
  
  console.log('\n======= UPLOAD SUMMARY =======');
  console.log(`Total profiles attempted: ${sampleProfiles.length}`);
  console.log(`Successfully uploaded: ${results.length}`);
  console.log(`Failed: ${sampleProfiles.length - results.length}`);
  
  if (results.length > 0) {
    console.log('\nSuccessfully uploaded profiles:');
    results.forEach((profile, index) => {
      console.log(`${index + 1}. ${profile.name} (${profile.specialty})`);
      console.log(`   Image URL: ${profile.profileImageUrl}`);
    });
    
    // Create a JSON object with the profiles data that could be used to store in Firestore
    const profilesData = results.map(({ id, name, specialty, profileImageUrl }) => ({
      id,
      name,
      specialty,
      profileImageUrl
    }));
    
    console.log('\nProfiles data (for database):');
    console.log(JSON.stringify(profilesData, null, 2));
  }
}

// Run the upload
uploadAllProfiles().catch(error => {
  console.error('❌ Fatal error during profile upload:', error);
});