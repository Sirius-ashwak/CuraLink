/**
 * Transfer profiles from memory to Firebase
 * Uses existing Firebase configuration to move patient and doctor profiles
 */

import { initializeApp } from 'firebase/app';
import { getFirestore, collection, doc, setDoc, getDocs } from 'firebase/firestore';
import dotenv from 'dotenv';

// Load environment variables
dotenv.config();

// Firebase configuration
const firebaseConfig = {
  apiKey: process.env.VITE_FIREBASE_API_KEY,
  authDomain: process.env.VITE_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.VITE_FIREBASE_PROJECT_ID,
  storageBucket: process.env.VITE_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.VITE_FIREBASE_APP_ID
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

// Sample patient profiles
const patientProfiles = [
  {
    id: "patient-1",
    email: "sarah.johnson@email.com",
    firstName: "Sarah",
    lastName: "Johnson",
    role: "patient",
    age: 34,
    gender: "Female",
    bio: "Software engineer, active lifestyle, occasional migraines",
    phone: "+1-555-0101"
  },
  {
    id: "patient-2",
    email: "michael.chen@email.com",
    firstName: "Michael",
    lastName: "Chen",
    role: "patient",
    age: 28,
    gender: "Male",
    bio: "Marketing professional, diabetes type 1, regular fitness routine",
    phone: "+1-555-0102"
  },
  {
    id: "patient-3",
    email: "elena.rodriguez@email.com",
    firstName: "Elena",
    lastName: "Rodriguez",
    role: "patient",
    age: 45,
    gender: "Female",
    bio: "Teacher, hypertension, mother of two",
    phone: "+1-555-0103"
  },
  {
    id: "patient-4",
    email: "david.thompson@email.com",
    firstName: "David",
    lastName: "Thompson",
    role: "patient",
    age: 52,
    gender: "Male",
    bio: "Construction worker, back pain issues, high cholesterol",
    phone: "+1-555-0104"
  },
  {
    id: "patient-5",
    email: "lisa.williams@email.com",
    firstName: "Lisa",
    lastName: "Williams",
    role: "patient",
    age: 29,
    gender: "Female",
    bio: "Nurse, anxiety management, healthy lifestyle advocate",
    phone: "+1-555-0105"
  },
  {
    id: "patient-6",
    email: "james.brown@email.com",
    firstName: "James",
    lastName: "Brown",
    role: "patient",
    age: 67,
    gender: "Male",
    bio: "Retired accountant, arthritis",
    phone: "+1-555-0106"
  },
  {
    id: "patient-7",
    email: "maria.garcia@email.com",
    firstName: "Maria",
    lastName: "Garcia",
    role: "patient",
    age: 41,
    gender: "Female",
    bio: "Restaurant owner, migraines",
    phone: "+1-555-0107"
  },
  {
    id: "patient-8",
    email: "robert.lee@email.com",
    firstName: "Robert",
    lastName: "Lee",
    role: "patient",
    age: 35,
    gender: "Male",
    bio: "Graphic designer, carpal tunnel",
    phone: "+1-555-0108"
  },
  {
    id: "patient-9",
    email: "jennifer.davis@email.com",
    firstName: "Jennifer",
    lastName: "Davis",
    role: "patient",
    age: 50,
    gender: "Female",
    bio: "Legal assistant, stress management",
    phone: "+1-555-0109"
  },
  {
    id: "patient-10",
    email: "kevin.wilson@email.com",
    firstName: "Kevin",
    lastName: "Wilson",
    role: "patient",
    age: 38,
    gender: "Male",
    bio: "IT specialist, back pain from desk work",
    phone: "+1-555-0110"
  }
];

// Sample doctor profiles
const doctorProfiles = [
  {
    id: "doctor-1",
    email: "dr.smith@hospital.com",
    firstName: "John",
    lastName: "Smith",
    role: "doctor",
    specialty: "Cardiology",
    bio: "Board-certified cardiologist with 15 years of experience",
    phone: "+1-555-1001",
    isAvailable: true,
    experience: 15,
    education: "Harvard Medical School"
  },
  {
    id: "doctor-2",
    email: "dr.anderson@hospital.com",
    firstName: "Emily",
    lastName: "Anderson",
    role: "doctor",
    specialty: "Pediatrics",
    bio: "Pediatric specialist focusing on child development",
    phone: "+1-555-1002",
    isAvailable: true,
    experience: 12,
    education: "Johns Hopkins Medical School"
  },
  {
    id: "doctor-3",
    email: "dr.martinez@hospital.com",
    firstName: "Carlos",
    lastName: "Martinez",
    role: "doctor",
    specialty: "Dermatology",
    bio: "Dermatologist specializing in skin cancer prevention",
    phone: "+1-555-1003",
    isAvailable: true,
    experience: 10,
    education: "Stanford Medical School"
  },
  {
    id: "doctor-4",
    email: "dr.kim@hospital.com",
    firstName: "Susan",
    lastName: "Kim",
    role: "doctor",
    specialty: "Neurology",
    bio: "Neurologist with expertise in migraine treatment",
    phone: "+1-555-1004",
    isAvailable: true,
    experience: 18,
    education: "UCLA Medical School"
  },
  {
    id: "doctor-5",
    email: "dr.taylor@hospital.com",
    firstName: "Michael",
    lastName: "Taylor",
    role: "doctor",
    specialty: "Orthopedics",
    bio: "Orthopedic surgeon specializing in sports medicine",
    phone: "+1-555-1005",
    isAvailable: true,
    experience: 14,
    education: "Mayo Clinic Medical School"
  },
  {
    id: "doctor-6",
    email: "dr.white@hospital.com",
    firstName: "Rachel",
    lastName: "White",
    role: "doctor",
    specialty: "Psychiatry",
    bio: "Psychiatrist focusing on anxiety and depression",
    phone: "+1-555-1006",
    isAvailable: true,
    experience: 11,
    education: "Columbia Medical School"
  },
  {
    id: "doctor-7",
    email: "dr.johnson@hospital.com",
    firstName: "David",
    lastName: "Johnson",
    role: "doctor",
    specialty: "General Practice",
    bio: "Family physician with comprehensive care approach",
    phone: "+1-555-1007",
    isAvailable: true,
    experience: 20,
    education: "University of Michigan Medical School"
  },
  {
    id: "doctor-8",
    email: "dr.brown@hospital.com",
    firstName: "Lisa",
    lastName: "Brown",
    role: "doctor",
    specialty: "Endocrinology",
    bio: "Endocrinologist specializing in diabetes management",
    phone: "+1-555-1008",
    isAvailable: true,
    experience: 13,
    education: "Yale Medical School"
  },
  {
    id: "doctor-9",
    email: "dr.davis@hospital.com",
    firstName: "Mark",
    lastName: "Davis",
    role: "doctor",
    specialty: "Gastroenterology",
    bio: "GI specialist with focus on digestive health",
    phone: "+1-555-1009",
    isAvailable: true,
    experience: 16,
    education: "Duke Medical School"
  },
  {
    id: "doctor-10",
    email: "dr.wilson@hospital.com",
    firstName: "Amanda",
    lastName: "Wilson",
    role: "doctor",
    specialty: "Oncology",
    bio: "Oncologist dedicated to cancer treatment and research",
    phone: "+1-555-1010",
    isAvailable: true,
    experience: 17,
    education: "MD Anderson Medical School"
  }
];

// Transfer patient profiles to Firebase
async function transferPatients() {
  console.log('Transferring patient profiles to Firebase...');
  
  for (const patient of patientProfiles) {
    try {
      const patientDoc = doc(db, 'patients', patient.id);
      await setDoc(patientDoc, {
        ...patient,
        createdAt: new Date(),
        updatedAt: new Date()
      });
      console.log(`✅ Transferred patient: ${patient.firstName} ${patient.lastName}`);
    } catch (error) {
      console.error(`❌ Error transferring patient ${patient.firstName}:`, error);
    }
  }
}

// Transfer doctor profiles to Firebase
async function transferDoctors() {
  console.log('Transferring doctor profiles to Firebase...');
  
  for (const doctor of doctorProfiles) {
    try {
      const doctorDoc = doc(db, 'doctors', doctor.id);
      await setDoc(doctorDoc, {
        ...doctor,
        createdAt: new Date(),
        updatedAt: new Date()
      });
      console.log(`✅ Transferred doctor: Dr. ${doctor.firstName} ${doctor.lastName} (${doctor.specialty})`);
    } catch (error) {
      console.error(`❌ Error transferring doctor ${doctor.firstName}:`, error);
    }
  }
}

// Verify the transfer by counting documents
async function verifyTransfer() {
  console.log('\nVerifying transfer...');
  
  try {
    const patientsSnapshot = await getDocs(collection(db, 'patients'));
    const doctorsSnapshot = await getDocs(collection(db, 'doctors'));
    
    console.log(`📊 Total patients in Firebase: ${patientsSnapshot.size}`);
    console.log(`📊 Total doctors in Firebase: ${doctorsSnapshot.size}`);
    
    if (patientsSnapshot.size === 10 && doctorsSnapshot.size === 10) {
      console.log('🎉 Successfully transferred all 10 patients and 10 doctors to Firebase!');
    } else {
      console.log('⚠️ Transfer may be incomplete. Please check the Firebase console.');
    }
  } catch (error) {
    console.error('Error verifying transfer:', error);
  }
}

// Main function to run the transfer
async function main() {
  try {
    console.log('🚀 Starting profile transfer to Firebase...');
    console.log(`Using Firebase project: ${firebaseConfig.projectId}\n`);
    
    await transferPatients();
    console.log('');
    await transferDoctors();
    await verifyTransfer();
    
    console.log('\n✨ Profile transfer completed successfully!');
    console.log('Your patients and doctors are now stored in Firebase and ready to use.');
    
  } catch (error) {
    console.error('Transfer failed:', error);
  }
}

// Run the transfer
main();