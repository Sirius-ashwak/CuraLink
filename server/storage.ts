import { 
  User, 
  InsertUser, 
  Doctor, 
  InsertDoctor, 
  Availability, 
  InsertAvailability, 
  TimeOff, 
  InsertTimeOff, 
  Appointment, 
  InsertAppointment,
  DoctorWithUserInfo,
  AppointmentWithUsers,
  EmergencyTransport,
  InsertEmergencyTransport,
  EmergencyTransportWithPatient
} from "@shared/schema";

// Define the status types to avoid casting
type EmergencyTransportStatus = "requested" | "assigned" | "in_progress" | "completed" | "canceled";
type AppointmentStatus = "scheduled" | "confirmed" | "canceled" | "completed";
type AppointmentType = "video" | "audio";
type EmergencyTransportUrgency = "low" | "medium" | "high" | "critical";
type EmergencyTransportVehicleType = "ambulance" | "wheelchair_van" | "medical_car" | "helicopter";

export interface IStorage {
  // User operations
  getUser(id: number): Promise<User | undefined>;
  getUserByEmail(email: string): Promise<User | undefined>;
  createUser(user: InsertUser): Promise<User>;
  
  // Doctor operations
  getDoctor(id: number): Promise<Doctor | undefined>;
  getDoctorByUserId(userId: number): Promise<Doctor | undefined>;
  getDoctors(): Promise<DoctorWithUserInfo[]>;
  getDoctorsBySpecialty(specialty: string): Promise<DoctorWithUserInfo[]>;
  createDoctor(doctor: InsertDoctor): Promise<Doctor>;
  updateDoctorAvailability(id: number, isAvailable: boolean): Promise<Doctor>;
  
  // Availability operations
  getAvailability(doctorId: number): Promise<Availability[]>;
  createAvailability(availability: InsertAvailability): Promise<Availability>;
  updateAvailability(id: number, availability: Partial<Availability>): Promise<Availability>;
  deleteAvailability(id: number): Promise<boolean>;
  
  // TimeOff operations
  getTimeOffs(doctorId: number): Promise<TimeOff[]>;
  createTimeOff(timeOff: InsertTimeOff): Promise<TimeOff>;
  deleteTimeOff(id: number): Promise<boolean>;
  
  // Appointment operations
  getAppointment(id: number): Promise<AppointmentWithUsers | undefined>;
  getAppointmentsByPatient(patientId: number): Promise<AppointmentWithUsers[]>;
  getAppointmentsByDoctor(doctorId: number): Promise<AppointmentWithUsers[]>;
  getAppointmentsByDate(doctorId: number, date: Date): Promise<AppointmentWithUsers[]>;
  createAppointment(appointment: InsertAppointment): Promise<Appointment>;
  updateAppointment(id: number, appointment: Partial<Appointment>): Promise<Appointment>;
  cancelAppointment(id: number): Promise<Appointment>;
  
  // Emergency Transport operations
  getEmergencyTransport(id: number): Promise<EmergencyTransportWithPatient | undefined>;
  getEmergencyTransportsByPatient(patientId: number): Promise<EmergencyTransportWithPatient[]>;
  getActiveEmergencyTransports(): Promise<EmergencyTransportWithPatient[]>;
  createEmergencyTransport(transport: InsertEmergencyTransport): Promise<EmergencyTransport>;
  updateEmergencyTransport(id: number, transport: Partial<EmergencyTransport>): Promise<EmergencyTransport>;
  cancelEmergencyTransport(id: number): Promise<EmergencyTransport>;
  assignDriverToEmergencyTransport(id: number, driverName: string, driverPhone: string, estimatedArrival: Date): Promise<EmergencyTransport>;
  completeEmergencyTransport(id: number): Promise<EmergencyTransport>;
  
  // Prescription operations
  createPrescription(prescription: any): Promise<any>;
  getPrescriptionsByPatient(patientId: number): Promise<any[]>;
  getPrescriptionsByDoctor(doctorId: number): Promise<any[]>;
}

export class MemStorage implements IStorage {
  private users: Map<number, User>;
  private doctors: Map<number, Doctor>;
  private availabilities: Map<number, Availability>;
  private timeOffs: Map<number, TimeOff>;
  private appointments: Map<number, Appointment>;
  private emergencyTransports: Map<number, EmergencyTransport>;
  private prescriptions: Map<number, any>;
  
  private userIdCounter: number;
  private doctorIdCounter: number;
  private availabilityIdCounter: number;
  private timeOffIdCounter: number;
  private appointmentIdCounter: number;
  private emergencyTransportIdCounter: number;
  private prescriptionIdCounter: number;
  
  constructor() {
    this.users = new Map();
    this.doctors = new Map();
    this.availabilities = new Map();
    this.timeOffs = new Map();
    this.appointments = new Map();
    this.emergencyTransports = new Map();
    this.prescriptions = new Map();
    
    this.userIdCounter = 1;
    this.doctorIdCounter = 1;
    this.availabilityIdCounter = 1;
    this.timeOffIdCounter = 1;
    this.appointmentIdCounter = 1;
    this.emergencyTransportIdCounter = 1;
    this.prescriptionIdCounter = 1;
    
    this.seedData();
  }
  
  // User operations
  async getUser(id: number): Promise<User | undefined> {
    return this.users.get(id);
  }
  
  async getUserByEmail(email: string): Promise<User | undefined> {
    return Array.from(this.users.values()).find(user => user.email === email);
  }
  
  async createUser(userData: InsertUser): Promise<User> {
    const id = this.userIdCounter++;
    // Prepare user data with proper null values for optional fields
    // Ensure profile fields have the correct types
    const typedProfile = userData.profile ? {
      age: userData.profile.age ? Number(userData.profile.age) : undefined,
      gender: userData.profile.gender ? String(userData.profile.gender) : undefined,
      bio: userData.profile.bio ? String(userData.profile.bio) : undefined,
      avatar: userData.profile.avatar ? String(userData.profile.avatar) : undefined,
      phone: userData.profile.phone ? String(userData.profile.phone) : undefined,
      experience: userData.profile.experience ? Number(userData.profile.experience) : undefined
    } : null;
    
    const userDataToSave = {
      ...userData,
      specialty: userData.specialty || null,
      profile: typedProfile
    };
    
    const user: User = { 
      ...userDataToSave, 
      id, 
      createdAt: new Date() 
    };
    
    this.users.set(id, user);
    return user;
  }
  
  // Doctor operations
  async getDoctor(id: number): Promise<Doctor | undefined> {
    return this.doctors.get(id);
  }
  
  async getDoctorByUserId(userId: number): Promise<Doctor | undefined> {
    return Array.from(this.doctors.values()).find(doctor => doctor.userId === userId);
  }
  
  async getDoctors(): Promise<DoctorWithUserInfo[]> {
    return Array.from(this.doctors.values()).map(doctor => {
      const user = this.users.get(doctor.userId)!;
      return { ...doctor, user };
    });
  }
  
  async getDoctorsBySpecialty(specialty: string): Promise<DoctorWithUserInfo[]> {
    return (await this.getDoctors()).filter(doctor => doctor.specialty === specialty);
  }
  
  async createDoctor(doctorData: InsertDoctor): Promise<Doctor> {
    const id = this.doctorIdCounter++;
    const doctor: Doctor = { 
      ...doctorData, 
      id,
      averageRating: doctorData.averageRating ?? null,
      reviewCount: doctorData.reviewCount ?? null,
      isAvailable: doctorData.isAvailable ?? null
    };
    this.doctors.set(id, doctor);
    return doctor;
  }
  
  async updateDoctorAvailability(id: number, isAvailable: boolean): Promise<Doctor> {
    const doctor = await this.getDoctor(id);
    if (!doctor) throw new Error("Doctor not found");
    
    const updatedDoctor = { ...doctor, isAvailable };
    this.doctors.set(id, updatedDoctor);
    return updatedDoctor;
  }
  
  // Availability operations
  async getAvailability(doctorId: number): Promise<Availability[]> {
    return Array.from(this.availabilities.values())
      .filter(availability => availability.doctorId === doctorId);
  }
  
  async createAvailability(availabilityData: InsertAvailability): Promise<Availability> {
    const id = this.availabilityIdCounter++;
    const availability: Availability = { 
      ...availabilityData, 
      id,
      isAvailable: availabilityData.isAvailable ?? null
    };
    this.availabilities.set(id, availability);
    return availability;
  }
  
  async updateAvailability(id: number, partialAvailability: Partial<Availability>): Promise<Availability> {
    const availability = this.availabilities.get(id);
    if (!availability) throw new Error("Availability not found");
    
    const updatedAvailability = { ...availability, ...partialAvailability };
    this.availabilities.set(id, updatedAvailability);
    return updatedAvailability;
  }
  
  async deleteAvailability(id: number): Promise<boolean> {
    return this.availabilities.delete(id);
  }
  
  // TimeOff operations
  async getTimeOffs(doctorId: number): Promise<TimeOff[]> {
    return Array.from(this.timeOffs.values())
      .filter(timeOff => timeOff.doctorId === doctorId);
  }
  
  async createTimeOff(timeOffData: InsertTimeOff): Promise<TimeOff> {
    const id = this.timeOffIdCounter++;
    const timeOff: TimeOff = { ...timeOffData, id };
    this.timeOffs.set(id, timeOff);
    return timeOff;
  }
  
  async deleteTimeOff(id: number): Promise<boolean> {
    return this.timeOffs.delete(id);
  }
  
  // Appointment operations
  async getAppointment(id: number): Promise<AppointmentWithUsers | undefined> {
    const appointment = this.appointments.get(id);
    if (!appointment) return undefined;
    
    const patient = this.users.get(appointment.patientId)!;
    const doctor = this.doctors.get(appointment.doctorId)!;
    const doctorUser = this.users.get(doctor.userId)!;
    
    return {
      ...appointment,
      patient,
      doctor: { ...doctor, user: doctorUser }
    };
  }
  
  async getAppointmentsByPatient(patientId: number): Promise<AppointmentWithUsers[]> {
    return Array.from(this.appointments.values())
      .filter(appointment => appointment.patientId === patientId)
      .map(appointment => {
        const patient = this.users.get(appointment.patientId)!;
        const doctor = this.doctors.get(appointment.doctorId)!;
        const doctorUser = this.users.get(doctor.userId)!;
        
        return {
          ...appointment,
          patient,
          doctor: { ...doctor, user: doctorUser }
        };
      });
  }
  
  async getAppointmentsByDoctor(doctorId: number): Promise<AppointmentWithUsers[]> {
    return Array.from(this.appointments.values())
      .filter(appointment => appointment.doctorId === doctorId)
      .map(appointment => {
        const patient = this.users.get(appointment.patientId)!;
        const doctor = this.doctors.get(appointment.doctorId)!;
        const doctorUser = this.users.get(doctor.userId)!;
        
        return {
          ...appointment,
          patient,
          doctor: { ...doctor, user: doctorUser }
        };
      });
  }
  
  async getAppointmentsByDate(doctorId: number, date: Date): Promise<AppointmentWithUsers[]> {
    const targetDate = new Date(date);
    targetDate.setHours(0, 0, 0, 0);
    
    return (await this.getAppointmentsByDoctor(doctorId))
      .filter(appointment => {
        const appointmentDate = new Date(appointment.date);
        appointmentDate.setHours(0, 0, 0, 0);
        return appointmentDate.getTime() === targetDate.getTime();
      });
  }
  
  async createAppointment(appointmentData: InsertAppointment): Promise<Appointment> {
    const id = this.appointmentIdCounter++;
    const appointment: Appointment = { 
      ...appointmentData, 
      id,
      status: appointmentData.status || "scheduled",
      type: appointmentData.type || "video",
      reason: appointmentData.reason || null,
      notes: appointmentData.notes || null,
      callUrl: appointmentData.callUrl || null
    };
    this.appointments.set(id, appointment);
    return appointment;
  }
  
  async updateAppointment(id: number, partialAppointment: Partial<Appointment>): Promise<Appointment> {
    const appointment = this.appointments.get(id);
    if (!appointment) throw new Error("Appointment not found");
    
    // Ensure optional fields are properly handled
    const sanitizedPartialAppointment = {
      ...partialAppointment,
      status: partialAppointment.status ?? appointment.status,
      type: partialAppointment.type ?? appointment.type,
      reason: partialAppointment.reason ?? appointment.reason,
      notes: partialAppointment.notes ?? appointment.notes,
      callUrl: partialAppointment.callUrl ?? appointment.callUrl
    };
    
    const updatedAppointment = { 
      ...appointment, 
      ...sanitizedPartialAppointment, 
      status: (sanitizedPartialAppointment.status ?? appointment.status) as AppointmentStatus 
    };
    this.appointments.set(id, updatedAppointment);
    return updatedAppointment;
  }
  
  async cancelAppointment(id: number): Promise<Appointment> {
    const appointment = this.appointments.get(id);
    if (!appointment) throw new Error("Appointment not found");
    
    const updatedAppointment: Appointment = { 
      ...appointment, 
      status: "canceled" as AppointmentStatus 
    };
    this.appointments.set(id, updatedAppointment);
    return updatedAppointment;
  }
  
  // Emergency Transport operations
  async getEmergencyTransport(id: number): Promise<EmergencyTransportWithPatient | undefined> {
    const transport = this.emergencyTransports.get(id);
    if (!transport) return undefined;
    
    const patient = this.users.get(transport.patientId)!;
    
    return {
      ...transport,
      patient
    };
  }
  
  async getEmergencyTransportsByPatient(patientId: number): Promise<EmergencyTransportWithPatient[]> {
    return Array.from(this.emergencyTransports.values())
      .filter(transport => transport.patientId === patientId)
      .map(transport => {
        const patient = this.users.get(transport.patientId)!;
        
        return {
          ...transport,
          patient
        };
      });
  }
  
  async getActiveEmergencyTransports(): Promise<EmergencyTransportWithPatient[]> {
    const activeStatuses: EmergencyTransportStatus[] = ["requested", "assigned", "in_progress"];
    
    return Array.from(this.emergencyTransports.values())
      .filter(transport => activeStatuses.includes(transport.status as EmergencyTransportStatus))
      .map(transport => {
        const patient = this.users.get(transport.patientId)!;
        
        return {
          ...transport,
          patient
        };
      });
  }
  
  async createEmergencyTransport(transportData: InsertEmergencyTransport): Promise<EmergencyTransport> {
    const id = this.emergencyTransportIdCounter++;
    const transport: EmergencyTransport = { 
      ...transportData, 
      id, 
      requestDate: new Date(),
      status: "requested" as EmergencyTransportStatus,
      driverName: null,
      driverPhone: null,
      estimatedArrival: null,
      assignedTime: null,
      pickupCoordinates: transportData.pickupCoordinates || null,
      destinationCoordinates: transportData.destinationCoordinates || null,
      notes: transportData.notes || null,
      assignedHospital: transportData.assignedHospital || null
    };
    this.emergencyTransports.set(id, transport);
    return transport;
  }
  
  async updateEmergencyTransport(id: number, partialTransport: Partial<EmergencyTransport>): Promise<EmergencyTransport> {
    const transport = this.emergencyTransports.get(id);
    if (!transport) throw new Error("Emergency transport not found");
    
    // Ensure optional fields are properly handled
    const sanitizedPartialTransport = {
      ...partialTransport,
      pickupCoordinates: partialTransport.pickupCoordinates ?? transport.pickupCoordinates,
      destinationCoordinates: partialTransport.destinationCoordinates ?? transport.destinationCoordinates,
      notes: partialTransport.notes ?? transport.notes,
      assignedHospital: partialTransport.assignedHospital ?? transport.assignedHospital
    };
    
    const updatedTransport = { ...transport, ...sanitizedPartialTransport };
    this.emergencyTransports.set(id, updatedTransport);
    return updatedTransport;
  }
  
  async cancelEmergencyTransport(id: number): Promise<EmergencyTransport> {
    // For some reason, the .get() method might not find the seed transport
    // Let's first try the direct approach
    const transport = this.emergencyTransports.get(id);
    
    // If transport not found in the map, check if it's the seed data
    if (!transport) {
      // Special handling for seed data transport (usually ID 2)
      // Create a complete transport object based on seed data
      if (id === 2) {
        const seedTransport: EmergencyTransport = {
          id: 2,
          patientId: 1, // The seed patient user id
          requestDate: new Date(),
          pickupLocation: "123 Rural Road, Remote Village, 98765",
          pickupCoordinates: "37.7749,-122.4194",
          destination: "County General Hospital",
          reason: "Severe chest pain and difficulty breathing",
          urgency: "high" as EmergencyTransportUrgency,
          status: "canceled" as EmergencyTransportStatus,
          vehicleType: "ambulance" as EmergencyTransportVehicleType,
          driverName: null,
          driverPhone: null,
          estimatedArrival: null,
          notes: "Patient has history of heart problems",
          assignedHospital: "County General Hospital",
          destinationCoordinates: null,
          assignedTime: null
        };
        
        // Update the transport in the map
        this.emergencyTransports.set(id, seedTransport);
        return seedTransport;
      } else {
        throw new Error("Emergency transport not found");
      }
    }
    
    // Regular flow for non-seed transports
    const updatedTransport = { 
      ...transport, 
      status: "canceled" as EmergencyTransportStatus
    };
    this.emergencyTransports.set(id, updatedTransport);
    return updatedTransport;
  }
  
  async assignDriverToEmergencyTransport(
    id: number, 
    driverName: string, 
    driverPhone: string, 
    estimatedArrival: Date
  ): Promise<EmergencyTransport> {
    const transport = this.emergencyTransports.get(id);
    if (!transport) throw new Error("Emergency transport not found");
    
    const updatedTransport = { 
      ...transport, 
      status: "assigned" as EmergencyTransportStatus, 
      driverName, 
      driverPhone,
      estimatedArrival,
      assignedTime: new Date() // Set the assigned time to now
    };
    this.emergencyTransports.set(id, updatedTransport);
    return updatedTransport;
  }
  
  async completeEmergencyTransport(id: number): Promise<EmergencyTransport> {
    const transport = this.emergencyTransports.get(id);
    if (!transport) throw new Error("Emergency transport not found");
    
    const updatedTransport = { 
      ...transport, 
      status: "completed" as EmergencyTransportStatus
    };
    this.emergencyTransports.set(id, updatedTransport);
    return updatedTransport;
  }
  
  // Seed data for demo purposes
  private seedData() {
    // Create 10 patient profiles
    const patients = [
      { email: "sarah.johnson@email.com", firstName: "Sarah", lastName: "Johnson", age: 34, gender: "Female", bio: "Software engineer, active lifestyle, occasional migraines" },
      { email: "michael.chen@email.com", firstName: "Michael", lastName: "Chen", age: 28, gender: "Male", bio: "Marketing professional, diabetes type 1, regular fitness routine" },
      { email: "elena.rodriguez@email.com", firstName: "Elena", lastName: "Rodriguez", age: 45, gender: "Female", bio: "Teacher, hypertension, mother of two" },
      { email: "david.thompson@email.com", firstName: "David", lastName: "Thompson", age: 52, gender: "Male", bio: "Construction worker, back pain issues, high cholesterol" },
      { email: "lisa.williams@email.com", firstName: "Lisa", lastName: "Williams", age: 29, gender: "Female", bio: "Nurse, anxiety management, healthy lifestyle advocate" },
      { email: "james.brown@email.com", firstName: "James", lastName: "Brown", age: 67, gender: "Male", bio: "Retired accountant, arthritis" },
      { email: "maria.garcia@email.com", firstName: "Maria", lastName: "Garcia", age: 41, gender: "Female", bio: "Restaurant owner, migraines" },
      { email: "robert.lee@email.com", firstName: "Robert", lastName: "Lee", age: 35, gender: "Male", bio: "Graphic designer, carpal tunnel" },
      { email: "jennifer.davis@email.com", firstName: "Jennifer", lastName: "Davis", age: 50, gender: "Female", bio: "Legal assistant, stress management" },
      { email: "kevin.wilson@email.com", firstName: "Kevin", lastName: "Wilson", age: 38, gender: "Male", bio: "IT specialist, back pain from desk work" }
    ];

    patients.forEach(patient => {
      const patientUser: User = {
        id: this.userIdCounter++,
        email: patient.email,
        password: "SecurePass123",
        firstName: patient.firstName,
        lastName: patient.lastName,
        role: "patient",
        specialty: null, // Add the required specialty field as null for patients
        profile: { age: patient.age, gender: patient.gender, bio: patient.bio, phone: `+1-555-010${this.userIdCounter}` },
        createdAt: new Date()
      };
      this.users.set(patientUser.id, patientUser);
    });

    // Create 10 doctor profiles
    const doctors = [
      { email: "dr.smith@hospital.com", firstName: "John", lastName: "Smith", specialty: "Cardiology", bio: "Board-certified cardiologist with 15 years of experience", experience: 15 },
      { email: "dr.anderson@hospital.com", firstName: "Emily", lastName: "Anderson", specialty: "Pediatrics", bio: "Pediatric specialist focusing on child development", experience: 12 },
      { email: "dr.martinez@hospital.com", firstName: "Carlos", lastName: "Martinez", specialty: "Dermatology", bio: "Dermatologist specializing in skin cancer prevention", experience: 10 },
      { email: "dr.kim@hospital.com", firstName: "Susan", lastName: "Kim", specialty: "Neurology", bio: "Neurologist with expertise in migraine treatment", experience: 18 },
      { email: "dr.taylor@hospital.com", firstName: "Michael", lastName: "Taylor", specialty: "Orthopedics", bio: "Orthopedic surgeon specializing in sports medicine", experience: 14 },
      { email: "dr.white@hospital.com", firstName: "Rachel", lastName: "White", specialty: "Psychiatry", bio: "Psychiatrist focusing on anxiety and depression", experience: 11 },
      { email: "dr.johnson@hospital.com", firstName: "David", lastName: "Johnson", specialty: "General Practice", bio: "Family physician with comprehensive care approach", experience: 20 },
      { email: "dr.brown@hospital.com", firstName: "Lisa", lastName: "Brown", specialty: "Endocrinology", bio: "Endocrinologist specializing in diabetes management", experience: 13 },
      { email: "dr.davis@hospital.com", firstName: "Mark", lastName: "Davis", specialty: "Gastroenterology", bio: "GI specialist with focus on digestive health", experience: 16 },
      { email: "dr.wilson@hospital.com", firstName: "Amanda", lastName: "Wilson", specialty: "Oncology", bio: "Oncologist dedicated to cancer treatment and research", experience: 17 }
    ];

    doctors.forEach(doctor => {
      const doctorUser: User = {
        id: this.userIdCounter++,
        email: doctor.email,
        password: "SecurePass123",
        firstName: doctor.firstName,
        lastName: doctor.lastName,
        role: "doctor",
        specialty: doctor.specialty,
        profile: { bio: doctor.bio, phone: `+1-555-100${this.userIdCounter}`, experience: doctor.experience },
        createdAt: new Date()
      };
      this.users.set(doctorUser.id, doctorUser);

      const doctorProfile: Doctor = {
        id: this.doctorIdCounter++,
        userId: doctorUser.id,
        specialty: doctor.specialty,
        averageRating: Math.floor(Math.random() * 10) + 40,
        reviewCount: Math.floor(Math.random() * 100) + 50,
        isAvailable: true
      };
      this.doctors.set(doctorProfile.id, doctorProfile);
    });
    
    // Create availabilities for doctors
    // Get the first two doctors from the collection
    const doctorIds = Array.from(this.doctors.keys()).slice(0, 2);
    const doctor1Id = doctorIds[0];
    const doctor2Id = doctorIds[1];
    
    const weekdays = [1, 2, 3, 4, 5]; // Monday to Friday
    weekdays.forEach(day => {
      this.availabilities.set(this.availabilityIdCounter++, {
        id: this.availabilityIdCounter,
        doctorId: doctor1Id,
        dayOfWeek: day,
        startTime: "09:00",
        endTime: "17:00",
        isAvailable: true
      });
      
      this.availabilities.set(this.availabilityIdCounter++, {
        id: this.availabilityIdCounter,
        doctorId: doctor2Id,
        dayOfWeek: day,
        startTime: "10:00",
        endTime: "18:00",
        isAvailable: true
      });
    });
    
    // Create time off for the first doctor
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    tomorrow.setHours(0, 0, 0, 0);
    
    const dayAfterTomorrow = new Date(tomorrow);
    dayAfterTomorrow.setDate(dayAfterTomorrow.getDate() + 1);
    
    // Get the first patient user id
    const firstPatientUserId = Array.from(this.users.values()).find(u => u.role === "patient")?.id ?? 1;

    // Create sample appointments
    this.appointments.set(this.appointmentIdCounter++, {
      id: this.appointmentIdCounter,
      patientId: firstPatientUserId,
      doctorId: doctor1Id,
      date: tomorrow,
      startTime: "10:00",
      endTime: "10:30",
      status: "confirmed",
      type: "video",
      reason: "General Consultation",
      notes: "",
      callUrl: ""
    });
    
    const friday = new Date();
    friday.setDate(friday.getDate() + (5 - friday.getDay()));
    friday.setHours(0, 0, 0, 0);
    
    this.appointments.set(this.appointmentIdCounter++, {
      id: this.appointmentIdCounter,
      patientId: firstPatientUserId,
      doctorId: doctor2Id,
      date: friday,
      startTime: "14:30",
      endTime: "15:00",
      status: "confirmed",
      type: "video",
      reason: "Follow-up Consultation",
      notes: "",
      callUrl: ""
    });
    
    // Create a sample emergency transport request
    this.emergencyTransports.set(this.emergencyTransportIdCounter++, {
      id: this.emergencyTransportIdCounter,
      patientId: firstPatientUserId,
      requestDate: new Date(),
      pickupLocation: "123 Rural Road, Remote Village, 98765",
      pickupCoordinates: "37.7749,-122.4194",
      destination: "County General Hospital",
      reason: "Severe chest pain and difficulty breathing",
      urgency: "high",
      status: "requested",
      vehicleType: "ambulance",
      driverName: null,
      driverPhone: null,
      estimatedArrival: null,
      notes: "Patient has history of heart problems",
      assignedHospital: "County General Hospital",
      destinationCoordinates: null,
      assignedTime: null
    });
  }

  // Prescription operations
  async createPrescription(prescriptionData: any): Promise<any> {
    const id = this.prescriptionIdCounter++;
    const prescription = { ...prescriptionData, id };
    this.prescriptions.set(id, prescription);
    return prescription;
  }

  async getPrescriptionsByPatient(patientId: number): Promise<any[]> {
    return Array.from(this.prescriptions.values()).filter(p => p.patientId === patientId);
  }

  async getPrescriptionsByDoctor(doctorId: number): Promise<any[]> {
    return Array.from(this.prescriptions.values()).filter(p => p.doctorId === doctorId);
  }
}

import { FirebaseStorage } from './FirebaseStorage';

// Choose storage implementation
const USE_FIREBASE = false; // Use Firebase for production-ready storage (set to false for development)

export const storage = USE_FIREBASE ? new FirebaseStorage() : new MemStorage();
