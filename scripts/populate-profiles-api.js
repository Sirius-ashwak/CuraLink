/**
 * Populate profiles through API endpoints
 * This uses your existing backend to create 10 patients and 10 doctors
 */

const API_BASE = 'http://localhost:5000/api';

// 10 Patient profiles
const patients = [
  { email: "sarah.johnson@email.com", password: "SecurePass123", firstName: "Sarah", lastName: "Johnson", role: "patient", profile: { age: 34, gender: "Female", bio: "Software engineer, active lifestyle, occasional migraines", phone: "+1-555-0101" }},
  { email: "michael.chen@email.com", password: "SecurePass123", firstName: "Michael", lastName: "Chen", role: "patient", profile: { age: 28, gender: "Male", bio: "Marketing professional, diabetes type 1", phone: "+1-555-0102" }},
  { email: "elena.rodriguez@email.com", password: "SecurePass123", firstName: "Elena", lastName: "Rodriguez", role: "patient", profile: { age: 45, gender: "Female", bio: "Teacher, hypertension, mother of two", phone: "+1-555-0103" }},
  { email: "david.thompson@email.com", password: "SecurePass123", firstName: "David", lastName: "Thompson", role: "patient", profile: { age: 52, gender: "Male", bio: "Construction worker, back pain issues", phone: "+1-555-0104" }},
  { email: "lisa.williams@email.com", password: "SecurePass123", firstName: "Lisa", lastName: "Williams", role: "patient", profile: { age: 29, gender: "Female", bio: "Nurse, anxiety management", phone: "+1-555-0105" }},
  { email: "james.brown@email.com", password: "SecurePass123", firstName: "James", lastName: "Brown", role: "patient", profile: { age: 67, gender: "Male", bio: "Retired accountant, arthritis", phone: "+1-555-0106" }},
  { email: "maria.garcia@email.com", password: "SecurePass123", firstName: "Maria", lastName: "Garcia", role: "patient", profile: { age: 41, gender: "Female", bio: "Restaurant owner, migraines", phone: "+1-555-0107" }},
  { email: "robert.lee@email.com", password: "SecurePass123", firstName: "Robert", lastName: "Lee", role: "patient", profile: { age: 35, gender: "Male", bio: "Graphic designer, carpal tunnel", phone: "+1-555-0108" }},
  { email: "jennifer.davis@email.com", password: "SecurePass123", firstName: "Jennifer", lastName: "Davis", role: "patient", profile: { age: 50, gender: "Female", bio: "Legal assistant, stress management", phone: "+1-555-0109" }},
  { email: "kevin.wilson@email.com", password: "SecurePass123", firstName: "Kevin", lastName: "Wilson", role: "patient", profile: { age: 38, gender: "Male", bio: "IT specialist, back pain from desk work", phone: "+1-555-0110" }}
];

// 10 Doctor profiles
const doctors = [
  { email: "dr.smith@hospital.com", password: "SecurePass123", firstName: "John", lastName: "Smith", role: "doctor", specialty: "Cardiology", profile: { bio: "Board-certified cardiologist with 15 years of experience", phone: "+1-555-1001" }},
  { email: "dr.anderson@hospital.com", password: "SecurePass123", firstName: "Emily", lastName: "Anderson", role: "doctor", specialty: "Pediatrics", profile: { bio: "Pediatric specialist focusing on child development", phone: "+1-555-1002" }},
  { email: "dr.martinez@hospital.com", password: "SecurePass123", firstName: "Carlos", lastName: "Martinez", role: "doctor", specialty: "Dermatology", profile: { bio: "Dermatologist specializing in skin cancer prevention", phone: "+1-555-1003" }},
  { email: "dr.kim@hospital.com", password: "SecurePass123", firstName: "Susan", lastName: "Kim", role: "doctor", specialty: "Neurology", profile: { bio: "Neurologist with expertise in migraine treatment", phone: "+1-555-1004" }},
  { email: "dr.taylor@hospital.com", password: "SecurePass123", firstName: "Michael", lastName: "Taylor", role: "doctor", specialty: "Orthopedics", profile: { bio: "Orthopedic surgeon specializing in sports medicine", phone: "+1-555-1005" }},
  { email: "dr.white@hospital.com", password: "SecurePass123", firstName: "Rachel", lastName: "White", role: "doctor", specialty: "Psychiatry", profile: { bio: "Psychiatrist focusing on anxiety and depression", phone: "+1-555-1006" }},
  { email: "dr.johnson@hospital.com", password: "SecurePass123", firstName: "David", lastName: "Johnson", role: "doctor", specialty: "General Practice", profile: { bio: "Family physician with comprehensive care approach", phone: "+1-555-1007" }},
  { email: "dr.brown@hospital.com", password: "SecurePass123", firstName: "Lisa", lastName: "Brown", role: "doctor", specialty: "Endocrinology", profile: { bio: "Endocrinologist specializing in diabetes management", phone: "+1-555-1008" }},
  { email: "dr.davis@hospital.com", password: "SecurePass123", firstName: "Mark", lastName: "Davis", role: "doctor", specialty: "Gastroenterology", profile: { bio: "GI specialist with focus on digestive health", phone: "+1-555-1009" }},
  { email: "dr.wilson@hospital.com", password: "SecurePass123", firstName: "Amanda", lastName: "Wilson", role: "doctor", specialty: "Oncology", profile: { bio: "Oncologist dedicated to cancer treatment and research", phone: "+1-555-1010" }}
];

async function createProfile(profile, type) {
  try {
    const response = await fetch(`${API_BASE}/auth/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(profile)
    });
    
    if (response.ok) {
      const result = await response.json();
      console.log(`✅ Created ${type}: ${profile.firstName} ${profile.lastName}`);
      return true;
    } else {
      const error = await response.text();
      console.log(`⚠️ ${type} ${profile.email} - ${error}`);
      return false;
    }
  } catch (error) {
    console.error(`❌ Error creating ${type} ${profile.email}:`, error.message);
    return false;
  }
}

async function populateProfiles() {
  console.log('🚀 Starting to populate Firebase with 10 patients and 10 doctors...\n');
  
  let patientsCreated = 0;
  let doctorsCreated = 0;
  
  // Create patient profiles
  console.log('📝 Creating patient profiles...');
  for (const patient of patients) {
    const success = await createProfile(patient, 'patient');
    if (success) patientsCreated++;
    // Small delay to avoid overwhelming the server
    await new Promise(resolve => setTimeout(resolve, 100));
  }
  
  console.log('\n👨‍⚕️ Creating doctor profiles...');
  // Create doctor profiles
  for (const doctor of doctors) {
    const success = await createProfile(doctor, 'doctor');
    if (success) doctorsCreated++;
    // Small delay to avoid overwhelming the server
    await new Promise(resolve => setTimeout(resolve, 100));
  }
  
  console.log('\n🎉 Profile creation completed!');
  console.log(`📊 Summary:`);
  console.log(`   - Patients created: ${patientsCreated}/10`);
  console.log(`   - Doctors created: ${doctorsCreated}/10`);
  console.log(`   - Total profiles: ${patientsCreated + doctorsCreated}/20`);
  
  if (patientsCreated + doctorsCreated === 20) {
    console.log('\n✨ All 20 profiles successfully added to Firebase database!');
  } else {
    console.log('\n⚠️ Some profiles may already exist or encountered errors.');
  }
}

// Run the population
populateProfiles().catch(console.error);