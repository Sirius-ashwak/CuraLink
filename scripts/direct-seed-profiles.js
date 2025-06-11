/**
 * Direct Database Seeding Script
 * Creates 10 patient and 10 doctor profiles directly in the memory storage
 */

import bcrypt from 'bcryptjs';
import { storage } from '../server/storage.js';

const patientProfiles = [
  {
    email: "sarah.johnson@email.com",
    firstName: "Sarah",
    lastName: "Johnson",
    role: "patient",
    profile: { age: 34, gender: "Female", bio: "Software engineer, active lifestyle", phone: "+1-555-0101" }
  },
  {
    email: "michael.chen@email.com",
    firstName: "Michael",
    lastName: "Chen",
    role: "patient",
    profile: { age: 28, gender: "Male", bio: "Marketing professional, diabetes type 1", phone: "+1-555-0102" }
  },
  {
    email: "elena.rodriguez@email.com",
    firstName: "Elena",
    lastName: "Rodriguez",
    role: "patient",
    profile: { age: 45, gender: "Female", bio: "Teacher, hypertension, mother of two", phone: "+1-555-0103" }
  },
  {
    email: "david.thompson@email.com",
    firstName: "David",
    lastName: "Thompson",
    role: "patient",
    profile: { age: 52, gender: "Male", bio: "Construction worker, back pain issues", phone: "+1-555-0104" }
  },
  {
    email: "lisa.williams@email.com",
    firstName: "Lisa",
    lastName: "Williams",
    role: "patient",
    profile: { age: 29, gender: "Female", bio: "Nurse, anxiety management", phone: "+1-555-0105" }
  },
  {
    email: "james.brown@email.com",
    firstName: "James",
    lastName: "Brown",
    role: "patient",
    profile: { age: 67, gender: "Male", bio: "Retired accountant, arthritis", phone: "+1-555-0106" }
  },
  {
    email: "maria.garcia@email.com",
    firstName: "Maria",
    lastName: "Garcia",
    role: "patient",
    profile: { age: 38, gender: "Female", bio: "Restaurant owner, stress management", phone: "+1-555-0107" }
  },
  {
    email: "robert.davis@email.com",
    firstName: "Robert",
    lastName: "Davis",
    role: "patient",
    profile: { age: 43, gender: "Male", bio: "IT consultant, weight management", phone: "+1-555-0108" }
  },
  {
    email: "jennifer.miller@email.com",
    firstName: "Jennifer",
    lastName: "Miller",
    role: "patient",
    profile: { age: 31, gender: "Female", bio: "Graphic designer, eye strain issues", phone: "+1-555-0109" }
  },
  {
    email: "thomas.wilson@email.com",
    firstName: "Thomas",
    lastName: "Wilson",
    role: "patient",
    profile: { age: 56, gender: "Male", bio: "Sales manager, heart health monitoring", phone: "+1-555-0110" }
  }
];

const doctorProfiles = [
  {
    email: "dr.emily.stone@medical.com",
    firstName: "Emily",
    lastName: "Stone",
    role: "doctor",
    specialty: "Cardiology",
    profile: { bio: "Board-certified cardiologist with 15 years experience", phone: "+1-555-1001" },
    averageRating: 4.8,
    reviewCount: 147
  },
  {
    email: "dr.ahmed.hassan@medical.com",
    firstName: "Ahmed",
    lastName: "Hassan",
    role: "doctor",
    specialty: "Endocrinology",
    profile: { bio: "Endocrinologist specializing in diabetes management", phone: "+1-555-1002" },
    averageRating: 4.7,
    reviewCount: 132
  },
  {
    email: "dr.rachel.kim@medical.com",
    firstName: "Rachel",
    lastName: "Kim",
    role: "doctor",
    specialty: "Neurology",
    profile: { bio: "Neurologist with expertise in migraine treatment", phone: "+1-555-1003" },
    averageRating: 4.9,
    reviewCount: 89
  },
  {
    email: "dr.marcus.taylor@medical.com",
    firstName: "Marcus",
    lastName: "Taylor",
    role: "doctor",
    specialty: "Orthopedics",
    profile: { bio: "Orthopedic surgeon specializing in sports medicine", phone: "+1-555-1004" },
    averageRating: 4.6,
    reviewCount: 203
  },
  {
    email: "dr.sarah.patel@medical.com",
    firstName: "Sarah",
    lastName: "Patel",
    role: "doctor",
    specialty: "Psychiatry",
    profile: { bio: "Board-certified psychiatrist specializing in anxiety disorders", phone: "+1-555-1005" },
    averageRating: 4.8,
    reviewCount: 156
  },
  {
    email: "dr.benjamin.clark@medical.com",
    firstName: "Benjamin",
    lastName: "Clark",
    role: "doctor",
    specialty: "Geriatrics",
    profile: { bio: "Geriatrician with 20 years experience in elderly care", phone: "+1-555-1006" },
    averageRating: 4.7,
    reviewCount: 178
  },
  {
    email: "dr.laura.martinez@medical.com",
    firstName: "Laura",
    lastName: "Martinez",
    role: "doctor",
    specialty: "Gastroenterology",
    profile: { bio: "Gastroenterologist specializing in digestive health", phone: "+1-555-1007" },
    averageRating: 4.5,
    reviewCount: 94
  },
  {
    email: "dr.kevin.wright@medical.com",
    firstName: "Kevin",
    lastName: "Wright",
    role: "doctor",
    specialty: "Pulmonology",
    profile: { bio: "Pulmonologist with expertise in respiratory diseases", phone: "+1-555-1008" },
    averageRating: 4.6,
    reviewCount: 112
  },
  {
    email: "dr.natalie.lee@medical.com",
    firstName: "Natalie",
    lastName: "Lee",
    role: "doctor",
    specialty: "Ophthalmology",
    profile: { bio: "Ophthalmologist specializing in retinal diseases", phone: "+1-555-1009" },
    averageRating: 4.9,
    reviewCount: 76
  },
  {
    email: "dr.anthony.moore@medical.com",
    firstName: "Anthony",
    lastName: "Moore",
    role: "doctor",
    specialty: "Dermatology",
    profile: { bio: "Board-certified dermatologist with skin cancer expertise", phone: "+1-555-1010" },
    averageRating: 4.7,
    reviewCount: 128
  }
];

async function seedProfiles() {
  console.log('Creating user profiles...');
  
  const createdUsers = [];
  const createdDoctors = [];

  // Create patient profiles
  for (const patient of patientProfiles) {
    try {
      const hashedPassword = await bcrypt.hash('password123', 10);
      
      const user = await storage.createUser({
        email: patient.email,
        password: hashedPassword,
        firstName: patient.firstName,
        lastName: patient.lastName,
        role: patient.role,
        profile: patient.profile
      });
      
      createdUsers.push(user);
      console.log(`✓ Created patient: ${patient.firstName} ${patient.lastName}`);
    } catch (error) {
      console.log(`⚠ Patient ${patient.email} already exists`);
    }
  }

  // Create doctor profiles
  for (const doctor of doctorProfiles) {
    try {
      const hashedPassword = await bcrypt.hash('password123', 10);
      
      const user = await storage.createUser({
        email: doctor.email,
        password: hashedPassword,
        firstName: doctor.firstName,
        lastName: doctor.lastName,
        role: doctor.role,
        profile: doctor.profile
      });

      const doctorRecord = await storage.createDoctor({
        userId: user.id,
        specialty: doctor.specialty,
        averageRating: doctor.averageRating,
        reviewCount: doctor.reviewCount,
        isAvailable: true
      });
      
      createdDoctors.push(doctorRecord);
      console.log(`✓ Created doctor: Dr. ${doctor.firstName} ${doctor.lastName} (${doctor.specialty})`);
    } catch (error) {
      console.log(`⚠ Doctor ${doctor.email} already exists`);
    }
  }

  console.log(`\n🎉 Profile creation complete!`);
  console.log(`📋 Created ${createdUsers.length} patients and ${createdDoctors.length} doctors`);
  
  return { patients: createdUsers, doctors: createdDoctors };
}

export { seedProfiles };