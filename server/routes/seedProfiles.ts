import express from 'express';
import bcrypt from 'bcryptjs';
import { storage } from '../storage';
import { FirebaseAuthService } from '../services/firebaseAuthService';

const router = express.Router();

// Realistic patient profiles
const patientProfiles = [
  {
    email: "sarah.johnson@email.com",
    password: "password123",
    firstName: "Sarah",
    lastName: "Johnson",
    role: "patient" as const,
    profile: {
      age: 34,
      gender: "Female",
      bio: "Software engineer, active lifestyle, occasional migraines",
      phone: "+1-555-0101"
    }
  },
  {
    email: "michael.chen@email.com",
    password: "password123",
    firstName: "Michael",
    lastName: "Chen",
    role: "patient" as const,
    profile: {
      age: 28,
      gender: "Male",
      bio: "Marketing professional, diabetes type 1, regular fitness routine",
      phone: "+1-555-0102"
    }
  },
  {
    email: "elena.rodriguez@email.com",
    password: "password123",
    firstName: "Elena",
    lastName: "Rodriguez",
    role: "patient" as const,
    profile: {
      age: 45,
      gender: "Female",
      bio: "Teacher, hypertension, mother of two",
      phone: "+1-555-0103"
    }
  },
  {
    email: "david.thompson@email.com",
    password: "password123",
    firstName: "David",
    lastName: "Thompson",
    role: "patient" as const,
    profile: {
      age: 52,
      gender: "Male",
      bio: "Construction worker, back pain issues, high cholesterol",
      phone: "+1-555-0104"
    }
  },
  {
    email: "lisa.williams@email.com",
    password: "password123",
    firstName: "Lisa",
    lastName: "Williams",
    role: "patient" as const,
    profile: {
      age: 29,
      gender: "Female",
      bio: "Nurse, anxiety management, healthy lifestyle advocate",
      phone: "+1-555-0105"
    }
  },
  {
    email: "james.brown@email.com",
    password: "password123",
    firstName: "James",
    lastName: "Brown",
    role: "patient" as const,
    profile: {
      age: 67,
      gender: "Male",
      bio: "Retired accountant, arthritis, regular medication routine",
      phone: "+1-555-0106"
    }
  },
  {
    email: "maria.garcia@email.com",
    password: "password123",
    firstName: "Maria",
    lastName: "Garcia",
    role: "patient" as const,
    profile: {
      age: 38,
      gender: "Female",
      bio: "Restaurant owner, stress management, occasional insomnia",
      phone: "+1-555-0107"
    }
  },
  {
    email: "robert.davis@email.com",
    password: "password123",
    firstName: "Robert",
    lastName: "Davis",
    role: "patient" as const,
    profile: {
      age: 43,
      gender: "Male",
      bio: "IT consultant, sedentary lifestyle, weight management goals",
      phone: "+1-555-0108"
    }
  },
  {
    email: "jennifer.miller@email.com",
    password: "password123",
    firstName: "Jennifer",
    lastName: "Miller",
    role: "patient" as const,
    profile: {
      age: 31,
      gender: "Female",
      bio: "Graphic designer, eye strain issues, creative professional",
      phone: "+1-555-0109"
    }
  },
  {
    email: "thomas.wilson@email.com",
    password: "password123",
    firstName: "Thomas",
    lastName: "Wilson",
    role: "patient" as const,
    profile: {
      age: 56,
      gender: "Male",
      bio: "Sales manager, travel frequently, heart health monitoring",
      phone: "+1-555-0110"
    }
  }
];

// Realistic doctor profiles
const doctorProfiles = [
  {
    email: "dr.emily.stone@medical.com",
    password: "password123",
    firstName: "Emily",
    lastName: "Stone",
    role: "doctor" as const,
    specialty: "Cardiology",
    profile: {
      bio: "Board-certified cardiologist with 15 years experience. Specializes in preventive cardiology and heart disease management.",
      phone: "+1-555-1001"
    },
    averageRating: 4.8,
    reviewCount: 147
  },
  {
    email: "dr.ahmed.hassan@medical.com",
    password: "password123",
    firstName: "Ahmed",
    lastName: "Hassan",
    role: "doctor" as const,
    specialty: "Endocrinology",
    profile: {
      bio: "Endocrinologist specializing in diabetes management and thyroid disorders. 12 years of clinical experience.",
      phone: "+1-555-1002"
    },
    averageRating: 4.7,
    reviewCount: 132
  },
  {
    email: "dr.rachel.kim@medical.com",
    password: "password123",
    firstName: "Rachel",
    lastName: "Kim",
    role: "doctor" as const,
    specialty: "Neurology",
    profile: {
      bio: "Neurologist with expertise in migraine treatment and neurological disorders. Published researcher in headache medicine.",
      phone: "+1-555-1003"
    },
    averageRating: 4.9,
    reviewCount: 89
  },
  {
    email: "dr.marcus.taylor@medical.com",
    password: "password123",
    firstName: "Marcus",
    lastName: "Taylor",
    role: "doctor" as const,
    specialty: "Orthopedics",
    profile: {
      bio: "Orthopedic surgeon specializing in sports medicine and joint replacement. Former team physician for professional athletes.",
      phone: "+1-555-1004"
    },
    averageRating: 4.6,
    reviewCount: 203
  },
  {
    email: "dr.sarah.patel@medical.com",
    password: "password123",
    firstName: "Sarah",
    lastName: "Patel",
    role: "doctor" as const,
    specialty: "Psychiatry",
    profile: {
      bio: "Board-certified psychiatrist specializing in anxiety and mood disorders. Cognitive behavioral therapy certified.",
      phone: "+1-555-1005"
    },
    averageRating: 4.8,
    reviewCount: 156
  },
  {
    email: "dr.benjamin.clark@medical.com",
    password: "password123",
    firstName: "Benjamin",
    lastName: "Clark",
    role: "doctor" as const,
    specialty: "Geriatrics",
    profile: {
      bio: "Geriatrician with 20 years experience in elderly care. Specializes in comprehensive geriatric assessment and chronic disease management.",
      phone: "+1-555-1006"
    },
    averageRating: 4.7,
    reviewCount: 178
  },
  {
    email: "dr.laura.martinez@medical.com",
    password: "password123",
    firstName: "Laura",
    lastName: "Martinez",
    role: "doctor" as const,
    specialty: "Gastroenterology",
    profile: {
      bio: "Gastroenterologist specializing in digestive health and inflammatory bowel disease. Advanced endoscopy certified.",
      phone: "+1-555-1007"
    },
    averageRating: 4.5,
    reviewCount: 94
  },
  {
    email: "dr.kevin.wright@medical.com",
    password: "password123",
    firstName: "Kevin",
    lastName: "Wright",
    role: "doctor" as const,
    specialty: "Pulmonology",
    profile: {
      bio: "Pulmonologist with expertise in respiratory diseases and sleep medicine. Critical care medicine certified.",
      phone: "+1-555-1008"
    },
    averageRating: 4.6,
    reviewCount: 112
  },
  {
    email: "dr.natalie.lee@medical.com",
    password: "password123",
    firstName: "Natalie",
    lastName: "Lee",
    role: "doctor" as const,
    specialty: "Ophthalmology",
    profile: {
      bio: "Ophthalmologist specializing in retinal diseases and cataract surgery. Fellowship trained in vitreoretinal surgery.",
      phone: "+1-555-1009"
    },
    averageRating: 4.9,
    reviewCount: 76
  },
  {
    email: "dr.anthony.moore@medical.com",
    password: "password123",
    firstName: "Anthony",
    lastName: "Moore",
    role: "doctor" as const,
    specialty: "Dermatology",
    profile: {
      bio: "Board-certified dermatologist with expertise in skin cancer detection and cosmetic dermatology. Mohs surgery certified.",
      phone: "+1-555-1010"
    },
    averageRating: 4.7,
    reviewCount: 128
  }
];

router.post('/create-profiles', express.json(), async (req, res) => {
  try {
    const createdUsers = [];
    const createdDoctors = [];
    const errors = [];

    console.log('Starting profile creation...');

    // Create patient profiles
    for (const patientData of patientProfiles) {
      try {
        // Check if user already exists
        const existingUser = await storage.getUserByEmail(patientData.email);
        if (existingUser) {
          console.log(`Patient ${patientData.email} already exists, skipping...`);
          continue;
        }

        // Create user in Firebase Authentication
        let firebaseUser;
        try {
          firebaseUser = await FirebaseAuthService.createUser({
            email: patientData.email,
            password: patientData.password,
            firstName: patientData.firstName,
            lastName: patientData.lastName,
            role: patientData.role
          });
        } catch (firebaseError) {
          console.log(`Firebase creation failed for ${patientData.email}, continuing with local storage only`);
        }

        // Hash password for local storage
        const hashedPassword = await bcrypt.hash(patientData.password, 10);

        // Create user in local database
        const user = await storage.createUser({
          email: patientData.email,
          password: hashedPassword,
          firstName: patientData.firstName,
          lastName: patientData.lastName,
          role: patientData.role,
          profile: patientData.profile
        });

        createdUsers.push({
          id: user.id,
          email: user.email,
          firstName: user.firstName,
          lastName: user.lastName,
          role: user.role,
          firebaseUid: firebaseUser?.uid
        });

        console.log(`Created patient: ${patientData.firstName} ${patientData.lastName}`);
      } catch (error) {
        console.error(`Error creating patient ${patientData.email}:`, error);
        errors.push(`Failed to create patient ${patientData.email}: ${error instanceof Error ? error.message : 'Unknown error'}`);
      }
    }

    // Create doctor profiles
    for (const doctorData of doctorProfiles) {
      try {
        // Check if user already exists
        const existingUser = await storage.getUserByEmail(doctorData.email);
        if (existingUser) {
          console.log(`Doctor ${doctorData.email} already exists, skipping...`);
          continue;
        }

        // Create user in Firebase Authentication
        let firebaseUser;
        try {
          firebaseUser = await FirebaseAuthService.createUser({
            email: doctorData.email,
            password: doctorData.password,
            firstName: doctorData.firstName,
            lastName: doctorData.lastName,
            role: doctorData.role,
            specialty: doctorData.specialty
          });
        } catch (firebaseError) {
          console.log(`Firebase creation failed for ${doctorData.email}, continuing with local storage only`);
        }

        // Hash password for local storage
        const hashedPassword = await bcrypt.hash(doctorData.password, 10);

        // Create user in local database
        const user = await storage.createUser({
          email: doctorData.email,
          password: hashedPassword,
          firstName: doctorData.firstName,
          lastName: doctorData.lastName,
          role: doctorData.role,
          profile: doctorData.profile
        });

        // Create doctor profile
        const doctor = await storage.createDoctor({
          userId: user.id,
          specialty: doctorData.specialty,
          averageRating: doctorData.averageRating,
          reviewCount: doctorData.reviewCount,
          isAvailable: true
        });

        createdDoctors.push({
          id: doctor.id,
          userId: user.id,
          email: user.email,
          firstName: user.firstName,
          lastName: user.lastName,
          specialty: doctor.specialty,
          averageRating: doctor.averageRating,
          reviewCount: doctor.reviewCount,
          firebaseUid: firebaseUser?.uid
        });

        console.log(`Created doctor: Dr. ${doctorData.firstName} ${doctorData.lastName} (${doctorData.specialty})`);
      } catch (error) {
        console.error(`Error creating doctor ${doctorData.email}:`, error);
        errors.push(`Failed to create doctor ${doctorData.email}: ${error instanceof Error ? error.message : 'Unknown error'}`);
      }
    }

    res.json({
      success: true,
      message: 'Profile creation completed',
      results: {
        patientsCreated: createdUsers.length,
        doctorsCreated: createdDoctors.length,
        patients: createdUsers,
        doctors: createdDoctors,
        errors: errors
      }
    });

  } catch (error) {
    console.error('Profile creation error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to create profiles',
      details: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

export default router;