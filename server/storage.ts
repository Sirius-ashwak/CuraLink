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
}

export class MemStorage implements IStorage {
  private users: Map<number, User>;
  private doctors: Map<number, Doctor>;
  private availabilities: Map<number, Availability>;
  private timeOffs: Map<number, TimeOff>;
  private appointments: Map<number, Appointment>;
  private emergencyTransports: Map<number, EmergencyTransport>;
  
  private userIdCounter: number;
  private doctorIdCounter: number;
  private availabilityIdCounter: number;
  private timeOffIdCounter: number;
  private appointmentIdCounter: number;
  private emergencyTransportIdCounter: number;
  
  constructor() {
    this.users = new Map();
    this.doctors = new Map();
    this.availabilities = new Map();
    this.timeOffs = new Map();
    this.appointments = new Map();
    this.emergencyTransports = new Map();
    
    this.userIdCounter = 1;
    this.doctorIdCounter = 1;
    this.availabilityIdCounter = 1;
    this.timeOffIdCounter = 1;
    this.appointmentIdCounter = 1;
    this.emergencyTransportIdCounter = 1;
    
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
    const user: User = { ...userData, id, createdAt: new Date() };
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
    const doctor: Doctor = { ...doctorData, id };
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
    const availability: Availability = { ...availabilityData, id };
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
    const appointment: Appointment = { ...appointmentData, id };
    this.appointments.set(id, appointment);
    return appointment;
  }
  
  async updateAppointment(id: number, partialAppointment: Partial<Appointment>): Promise<Appointment> {
    const appointment = this.appointments.get(id);
    if (!appointment) throw new Error("Appointment not found");
    
    const updatedAppointment = { ...appointment, ...partialAppointment };
    this.appointments.set(id, updatedAppointment);
    return updatedAppointment;
  }
  
  async cancelAppointment(id: number): Promise<Appointment> {
    const appointment = this.appointments.get(id);
    if (!appointment) throw new Error("Appointment not found");
    
    const updatedAppointment = { ...appointment, status: "canceled" };
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
    const activeStatuses = ["requested", "assigned", "in_progress"];
    
    return Array.from(this.emergencyTransports.values())
      .filter(transport => activeStatuses.includes(transport.status))
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
      status: "requested",
      driverName: null,
      driverPhone: null,
      estimatedArrival: null
    };
    this.emergencyTransports.set(id, transport);
    return transport;
  }
  
  async updateEmergencyTransport(id: number, partialTransport: Partial<EmergencyTransport>): Promise<EmergencyTransport> {
    const transport = this.emergencyTransports.get(id);
    if (!transport) throw new Error("Emergency transport not found");
    
    const updatedTransport = { ...transport, ...partialTransport };
    this.emergencyTransports.set(id, updatedTransport);
    return updatedTransport;
  }
  
  async cancelEmergencyTransport(id: number): Promise<EmergencyTransport> {
    const transport = this.emergencyTransports.get(id);
    if (!transport) throw new Error("Emergency transport not found");
    
    const updatedTransport = { ...transport, status: "canceled" };
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
      status: "assigned", 
      driverName, 
      driverPhone,
      estimatedArrival
    };
    this.emergencyTransports.set(id, updatedTransport);
    return updatedTransport;
  }
  
  async completeEmergencyTransport(id: number): Promise<EmergencyTransport> {
    const transport = this.emergencyTransports.get(id);
    if (!transport) throw new Error("Emergency transport not found");
    
    const updatedTransport = { ...transport, status: "completed" };
    this.emergencyTransports.set(id, updatedTransport);
    return updatedTransport;
  }
  
  // Seed data for demo purposes
  private seedData() {
    // Create sample users
    const patientUser: User = {
      id: this.userIdCounter++,
      email: "john@example.com",
      password: "password123",
      firstName: "John",
      lastName: "Doe",
      role: "patient",
      profile: { age: 43, gender: "male" },
      createdAt: new Date()
    };
    this.users.set(patientUser.id, patientUser);
    
    const doctorUser1: User = {
      id: this.userIdCounter++,
      email: "sarah@example.com",
      password: "password123",
      firstName: "Sarah",
      lastName: "Johnson",
      role: "doctor",
      specialty: "General Physician",
      profile: { bio: "Board certified general physician with 10 years of experience." },
      createdAt: new Date()
    };
    this.users.set(doctorUser1.id, doctorUser1);
    
    const doctorUser2: User = {
      id: this.userIdCounter++,
      email: "michael@example.com",
      password: "password123",
      firstName: "Michael",
      lastName: "Rodriguez",
      role: "doctor",
      specialty: "General Physician",
      profile: { bio: "Family medicine specialist with a focus on preventive care." },
      createdAt: new Date()
    };
    this.users.set(doctorUser2.id, doctorUser2);
    
    // Create doctors
    const doctor1: Doctor = {
      id: this.doctorIdCounter++,
      userId: doctorUser1.id,
      specialty: "General Physician",
      averageRating: 48,
      reviewCount: 120,
      isAvailable: true
    };
    this.doctors.set(doctor1.id, doctor1);
    
    const doctor2: Doctor = {
      id: this.doctorIdCounter++,
      userId: doctorUser2.id,
      specialty: "General Physician",
      averageRating: 46,
      reviewCount: 85,
      isAvailable: true
    };
    this.doctors.set(doctor2.id, doctor2);
    
    // Create availabilities for doctors
    const weekdays = [1, 2, 3, 4, 5]; // Monday to Friday
    weekdays.forEach(day => {
      this.availabilities.set(this.availabilityIdCounter++, {
        id: this.availabilityIdCounter,
        doctorId: doctor1.id,
        dayOfWeek: day,
        startTime: "09:00",
        endTime: "17:00",
        isAvailable: true
      });
      
      this.availabilities.set(this.availabilityIdCounter++, {
        id: this.availabilityIdCounter,
        doctorId: doctor2.id,
        dayOfWeek: day,
        startTime: "10:00",
        endTime: "18:00",
        isAvailable: true
      });
    });
    
    // Create time off for doctor1
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    tomorrow.setHours(0, 0, 0, 0);
    
    const dayAfterTomorrow = new Date(tomorrow);
    dayAfterTomorrow.setDate(dayAfterTomorrow.getDate() + 1);
    
    // Create sample appointments
    this.appointments.set(this.appointmentIdCounter++, {
      id: this.appointmentIdCounter,
      patientId: patientUser.id,
      doctorId: doctor1.id,
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
      patientId: patientUser.id,
      doctorId: doctor2.id,
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
      patientId: patientUser.id,
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
      assignedHospital: "County General Hospital"
    });
  }
}

export const storage = new MemStorage();
