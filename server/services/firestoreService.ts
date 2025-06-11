import { firestore, collections } from './googleCloudService';
import { User, Doctor, Availability, TimeOff, Appointment, EmergencyTransport } from '@shared/schema';

/**
 * Firestore Service - Provides methods for interacting with Firestore database
 */
class FirestoreService {
  // Check if the Firestore service is properly configured
  isConfigured(): boolean {
    return firestore && typeof firestore.collection === 'function';
  }

  // USER OPERATIONS
  
  /**
   * Create a new user in Firestore
   */
  async createUser(userData: any): Promise<any> {
    if (!this.isConfigured()) {
      throw new Error('Firestore is not properly configured');
    }
    
    try {
      const docRef = await collections.users.add({
        ...userData,
        createdAt: new Date()
      });
      
      const doc = await docRef.get();
      return { id: doc.id, ...doc.data() };
    } catch (error) {
      console.error('Error creating user in Firestore:', error);
      throw error;
    }
  }

  /**
   * Get a user by ID
   */
  async getUser(userId: string): Promise<any> {
    if (!this.isConfigured()) {
      throw new Error('Firestore is not properly configured');
    }
    
    try {
      const docRef = collections.users.doc(userId);
      const doc = await docRef.get();
      
      if (!doc.exists) {
        return null;
      }
      
      return { id: doc.id, ...doc.data() };
    } catch (error) {
      console.error('Error getting user from Firestore:', error);
      throw error;
    }
  }

  /**
   * Get a user by email
   */
  async getUserByEmail(email: string): Promise<any> {
    if (!this.isConfigured()) {
      throw new Error('Firestore is not properly configured');
    }
    
    try {
      const snapshot = await collections.users
        .where('email', '==', email)
        .limit(1)
        .get();
      
      if (snapshot.empty) {
        return null;
      }
      
      const doc = snapshot.docs[0];
      return { id: doc.id, ...doc.data() };
    } catch (error) {
      console.error('Error getting user by email from Firestore:', error);
      throw error;
    }
  }

  /**
   * Update a user
   */
  async updateUser(userId: string, userData: Partial<User>): Promise<any> {
    if (!this.isConfigured()) {
      throw new Error('Firestore is not properly configured');
    }
    
    try {
      const docRef = collections.users.doc(userId);
      await docRef.update({
        ...userData,
        updatedAt: new Date()
      });
      
      const doc = await docRef.get();
      return { id: doc.id, ...doc.data() };
    } catch (error) {
      console.error('Error updating user in Firestore:', error);
      throw error;
    }
  }

  // DOCTOR OPERATIONS
  
  /**
   * Create a new doctor in Firestore
   */
  async createDoctor(doctorData: any): Promise<any> {
    if (!this.isConfigured()) {
      throw new Error('Firestore is not properly configured');
    }
    
    try {
      const docRef = await collections.doctors.add({
        ...doctorData,
        createdAt: new Date()
      });
      
      const doc = await docRef.get();
      return { id: doc.id, ...doc.data() };
    } catch (error) {
      console.error('Error creating doctor in Firestore:', error);
      throw error;
    }
  }

  /**
   * Get a doctor by ID
   */
  async getDoctor(doctorId: string): Promise<any> {
    if (!this.isConfigured()) {
      throw new Error('Firestore is not properly configured');
    }
    
    try {
      const docRef = collections.doctors.doc(doctorId);
      const doc = await docRef.get();
      
      if (!doc.exists) {
        return null;
      }
      
      return { id: doc.id, ...doc.data() };
    } catch (error) {
      console.error('Error getting doctor from Firestore:', error);
      throw error;
    }
  }

  /**
   * Get a doctor by user ID
   */
  async getDoctorByUserId(userId: number): Promise<any> {
    if (!this.isConfigured()) {
      throw new Error('Firestore is not properly configured');
    }
    
    try {
      const snapshot = await collections.doctors
        .where('userId', '==', userId)
        .limit(1)
        .get();
      
      if (snapshot.empty) {
        return null;
      }
      
      const doc = snapshot.docs[0];
      return { id: doc.id, ...doc.data() };
    } catch (error) {
      console.error('Error getting doctor by user ID from Firestore:', error);
      throw error;
    }
  }

  /**
   * Get all doctors
   */
  async getAllDoctors(): Promise<any[]> {
    if (!this.isConfigured()) {
      throw new Error('Firestore is not properly configured');
    }
    
    try {
      const snapshot = await collections.doctors.get();
      return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
    } catch (error) {
      console.error('Error getting all doctors from Firestore:', error);
      throw error;
    }
  }

  /**
   * Get doctors by specialty
   */
  async getDoctorsBySpecialty(specialty: string): Promise<any[]> {
    if (!this.isConfigured()) {
      throw new Error('Firestore is not properly configured');
    }
    
    try {
      const snapshot = await collections.doctors
        .where('specialty', '==', specialty)
        .get();
      
      return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
    } catch (error) {
      console.error('Error getting doctors by specialty from Firestore:', error);
      throw error;
    }
  }

  /**
   * Update a doctor's availability status
   */
  async updateDoctorAvailability(doctorId: string, isAvailable: boolean): Promise<any> {
    if (!this.isConfigured()) {
      throw new Error('Firestore is not properly configured');
    }
    
    try {
      const docRef = collections.doctors.doc(doctorId);
      await docRef.update({
        isAvailable,
        updatedAt: new Date()
      });
      
      const doc = await docRef.get();
      return { id: doc.id, ...doc.data() };
    } catch (error) {
      console.error('Error updating doctor availability in Firestore:', error);
      throw error;
    }
  }

  // AVAILABILITY OPERATIONS
  
  /**
   * Create new availability
   */
  async createAvailability(availabilityData: any): Promise<any> {
    if (!this.isConfigured()) {
      throw new Error('Firestore is not properly configured');
    }
    
    try {
      const docRef = await collections.availability.add({
        ...availabilityData,
        createdAt: new Date()
      });
      
      const doc = await docRef.get();
      return { id: doc.id, ...doc.data() };
    } catch (error) {
      console.error('Error creating availability in Firestore:', error);
      throw error;
    }
  }

  /**
   * Get availability by doctor ID
   */
  async getAvailabilityByDoctorId(doctorId: number): Promise<any[]> {
    if (!this.isConfigured()) {
      throw new Error('Firestore is not properly configured');
    }
    
    try {
      const snapshot = await collections.availability
        .where('doctorId', '==', doctorId)
        .get();
      
      return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
    } catch (error) {
      console.error('Error getting availability by doctor ID from Firestore:', error);
      throw error;
    }
  }

  // APPOINTMENT OPERATIONS
  
  /**
   * Create a new appointment
   */
  async createAppointment(appointmentData: any): Promise<any> {
    if (!this.isConfigured()) {
      throw new Error('Firestore is not properly configured');
    }
    
    try {
      const docRef = await collections.appointments.add({
        ...appointmentData,
        createdAt: new Date()
      });
      
      const doc = await docRef.get();
      return { id: doc.id, ...doc.data() };
    } catch (error) {
      console.error('Error creating appointment in Firestore:', error);
      throw error;
    }
  }

  /**
   * Get an appointment by ID
   */
  async getAppointment(appointmentId: string): Promise<any> {
    if (!this.isConfigured()) {
      throw new Error('Firestore is not properly configured');
    }
    
    try {
      const docRef = collections.appointments.doc(appointmentId);
      const doc = await docRef.get();
      
      if (!doc.exists) {
        return null;
      }
      
      return { id: doc.id, ...doc.data() };
    } catch (error) {
      console.error('Error getting appointment from Firestore:', error);
      throw error;
    }
  }

  /**
   * Get appointments by patient ID
   */
  async getAppointmentsByPatientId(patientId: number): Promise<any[]> {
    if (!this.isConfigured()) {
      throw new Error('Firestore is not properly configured');
    }
    
    try {
      const snapshot = await collections.appointments
        .where('patientId', '==', patientId)
        .get();
      
      return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
    } catch (error) {
      console.error('Error getting appointments by patient ID from Firestore:', error);
      throw error;
    }
  }

  /**
   * Get appointments by doctor ID
   */
  async getAppointmentsByDoctorId(doctorId: number): Promise<any[]> {
    if (!this.isConfigured()) {
      throw new Error('Firestore is not properly configured');
    }
    
    try {
      const snapshot = await collections.appointments
        .where('doctorId', '==', doctorId)
        .get();
      
      return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
    } catch (error) {
      console.error('Error getting appointments by doctor ID from Firestore:', error);
      throw error;
    }
  }

  /**
   * Update an appointment
   */
  async updateAppointment(appointmentId: string, appointmentData: Partial<Appointment>): Promise<any> {
    if (!this.isConfigured()) {
      throw new Error('Firestore is not properly configured');
    }
    
    try {
      const docRef = collections.appointments.doc(appointmentId);
      await docRef.update({
        ...appointmentData,
        updatedAt: new Date()
      });
      
      const doc = await docRef.get();
      return { id: doc.id, ...doc.data() };
    } catch (error) {
      console.error('Error updating appointment in Firestore:', error);
      throw error;
    }
  }

  /**
   * Cancel an appointment
   */
  async cancelAppointment(appointmentId: string): Promise<any> {
    if (!this.isConfigured()) {
      throw new Error('Firestore is not properly configured');
    }
    
    try {
      const docRef = collections.appointments.doc(appointmentId);
      await docRef.update({
        status: 'cancelled',
        updatedAt: new Date()
      });
      
      const doc = await docRef.get();
      return { id: doc.id, ...doc.data() };
    } catch (error) {
      console.error('Error cancelling appointment in Firestore:', error);
      throw error;
    }
  }

  // EMERGENCY TRANSPORT OPERATIONS
  
  /**
   * Create a new emergency transport request
   */
  async createEmergencyTransport(transportData: any): Promise<any> {
    if (!this.isConfigured()) {
      throw new Error('Firestore is not properly configured');
    }
    
    try {
      const docRef = await collections.emergencyTransports.add({
        ...transportData,
        createdAt: new Date()
      });
      
      const doc = await docRef.get();
      return { id: doc.id, ...doc.data() };
    } catch (error) {
      console.error('Error creating emergency transport in Firestore:', error);
      throw error;
    }
  }

  /**
   * Get all active emergency transports
   */
  async getActiveEmergencyTransports(): Promise<any[]> {
    if (!this.isConfigured()) {
      throw new Error('Firestore is not properly configured');
    }
    
    try {
      const snapshot = await collections.emergencyTransports
        .where('status', 'in', ['requested', 'in_progress'])
        .get();
      
      return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
    } catch (error) {
      console.error('Error getting active emergency transports from Firestore:', error);
      throw error;
    }
  }

  /**
   * Update emergency transport
   */
  async updateEmergencyTransport(transportId: string, transportData: Partial<EmergencyTransport>): Promise<any> {
    if (!this.isConfigured()) {
      throw new Error('Firestore is not properly configured');
    }
    
    try {
      const docRef = collections.emergencyTransports.doc(transportId);
      await docRef.update({
        ...transportData,
        updatedAt: new Date()
      });
      
      const doc = await docRef.get();
      return { id: doc.id, ...doc.data() };
    } catch (error) {
      console.error('Error updating emergency transport in Firestore:', error);
      throw error;
    }
  }
}

// Export a singleton instance
export const firestoreService = new FirestoreService();