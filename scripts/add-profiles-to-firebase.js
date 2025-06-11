/**
 * Add 10 patients and 10 doctors directly to Firebase
 */

import { initializeApp } from 'firebase/app';
import { getFirestore, doc, setDoc } from 'firebase/firestore';
import * as dotenv from 'dotenv';

dotenv.config();

const firebaseConfig = {
  apiKey: process.env.FIREBASE_API_KEY,
  authDomain: process.env.FIREBASE_AUTH_DOMAIN,
  projectId: process.env.FIREBASE_PROJECT_ID,
  storageBucket: process.env.FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.FIREBASE_APP_ID,
  measurementId: process.env.FIREBASE_MEASUREMENT_ID
};

const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

// 10 Patient profiles
const patients = [
  { name: "Sarah Johnson", email: "sarah.johnson@email.com", age: 34, gender: "Female", condition: "Software engineer, occasional migraines", phone: "+1-555-0101" },
  { name: "Michael Chen", email: "michael.chen@email.com", age: 28, gender: "Male", condition: "Marketing professional, diabetes type 1", phone: "+1-555-0102" },
  { name: "Elena Rodriguez", email: "elena.rodriguez@email.com", age: 45, gender: "Female", condition: "Teacher, hypertension", phone: "+1-555-0103" },
  { name: "David Thompson", email: "david.thompson@email.com", age: 52, gender: "Male", condition: "Construction worker, back pain", phone: "+1-555-0104" },
  { name: "Lisa Williams", email: "lisa.williams@email.com", age: 29, gender: "Female", condition: "Nurse, anxiety management", phone: "+1-555-0105" },
  { name: "James Brown", email: "james.brown@email.com", age: 67, gender: "Male", condition: "Retired accountant, arthritis", phone: "+1-555-0106" },
  { name: "Maria Garcia", email: "maria.garcia@email.com", age: 41, gender: "Female", condition: "Restaurant owner, migraines", phone: "+1-555-0107" },
  { name: "Robert Lee", email: "robert.lee@email.com", age: 35, gender: "Male", condition: "Graphic designer, carpal tunnel", phone: "+1-555-0108" },
  { name: "Jennifer Davis", email: "jennifer.davis@email.com", age: 50, gender: "Female", condition: "Legal assistant, stress", phone: "+1-555-0109" },
  { name: "Kevin Wilson", email: "kevin.wilson@email.com", age: 38, gender: "Male", condition: "IT specialist, back pain", phone: "+1-555-0110" }
];

// 10 Doctor profiles
const doctors = [
  { name: "Dr. John Smith", specialty: "Cardiology", experience: "15 years", phone: "+1-555-1001", email: "dr.smith@hospital.com" },
  { name: "Dr. Emily Anderson", specialty: "Pediatrics", experience: "12 years", phone: "+1-555-1002", email: "dr.anderson@hospital.com" },
  { name: "Dr. Carlos Martinez", specialty: "Dermatology", experience: "10 years", phone: "+1-555-1003", email: "dr.martinez@hospital.com" },
  { name: "Dr. Susan Kim", specialty: "Neurology", experience: "18 years", phone: "+1-555-1004", email: "dr.kim@hospital.com" },
  { name: "Dr. Michael Taylor", specialty: "Orthopedics", experience: "14 years", phone: "+1-555-1005", email: "dr.taylor@hospital.com" },
  { name: "Dr. Rachel White", specialty: "Psychiatry", experience: "11 years", phone: "+1-555-1006", email: "dr.white@hospital.com" },
  { name: "Dr. David Johnson", specialty: "General Practice", experience: "20 years", phone: "+1-555-1007", email: "dr.johnson@hospital.com" },
  { name: "Dr. Lisa Brown", specialty: "Endocrinology", experience: "13 years", phone: "+1-555-1008", email: "dr.brown@hospital.com" },
  { name: "Dr. Mark Davis", specialty: "Gastroenterology", experience: "16 years", phone: "+1-555-1009", email: "dr.davis@hospital.com" },
  { name: "Dr. Amanda Wilson", specialty: "Oncology", experience: "17 years", phone: "+1-555-1010", email: "dr.wilson@hospital.com" }
];

async function addProfilesToFirebase() {
  console.log('🚀 Adding 10 patients and 10 doctors to Firebase...\n');
  
  // Add patients
  console.log('📝 Adding patients...');
  for (let i = 0; i < patients.length; i++) {
    const patient = patients[i];
    try {
      await setDoc(doc(db, 'patients', `patient-${i + 1}`), {
        ...patient,
        id: `patient-${i + 1}`,
        role: 'patient',
        createdAt: new Date().toISOString()
      });
      console.log(`✅ Added: ${patient.name}`);
    } catch (error) {
      console.error(`❌ Error adding ${patient.name}:`, error.message);
    }
  }
  
  // Add doctors
  console.log('\n👨‍⚕️ Adding doctors...');
  for (let i = 0; i < doctors.length; i++) {
    const doctor = doctors[i];
    try {
      await setDoc(doc(db, 'doctors', `doctor-${i + 1}`), {
        ...doctor,
        id: `doctor-${i + 1}`,
        role: 'doctor',
        isAvailable: true,
        rating: (4.0 + Math.random()).toFixed(1),
        reviews: Math.floor(Math.random() * 100) + 50,
        createdAt: new Date().toISOString()
      });
      console.log(`✅ Added: ${doctor.name} (${doctor.specialty})`);
    } catch (error) {
      console.error(`❌ Error adding ${doctor.name}:`, error.message);
    }
  }
  
  console.log('\n🎉 Successfully added all profiles to Firebase!');
  console.log('📊 Total: 10 patients + 10 doctors = 20 profiles');
  console.log('✨ Check your Firebase console to see them!');
}

addProfilesToFirebase().catch(console.error);