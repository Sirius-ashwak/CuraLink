// Store sample profiles in Firestore with links to the uploaded images
import 'dotenv/config';
import { initializeApp } from 'firebase/app';
import { getFirestore, collection, doc, setDoc, getDoc } from 'firebase/firestore';
import { getStorage, ref, getDownloadURL, listAll } from 'firebase/storage';

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

console.log('Initializing Firebase with project:', process.env.VITE_FIREBASE_PROJECT_ID);

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const db = getFirestore(app);
const storage = getStorage(app);

// Sample doctor and patient data that will be saved to Firestore
const sampleDoctors = [
  {
    id: "doctor-1",
    userId: 101,
    name: "Dr. Sarah Johnson",
    specialty: "Cardiology",
    qualifications: "MD, Cardiology, Board Certified",
    experience: "15 years",
    bio: "Specializing in cardiovascular health and preventive care.",
    languages: ["English", "Spanish"],
    acceptingNewPatients: true,
    availableForVirtualVisits: true,
    rating: 4.8,
    reviewCount: 124,
    hospitalAffiliations: ["Central Medical Center", "West Valley Hospital"],
    email: "dr.johnson@example.com",
    phone: "555-123-4567",
    isAvailable: true
  },
  {
    id: "doctor-2",
    userId: 102,
    name: "Dr. Michael Chen",
    specialty: "Neurology",
    qualifications: "MD, PhD, Neurology, Board Certified",
    experience: "12 years",
    bio: "Expert in neurological disorders with a research background in stroke prevention.",
    languages: ["English", "Mandarin"],
    acceptingNewPatients: true,
    availableForVirtualVisits: true,
    rating: 4.9,
    reviewCount: 98,
    hospitalAffiliations: ["University Medical Center", "Riverdale Hospital"],
    email: "dr.chen@example.com",
    phone: "555-234-5678",
    isAvailable: true
  },
  {
    id: "doctor-3",
    userId: 103,
    name: "Dr. Emily Rodriguez",
    specialty: "Pediatrics",
    qualifications: "MD, Pediatrics, Board Certified",
    experience: "8 years",
    bio: "Passionate about child health and development. Special focus on childhood asthma.",
    languages: ["English", "Spanish"],
    acceptingNewPatients: true,
    availableForVirtualVisits: true,
    rating: 4.7,
    reviewCount: 87,
    hospitalAffiliations: ["Children's Hospital", "Family Care Center"],
    email: "dr.rodriguez@example.com",
    phone: "555-345-6789",
    isAvailable: true
  },
  {
    id: "doctor-4",
    userId: 104,
    name: "Dr. James Wilson",
    specialty: "Orthopedics",
    qualifications: "MD, Orthopedic Surgery, Board Certified",
    experience: "20 years",
    bio: "Specializing in sports medicine and joint replacement. Former team doctor for local sports teams.",
    languages: ["English"],
    acceptingNewPatients: false,
    availableForVirtualVisits: true,
    rating: 4.6,
    reviewCount: 156,
    hospitalAffiliations: ["Sports Medicine Institute", "General Hospital"],
    email: "dr.wilson@example.com",
    phone: "555-456-7890",
    isAvailable: true
  }
];

const samplePatients = [
  {
    id: "patient-1",
    userId: 201,
    name: "Alex Thompson",
    dateOfBirth: "1985-06-15",
    gender: "Male",
    contactEmail: "alex.thompson@example.com",
    contactPhone: "555-789-0123",
    address: "123 Main St, Anytown, CA 94321",
    emergencyContact: {
      name: "Emma Thompson",
      relationship: "Spouse",
      phone: "555-789-4567"
    },
    medicalHistory: {
      allergies: ["Penicillin"],
      chronicConditions: ["Asthma"],
      currentMedications: ["Albuterol inhaler"],
      pastSurgeries: ["Appendectomy, 2010"],
      familyHistory: ["Heart disease"]
    },
    insuranceInfo: {
      provider: "Health Plus Insurance",
      policyNumber: "HP78901234",
      groupNumber: "G4567"
    }
  }
];

// Map to store the image URLs we find in Firebase Storage
const profileImageUrls = new Map();

// Function to find all profile images in Firebase Storage
async function fetchProfileImages() {
  try {
    const profilesRef = ref(storage, 'profiles');
    const result = await listAll(profilesRef);
    
    console.log(`Found ${result.items.length} profile images in Firebase Storage`);
    
    // Process each profile image file
    for (const itemRef of result.items) {
      const name = itemRef.name;
      const url = await getDownloadURL(itemRef);
      
      // Extract the profile ID from the filename (format: profile-{id}-{uuid}.svg)
      const idMatch = name.match(/profile-(\d+)-/);
      if (idMatch && idMatch[1]) {
        const profileId = parseInt(idMatch[1]);
        profileImageUrls.set(profileId, url);
        console.log(`Mapped profile ID ${profileId} to image URL`);
      }
    }
    
    return profileImageUrls;
  } catch (error) {
    console.error('Error fetching profile images:', error);
    throw error;
  }
}

// Function to store doctor profiles in Firestore
async function storeDoctorProfiles() {
  try {
    console.log('Storing doctor profiles in Firestore...');
    
    // Store each doctor profile
    for (const doctor of sampleDoctors) {
      // Find the matching profile image URL
      const id = parseInt(doctor.id.split('-')[1]);
      const imageUrl = profileImageUrls.get(id);
      
      // If we have an image URL, add it to the doctor data
      const doctorData = {
        ...doctor,
        profileImageUrl: imageUrl || null,
        createdAt: new Date(),
        updatedAt: new Date()
      };
      
      // Add the doctor to Firestore
      const docRef = doc(db, 'doctors', doctor.id);
      await setDoc(docRef, doctorData);
      
      console.log(`✅ Added doctor: ${doctor.name} ${imageUrl ? 'with' : 'without'} profile image`);
    }
    
    console.log('Successfully stored all doctor profiles in Firestore');
    return true;
  } catch (error) {
    console.error('Error storing doctor profiles:', error);
    throw error;
  }
}

// Function to store patient profiles in Firestore
async function storePatientProfiles() {
  try {
    console.log('Storing patient profiles in Firestore...');
    
    // Store each patient profile
    for (const patient of samplePatients) {
      // Find the matching profile image URL
      const id = parseInt(patient.id.split('-')[1]) + 4; // Patient profiles start at ID 5
      const imageUrl = profileImageUrls.get(id);
      
      // If we have an image URL, add it to the patient data
      const patientData = {
        ...patient,
        profileImageUrl: imageUrl || null,
        createdAt: new Date(),
        updatedAt: new Date()
      };
      
      // Add the patient to Firestore
      const docRef = doc(db, 'patients', patient.id);
      await setDoc(docRef, patientData);
      
      console.log(`✅ Added patient: ${patient.name} ${imageUrl ? 'with' : 'without'} profile image`);
    }
    
    console.log('Successfully stored all patient profiles in Firestore');
    return true;
  } catch (error) {
    console.error('Error storing patient profiles:', error);
    throw error;
  }
}

// Function to create user accounts linked to doctor/patient profiles
async function createUserAccounts() {
  try {
    console.log('Creating user accounts in Firestore...');
    
    // Create user accounts for doctors
    for (const doctor of sampleDoctors) {
      const userData = {
        id: doctor.userId,
        email: doctor.email,
        name: doctor.name,
        role: 'doctor',
        createdAt: new Date(),
        profileId: doctor.id
      };
      
      const userRef = doc(db, 'users', doctor.userId.toString());
      await setDoc(userRef, userData);
      
      console.log(`✅ Created user account for doctor: ${doctor.name}`);
    }
    
    // Create user accounts for patients
    for (const patient of samplePatients) {
      const userData = {
        id: patient.userId,
        email: patient.contactEmail,
        name: patient.name,
        role: 'patient',
        createdAt: new Date(),
        profileId: patient.id
      };
      
      const userRef = doc(db, 'users', patient.userId.toString());
      await setDoc(userRef, userData);
      
      console.log(`✅ Created user account for patient: ${patient.name}`);
    }
    
    console.log('Successfully created all user accounts in Firestore');
    return true;
  } catch (error) {
    console.error('Error creating user accounts:', error);
    throw error;
  }
}

// Function to verify that our data was correctly stored in Firestore
async function verifyDataInFirestore() {
  try {
    console.log('\n===== VERIFYING DATA IN FIRESTORE =====');
    
    // Check one doctor profile
    const doctorRef = doc(db, 'doctors', 'doctor-1');
    const doctorSnap = await getDoc(doctorRef);
    
    if (doctorSnap.exists()) {
      console.log('✅ Found doctor profile in Firestore:');
      console.log(`   Name: ${doctorSnap.data().name}`);
      console.log(`   Specialty: ${doctorSnap.data().specialty}`);
      console.log(`   Profile Image: ${doctorSnap.data().profileImageUrl ? 'Yes' : 'No'}`);
    } else {
      console.log('❌ Doctor profile not found in Firestore');
    }
    
    // Check one patient profile
    const patientRef = doc(db, 'patients', 'patient-1');
    const patientSnap = await getDoc(patientRef);
    
    if (patientSnap.exists()) {
      console.log('✅ Found patient profile in Firestore:');
      console.log(`   Name: ${patientSnap.data().name}`);
      console.log(`   Email: ${patientSnap.data().contactEmail}`);
      console.log(`   Profile Image: ${patientSnap.data().profileImageUrl ? 'Yes' : 'No'}`);
    } else {
      console.log('❌ Patient profile not found in Firestore');
    }
    
    // Check one user account
    const userRef = doc(db, 'users', '101');
    const userSnap = await getDoc(userRef);
    
    if (userSnap.exists()) {
      console.log('✅ Found user account in Firestore:');
      console.log(`   Name: ${userSnap.data().name}`);
      console.log(`   Role: ${userSnap.data().role}`);
      console.log(`   Profile ID: ${userSnap.data().profileId}`);
    } else {
      console.log('❌ User account not found in Firestore');
    }
    
    console.log('\nVerification complete!');
  } catch (error) {
    console.error('Error verifying data in Firestore:', error);
  }
}

// Main function to run the script
async function main() {
  try {
    console.log('Starting to store profiles in Firestore...');
    
    // Step 1: Fetch profile images from Firebase Storage
    await fetchProfileImages();
    console.log(`Found ${profileImageUrls.size} profile images`);
    
    // Step 2: Store doctor profiles
    await storeDoctorProfiles();
    
    // Step 3: Store patient profiles
    await storePatientProfiles();
    
    // Step 4: Create user accounts
    await createUserAccounts();
    
    // Step 5: Verify our data
    await verifyDataInFirestore();
    
    console.log('\n✨ All profiles successfully stored in Firestore and linked to images in Firebase Storage!');
    console.log('The application can now fetch complete profiles when users log in.');
  } catch (error) {
    console.error('Failed to complete the process:', error);
  }
}

// Run the script
main();