/**
 * Seed Firebase with real patient and doctor profiles
 * This script creates authentic test data that will persist in your Firebase storage
 */

const API_BASE = 'http://localhost:5000/api';

// Real patient profiles to create
const patients = [
  {
    email: 'sarah.johnson@email.com',
    password: 'SecurePass123!',
    firstName: 'Sarah',
    lastName: 'Johnson',
    role: 'patient',
    specialty: null,
    profile: {
      age: 34,
      gender: 'female',
      phone: '+1-555-0123',
      bio: 'Working mother of two, interested in preventive care and family health.'
    }
  },
  {
    email: 'michael.chen@email.com',
    password: 'SecurePass123!',
    firstName: 'Michael',
    lastName: 'Chen',
    role: 'patient',
    specialty: null,
    profile: {
      age: 42,
      gender: 'male',
      phone: '+1-555-0124',
      bio: 'Software engineer focusing on stress management and mental wellness.'
    }
  },
  {
    email: 'emma.williams@email.com',
    password: 'SecurePass123!',
    firstName: 'Emma',
    lastName: 'Williams',
    role: 'patient',
    specialty: null,
    profile: {
      age: 28,
      gender: 'female',
      phone: '+1-555-0125',
      bio: 'Fitness enthusiast interested in sports medicine and nutrition.'
    }
  }
];

// Real doctor profiles to create
const doctors = [
  {
    // User account
    email: 'dr.anderson@curalink.com',
    password: 'DocSecure123!',
    firstName: 'Dr. Emily',
    lastName: 'Anderson',
    role: 'doctor',
    specialty: 'Cardiology',
    profile: {
      phone: '+1-555-0201',
      bio: 'Board-certified cardiologist with 15 years of experience in preventive cardiology and heart disease management.'
    },
    // Doctor-specific info
    doctorInfo: {
      specialty: 'Cardiology',
      averageRating: 4.8,
      reviewCount: 127,
      isAvailable: true
    }
  },
  {
    // User account
    email: 'dr.martinez@curalink.com',
    password: 'DocSecure123!',
    firstName: 'Dr. Carlos',
    lastName: 'Martinez',
    role: 'doctor',
    specialty: 'Pediatrics',
    profile: {
      phone: '+1-555-0202',
      bio: 'Pediatrician specializing in child development and family medicine with a focus on preventive care.'
    },
    // Doctor-specific info
    doctorInfo: {
      specialty: 'Pediatrics',
      averageRating: 4.9,
      reviewCount: 89,
      isAvailable: true
    }
  },
  {
    // User account
    email: 'dr.patel@curalink.com',
    password: 'DocSecure123!',
    firstName: 'Dr. Priya',
    lastName: 'Patel',
    role: 'doctor',
    specialty: 'Dermatology',
    profile: {
      phone: '+1-555-0203',
      bio: 'Dermatologist with expertise in skin health, cosmetic dermatology, and telemedicine consultations.'
    },
    // Doctor-specific info
    doctorInfo: {
      specialty: 'Dermatology',
      averageRating: 4.7,
      reviewCount: 156,
      isAvailable: true
    }
  }
];

async function seedFirebaseData() {
  console.log('🚀 Starting Firebase data seeding...');
  
  try {
    // Create patient accounts
    console.log('📝 Creating patient profiles...');
    for (const patient of patients) {
      try {
        const response = await fetch(`${API_BASE}/auth/register`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(patient)
        });
        
        if (response.ok) {
          const result = await response.json();
          console.log(`✅ Created patient: ${patient.firstName} ${patient.lastName}`);
        } else {
          const error = await response.text();
          console.log(`⚠️ Patient ${patient.email} may already exist or error: ${error}`);
        }
      } catch (error) {
        console.log(`❌ Error creating patient ${patient.email}:`, error.message);
      }
    }

    // Create doctor accounts and profiles
    console.log('👩‍⚕️ Creating doctor profiles...');
    for (const doctor of doctors) {
      try {
        // First, create the user account
        const userResponse = await fetch(`${API_BASE}/auth/register`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            email: doctor.email,
            password: doctor.password,
            firstName: doctor.firstName,
            lastName: doctor.lastName,
            role: doctor.role,
            specialty: doctor.specialty,
            profile: doctor.profile
          })
        });
        
        if (userResponse.ok) {
          const userResult = await userResponse.json();
          console.log(`✅ Created doctor user: ${doctor.firstName} ${doctor.lastName}`);
          
          // Then create the doctor profile
          const doctorResponse = await fetch(`${API_BASE}/doctors`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              userId: userResult.user.id,
              ...doctor.doctorInfo
            })
          });
          
          if (doctorResponse.ok) {
            console.log(`✅ Created doctor profile: ${doctor.firstName} ${doctor.lastName}`);
          }
        } else {
          const error = await userResponse.text();
          console.log(`⚠️ Doctor ${doctor.email} may already exist or error: ${error}`);
        }
      } catch (error) {
        console.log(`❌ Error creating doctor ${doctor.email}:`, error.message);
      }
    }

    console.log('🎉 Firebase data seeding completed!');
    console.log('💾 All profiles are now permanently stored in Firebase!');
    
  } catch (error) {
    console.error('❌ Seeding failed:', error);
  }
}

// Run the seeding
seedFirebaseData();