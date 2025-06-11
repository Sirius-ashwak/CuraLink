/**
 * Seed Firebase with 10 patient and 10 doctor profiles
 * This script directly populates your Firebase database with realistic profiles
 */

import { initializeApp } from 'firebase/app';
import { getFirestore, collection, doc, setDoc } from 'firebase/firestore';
import { getAuth, createUserWithEmailAndPassword } from 'firebase/auth';
import * as dotenv from 'dotenv';

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

console.log('Using Firebase project:', firebaseConfig.projectId);

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const db = getFirestore(app);
const auth = getAuth(app);

// 10 Patient profiles
const patients = [
  { id: 1, email: "sarah.johnson@email.com", firstName: "Sarah", lastName: "Johnson", role: "patient", age: 34, gender: "Female", bio: "Software engineer, active lifestyle, occasional migraines", phone: "+1-555-0101" },
  { id: 2, email: "michael.chen@email.com", firstName: "Michael", lastName: "Chen", role: "patient", age: 28, gender: "Male", bio: "Marketing professional, diabetes type 1, regular fitness routine", phone: "+1-555-0102" },
  { id: 3, email: "elena.rodriguez@email.com", firstName: "Elena", lastName: "Rodriguez", role: "patient", age: 45, gender: "Female", bio: "Teacher, hypertension, mother of two", phone: "+1-555-0103" },
  { id: 4, email: "david.thompson@email.com", firstName: "David", lastName: "Thompson", role: "patient", age: 52, gender: "Male", bio: "Construction worker, back pain issues, high cholesterol", phone: "+1-555-0104" },
  { id: 5, email: "lisa.williams@email.com", firstName: "Lisa", lastName: "Williams", role: "patient", age: 29, gender: "Female", bio: "Nurse, anxiety management, healthy lifestyle advocate", phone: "+1-555-0105" },
  { id: 6, email: "james.brown@email.com", firstName: "James", lastName: "Brown", role: "patient", age: 67, gender: "Male", bio: "Retired accountant, arthritis", phone: "+1-555-0106" },
  { id: 7, email: "maria.garcia@email.com", firstName: "Maria", lastName: "Garcia", role: "patient", age: 41, gender: "Female", bio: "Restaurant owner, migraines", phone: "+1-555-0107" },
  { id: 8, email: "robert.lee@email.com", firstName: "Robert", lastName: "Lee", role: "patient", age: 35, gender: "Male", bio: "Graphic designer, carpal tunnel", phone: "+1-555-0108" },
  { id: 9, email: "jennifer.davis@email.com", firstName: "Jennifer", lastName: "Davis", role: "patient", age: 50, gender: "Female", bio: "Legal assistant, stress management", phone: "+1-555-0109" },
  { id: 10, email: "kevin.wilson@email.com", firstName: "Kevin", lastName: "Wilson", role: "patient", age: 38, gender: "Male", bio: "IT specialist, back pain from desk work", phone: "+1-555-0110" }
];

// 10 Doctor profiles
const doctors = [
  { id: 11, email: "dr.smith@hospital.com", firstName: "John", lastName: "Smith", role: "doctor", specialty: "Cardiology", bio: "Board-certified cardiologist with 15 years of experience", phone: "+1-555-1001", isAvailable: true, experience: 15 },
  { id: 12, email: "dr.anderson@hospital.com", firstName: "Emily", lastName: "Anderson", role: "doctor", specialty: "Pediatrics", bio: "Pediatric specialist focusing on child development", phone: "+1-555-1002", isAvailable: true, experience: 12 },
  { id: 13, email: "dr.martinez@hospital.com", firstName: "Carlos", lastName: "Martinez", role: "doctor", specialty: "Dermatology", bio: "Dermatologist specializing in skin cancer prevention", phone: "+1-555-1003", isAvailable: true, experience: 10 },
  { id: 14, email: "dr.kim@hospital.com", firstName: "Susan", lastName: "Kim", role: "doctor", specialty: "Neurology", bio: "Neurologist with expertise in migraine treatment", phone: "+1-555-1004", isAvailable: true, experience: 18 },
  { id: 15, email: "dr.taylor@hospital.com", firstName: "Michael", lastName: "Taylor", role: "doctor", specialty: "Orthopedics", bio: "Orthopedic surgeon specializing in sports medicine", phone: "+1-555-1005", isAvailable: true, experience: 14 },
  { id: 16, email: "dr.white@hospital.com", firstName: "Rachel", lastName: "White", role: "doctor", specialty: "Psychiatry", bio: "Psychiatrist focusing on anxiety and depression", phone: "+1-555-1006", isAvailable: true, experience: 11 },
  { id: 17, email: "dr.johnson@hospital.com", firstName: "David", lastName: "Johnson", role: "doctor", specialty: "General Practice", bio: "Family physician with comprehensive care approach", phone: "+1-555-1007", isAvailable: true, experience: 20 },
  { id: 18, email: "dr.brown@hospital.com", firstName: "Lisa", lastName: "Brown", role: "doctor", specialty: "Endocrinology", bio: "Endocrinologist specializing in diabetes management", phone: "+1-555-1008", isAvailable: true, experience: 13 },
  { id: 19, email: "dr.davis@hospital.com", firstName: "Mark", lastName: "Davis", role: "doctor", specialty: "Gastroenterology", bio: "GI specialist with focus on digestive health", phone: "+1-555-1009", isAvailable: true, experience: 16 },
  { id: 20, email: "dr.wilson@hospital.com", firstName: "Amanda", lastName: "Wilson", role: "doctor", specialty: "Oncology", bio: "Oncologist dedicated to cancer treatment and research", phone: "+1-555-1010", isAvailable: true, experience: 17 }
];

async function seedProfiles() {
  console.log('🚀 Starting to seed Firebase with profiles...\n');
  
  let patientsAdded = 0;
  let doctorsAdded = 0;
  
  // Add patients to Firebase
  console.log('📝 Adding patient profiles...');
  for (const patient of patients) {
    try {
      await setDoc(doc(db, 'users', patient.id.toString()), {
        ...patient,
        passwordHash: '$2b$10$placeholder', // Placeholder hash
        createdAt: new Date(),
        updatedAt: new Date()
      });
      console.log(`✅ Added patient: ${patient.firstName} ${patient.lastName}`);
      patientsAdded++;
    } catch (error) {
      console.error(`❌ Error adding patient ${patient.firstName}:`, error.message);
    }
  }
  
  console.log('\n👨‍⚕️ Adding doctor profiles...');
  // Add doctors to Firebase
  for (const doctor of doctors) {
    try {
      // Add to users collection
      await setDoc(doc(db, 'users', doctor.id.toString()), {
        id: doctor.id,
        email: doctor.email,
        firstName: doctor.firstName,
        lastName: doctor.lastName,
        role: doctor.role,
        passwordHash: '$2b$10$placeholder', // Placeholder hash
        createdAt: new Date(),
        updatedAt: new Date()
      });
      
      // Add to doctors collection
      await setDoc(doc(db, 'doctors', doctor.id.toString()), {
        id: doctor.id,
        userId: doctor.id,
        specialty: doctor.specialty,
        bio: doctor.bio,
        phone: doctor.phone,
        isAvailable: doctor.isAvailable,
        experience: doctor.experience,
        averageRating: Math.floor(Math.random() * 10) + 40, // Random rating 40-50
        reviewCount: Math.floor(Math.random() * 100) + 50,  // Random review count 50-150
        createdAt: new Date(),
        updatedAt: new Date()
      });
      
      console.log(`✅ Added doctor: Dr. ${doctor.firstName} ${doctor.lastName} (${doctor.specialty})`);
      doctorsAdded++;
    } catch (error) {
      console.error(`❌ Error adding doctor ${doctor.firstName}:`, error.message);
    }
  }
  
  console.log('\n🎉 Seeding completed successfully!');
  console.log(`📊 Summary:`);
  console.log(`   - Patients added: ${patientsAdded}/10`);
  console.log(`   - Doctors added: ${doctorsAdded}/10`);
  console.log(`   - Total profiles: ${patientsAdded + doctorsAdded}/20`);
  console.log('\n✨ Your Firebase database now contains all the profiles!');
}

// Run the seeding
seedProfiles().catch(console.error);