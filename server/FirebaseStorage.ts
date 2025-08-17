import { initializeApp } from 'firebase/app';
import { getFirestore, collection, doc, addDoc, getDoc, getDocs, updateDoc, deleteDoc, query, where } from 'firebase/firestore';
import { getStorage, ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import type { IStorage } from './storage';
import type { 
  User, InsertUser, 
  Doctor, InsertDoctor, DoctorWithUserInfo,
  Availability, InsertAvailability,
  TimeOff, InsertTimeOff,
  Appointment, InsertAppointment, AppointmentWithUsers,
  EmergencyTransport, InsertEmergencyTransport, EmergencyTransportWithPatient
} from '@shared/schema';

// Define the status types to avoid casting
type EmergencyTransportStatus = "requested" | "assigned" | "in_progress" | "completed" | "canceled";
type AppointmentStatus = "scheduled" | "confirmed" | "canceled" | "completed";
type AppointmentType = "video" | "audio";
type EmergencyTransportUrgency = "low" | "medium" | "high" | "critical";
type EmergencyTransportVehicleType = "ambulance" | "wheelchair_van" | "medical_car" | "helicopter";
import { v4 as uuidv4 } from 'uuid';
import * as dotenv from 'dotenv';

// Load environment variables
dotenv.config();

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

console.log('Firebase Storage bucket:', process.env.VITE_FIREBASE_STORAGE_BUCKET);

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const db = getFirestore(app);
const storage = getStorage(app);

export class FirebaseStorage implements IStorage {
  
  // User operations
  async getUser(id: number): Promise<User | undefined> {
    try {
      const userDoc = await getDoc(doc(db, 'users', id.toString()));
      if (userDoc.exists()) {
        return { id, ...userDoc.data() } as User;
      }
      return undefined;
    } catch (error) {
      console.error('Error getting user:', error);
      return undefined;
    }
  }

  async getUserByEmail(email: string): Promise<User | undefined> {
    try {
      const q = query(collection(db, 'users'), where('email', '==', email));
      const querySnapshot = await getDocs(q);
      
      if (!querySnapshot.empty) {
        const userDoc = querySnapshot.docs[0];
        return { id: parseInt(userDoc.id), ...userDoc.data() } as User;
      }
      return undefined;
    } catch (error) {
      console.error('Error getting user by email:', error);
      return undefined;
    }
  }

  async createUser(userData: InsertUser): Promise<User> {
    try {
      // Prepare user data with proper null values for optional fields
      const userDataToSave = {
        ...userData,
        specialty: userData.specialty || null,
        profile: userData.profile || null,
        createdAt: new Date()
      };
      
      const docRef = await addDoc(collection(db, 'users'), userDataToSave);
      
      const id = parseInt(docRef.id) || Date.now();
      return { 
        id, 
        ...userDataToSave 
      } as User;
    } catch (error) {
      console.error('Error creating user:', error);
      throw error;
    }
  }

  // Doctor operations
  async getDoctor(id: number): Promise<Doctor | undefined> {
    try {
      const doctorDoc = await getDoc(doc(db, 'doctors', id.toString()));
      if (doctorDoc.exists()) {
        return { id, ...doctorDoc.data() } as Doctor;
      }
      return undefined;
    } catch (error) {
      console.error('Error getting doctor:', error);
      return undefined;
    }
  }

  async getDoctorByUserId(userId: number): Promise<Doctor | undefined> {
    try {
      const q = query(collection(db, 'doctors'), where('userId', '==', userId));
      const querySnapshot = await getDocs(q);
      
      if (!querySnapshot.empty) {
        const doctorDoc = querySnapshot.docs[0];
        return { id: parseInt(doctorDoc.id), ...doctorDoc.data() } as Doctor;
      }
      return undefined;
    } catch (error) {
      console.error('Error getting doctor by user ID:', error);
      return undefined;
    }
  }

  async getDoctors(): Promise<DoctorWithUserInfo[]> {
    try {
      const doctorsSnapshot = await getDocs(collection(db, 'doctors'));
      const doctors: DoctorWithUserInfo[] = [];
      
      for (const doctorDoc of doctorsSnapshot.docs) {
        const doctorData = { id: parseInt(doctorDoc.id), ...doctorDoc.data() } as Doctor;
        const user = await this.getUser(doctorData.userId);
        
        if (user) {
          doctors.push({ ...doctorData, user });
        }
      }
      
      return doctors;
    } catch (error) {
      console.error('Error getting doctors:', error);
      return [];
    }
  }

  async getDoctorsBySpecialty(specialty: string): Promise<DoctorWithUserInfo[]> {
    try {
      const q = query(collection(db, 'doctors'), where('specialty', '==', specialty));
      const querySnapshot = await getDocs(q);
      const doctors: DoctorWithUserInfo[] = [];
      
      for (const doctorDoc of querySnapshot.docs) {
        const doctorData = { id: parseInt(doctorDoc.id), ...doctorDoc.data() } as Doctor;
        const user = await this.getUser(doctorData.userId);
        
        if (user) {
          doctors.push({ ...doctorData, user });
        }
      }
      
      return doctors;
    } catch (error) {
      console.error('Error getting doctors by specialty:', error);
      return [];
    }
  }

  async createDoctor(doctorData: InsertDoctor): Promise<Doctor> {
    try {
      const docRef = await addDoc(collection(db, 'doctors'), doctorData);
      const id = parseInt(docRef.id) || Date.now();
      return { id, ...doctorData } as Doctor;
    } catch (error) {
      console.error('Error creating doctor:', error);
      throw error;
    }
  }

  async updateDoctorAvailability(id: number, isAvailable: boolean): Promise<Doctor> {
    try {
      const doctorRef = doc(db, 'doctors', id.toString());
      await updateDoc(doctorRef, { isAvailable });
      
      const doctor = await this.getDoctor(id);
      if (!doctor) throw new Error('Doctor not found');
      return doctor;
    } catch (error) {
      console.error('Error updating doctor availability:', error);
      throw error;
    }
  }

  // Stub implementations for other methods to satisfy interface
  async getAvailability(doctorId: number): Promise<Availability[]> {
    return [];
  }

  async createAvailability(availabilityData: InsertAvailability): Promise<Availability> {
    const id = Date.now();
    return { id, ...availabilityData } as Availability;
  }

  async updateAvailability(id: number, availabilityData: Partial<Availability>): Promise<Availability> {
    throw new Error('Not implemented');
  }

  async deleteAvailability(id: number): Promise<boolean> {
    return true;
  }

  async getTimeOffs(doctorId: number): Promise<TimeOff[]> {
    return [];
  }

  async createTimeOff(timeOffData: InsertTimeOff): Promise<TimeOff> {
    const id = Date.now();
    return { id, ...timeOffData } as TimeOff;
  }

  async deleteTimeOff(id: number): Promise<boolean> {
    return true;
  }

  // Appointment operations
  async getAppointment(id: number): Promise<AppointmentWithUsers | undefined> {
    return undefined;
  }

  async getAppointmentsByPatient(patientId: number): Promise<AppointmentWithUsers[]> {
    return [];
  }

  async getAppointmentsByDoctor(doctorId: number): Promise<AppointmentWithUsers[]> {
    return [];
  }

  async getAppointmentsByDate(doctorId: number, date: Date): Promise<AppointmentWithUsers[]> {
    return [];
  }

  async createAppointment(appointmentData: InsertAppointment): Promise<Appointment> {
    const id = Date.now();
    return { id, ...appointmentData } as Appointment;
  }

  async updateAppointment(id: number, appointmentData: Partial<Appointment>): Promise<Appointment> {
    throw new Error('Not implemented');
  }

  async cancelAppointment(id: number): Promise<Appointment> {
    throw new Error('Not implemented');
  }

  // Emergency Transport operations
  async getEmergencyTransport(id: number): Promise<EmergencyTransportWithPatient | undefined> {
    try {
      const transportDoc = await getDoc(doc(db, 'emergencyTransport', id.toString()));
      if (!transportDoc.exists()) return undefined;
      
      const transportData = { id, ...transportDoc.data() } as EmergencyTransport;
      const patient = await this.getUser(transportData.patientId);
      
      if (!patient) return undefined;
      
      return { ...transportData, patient };
    } catch (error) {
      console.error('Error getting emergency transport:', error);
      return undefined;
    }
  }

  async getEmergencyTransportsByPatient(patientId: number): Promise<EmergencyTransportWithPatient[]> {
    try {
      const q = query(collection(db, 'emergencyTransport'), where('patientId', '==', patientId));
      const querySnapshot = await getDocs(q);
      const transports: EmergencyTransportWithPatient[] = [];
      
      for (const transportDoc of querySnapshot.docs) {
        const transport = await this.getEmergencyTransport(parseInt(transportDoc.id));
        if (transport) transports.push(transport);
      }
      
      return transports;
    } catch (error) {
      console.error('Error getting patient emergency transports:', error);
      return [];
    }
  }

  async getActiveEmergencyTransports(): Promise<EmergencyTransportWithPatient[]> {
    try {
      const activeStatuses: EmergencyTransportStatus[] = ["requested", "assigned", "in_progress"];
      const q = query(
        collection(db, 'emergencyTransport'),
        where('status', 'in', activeStatuses)
      );
      const querySnapshot = await getDocs(q);
      const transports: EmergencyTransportWithPatient[] = [];
      
      for (const transportDoc of querySnapshot.docs) {
        const transport = await this.getEmergencyTransport(parseInt(transportDoc.id));
        if (transport) transports.push(transport);
      }
      
      return transports;
    } catch (error) {
      console.error('Error getting active emergency transports:', error);
      return [];
    }
  }

  async createEmergencyTransport(transportData: InsertEmergencyTransport): Promise<EmergencyTransport> {
    try {
      const transportToCreate = {
        ...transportData,
        requestDate: new Date(),
        status: "requested" as EmergencyTransportStatus,
        driverName: null,
        driverPhone: null,
        estimatedArrival: null,
        assignedTime: null,
        notes: transportData.notes || null,
        pickupCoordinates: transportData.pickupCoordinates || null,
        destinationCoordinates: transportData.destinationCoordinates || null,
        assignedHospital: transportData.assignedHospital || null
      };
      
      const docRef = await addDoc(collection(db, 'emergencyTransport'), transportToCreate);
      const id = parseInt(docRef.id) || Date.now();
      
      return { 
        id, 
        ...transportToCreate
      } as EmergencyTransport;
    } catch (error) {
      console.error('Error creating emergency transport:', error);
      throw error;
    }
  }

  async updateEmergencyTransport(id: number, transportData: Partial<EmergencyTransport>): Promise<EmergencyTransport> {
    try {
      const transportRef = doc(db, 'emergencyTransport', id.toString());
      await updateDoc(transportRef, { ...transportData, updatedAt: new Date() });
      
      const transport = await getDoc(transportRef);
      return { id, ...transport.data() } as EmergencyTransport;
    } catch (error) {
      console.error('Error updating emergency transport:', error);
      throw error;
    }
  }

  async cancelEmergencyTransport(id: number): Promise<EmergencyTransport> {
    return this.updateEmergencyTransport(id, { status: 'canceled' as EmergencyTransportStatus });
  }

  async assignDriverToEmergencyTransport(
    id: number, 
    driverName: string, 
    driverPhone: string, 
    estimatedArrival: Date
  ): Promise<EmergencyTransport> {
    return this.updateEmergencyTransport(id, {
      status: 'assigned' as EmergencyTransportStatus,
      driverName,
      driverPhone,
      estimatedArrival,
      assignedTime: new Date() // Set the assigned time to now
    });
  }

  async completeEmergencyTransport(id: number): Promise<EmergencyTransport> {
    return this.updateEmergencyTransport(id, { status: 'completed' as EmergencyTransportStatus });
  }

  // Prescription operations
  async createPrescription(prescription: any): Promise<any> {
    try {
      const prescriptionRef = await addDoc(collection(db, 'prescriptions'), prescription);
      return { id: parseInt(prescriptionRef.id), ...prescription };
    } catch (error) {
      console.error('Error creating prescription:', error);
      throw error;
    }
  }
  
  async getPrescriptionsByPatient(patientId: number): Promise<any[]> {
    try {
      const q = query(collection(db, 'prescriptions'), where('patientId', '==', patientId));
      const querySnapshot = await getDocs(q);
      
      return querySnapshot.docs.map(doc => ({
        id: parseInt(doc.id),
        ...doc.data()
      }));
    } catch (error) {
      console.error('Error getting patient prescriptions:', error);
      return [];
    }
  }
  
  async getPrescriptionsByDoctor(doctorId: number): Promise<any[]> {
    try {
      const q = query(collection(db, 'prescriptions'), where('doctorId', '==', doctorId));
      const querySnapshot = await getDocs(q);
      
      return querySnapshot.docs.map(doc => ({
        id: parseInt(doc.id),
        ...doc.data()
      }));
    } catch (error) {
      console.error('Error getting doctor prescriptions:', error);
      return [];
    }
  }
}