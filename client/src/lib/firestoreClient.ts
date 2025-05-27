import { 
  collection, 
  doc, 
  getDocs, 
  getDoc, 
  setDoc, 
  updateDoc, 
  deleteDoc, 
  query, 
  where, 
  onSnapshot,
  Timestamp,
  serverTimestamp,
  addDoc,
  orderBy,
  limit,
  Firestore
} from 'firebase/firestore';
import { firestore } from './googleCloud';
import { User, Doctor, Appointment, EmergencyTransport } from '@shared/schema';

// Type for real-time subscription callbacks
type SubscriptionCallback<T> = (data: T[]) => void;
// Map to store active subscriptions
const activeSubscriptions = new Map();

/**
 * Firestore Client - Provides methods for real-time data access and updates
 */
const FirestoreClient = {
  /**
   * Check if Firestore is initialized properly
   */
  isInitialized(): boolean {
    return firestore !== undefined;
  },

  /**
   * Get Firestore instance safely
   */
  getFirestore(): Firestore {
    if (!firestore) {
      throw new Error('Firestore is not initialized');
    }
    return firestore;
  },

  // USER OPERATIONS
  
  /**
   * Get a user by ID
   */
  async getUser(userId: string | number): Promise<User | null> {
    if (!this.isInitialized()) {
      console.error('Firestore is not initialized');
      return null;
    }
    
    try {
      const db = this.getFirestore();
      const userRef = doc(db, 'users', userId.toString());
      const userSnap = await getDoc(userRef);
      
      if (userSnap.exists()) {
        return userSnap.data() as User;
      } else {
        return null;
      }
    } catch (error) {
      console.error('Error getting user from Firestore:', error);
      return null;
    }
  },
  
  /**
   * Create or update a user
   */
  async saveUser(user: Partial<User> & { id: number }): Promise<boolean> {
    if (!this.isInitialized()) {
      console.error('Firestore is not initialized');
      return false;
    }
    
    try {
      const db = this.getFirestore();
      const userRef = doc(db, 'users', user.id.toString());
      await setDoc(userRef, {
        ...user,
        updatedAt: serverTimestamp()
      }, { merge: true });
      
      return true;
    } catch (error) {
      console.error('Error saving user to Firestore:', error);
      return false;
    }
  },
  
  // DOCTOR OPERATIONS
  
  /**
   * Get all doctors
   */
  async getAllDoctors(): Promise<Doctor[]> {
    if (!this.isInitialized()) {
      console.error('Firestore is not initialized');
      return [];
    }
    
    try {
      const db = this.getFirestore();
      const doctorsRef = collection(db, 'doctors');
      const querySnapshot = await getDocs(doctorsRef);
      
      return querySnapshot.docs.map(doc => ({
        id: parseInt(doc.id),
        ...doc.data()
      })) as Doctor[];
    } catch (error) {
      console.error('Error getting doctors from Firestore:', error);
      return [];
    }
  },
  
  /**
   * Subscribe to doctors collection for real-time updates
   */
  subscribeToDoctors(callback: SubscriptionCallback<Doctor>): () => void {
    if (!this.isInitialized()) {
      console.error('Firestore is not initialized');
      return () => {};
    }
    
    try {
      const db = this.getFirestore();
      const doctorsRef = collection(db, 'doctors');
      const unsubscribe = onSnapshot(doctorsRef, (snapshot) => {
        const doctors = snapshot.docs.map(doc => ({
          id: parseInt(doc.id),
          ...doc.data()
        })) as Doctor[];
        
        callback(doctors);
      });
      
      // Store the subscription
      const subscriptionId = `doctors_all_${Date.now()}`;
      activeSubscriptions.set(subscriptionId, unsubscribe);
      
      // Return a function to unsubscribe
      return () => {
        unsubscribe();
        activeSubscriptions.delete(subscriptionId);
      };
    } catch (error) {
      console.error('Error subscribing to doctors in Firestore:', error);
      return () => {};
    }
  },
  
  /**
   * Get doctors by specialty with real-time updates
   */
  subscribeToDoctorsBySpecialty(
    specialty: string, 
    callback: SubscriptionCallback<Doctor>
  ): () => void {
    if (!this.isInitialized()) {
      console.error('Firestore is not initialized');
      return () => {};
    }
    
    try {
      const db = this.getFirestore();
      const doctorsRef = collection(db, 'doctors');
      const doctorsQuery = query(doctorsRef, where('specialty', '==', specialty));
      
      const unsubscribe = onSnapshot(doctorsQuery, (snapshot) => {
        const doctors = snapshot.docs.map(doc => ({
          id: parseInt(doc.id),
          ...doc.data()
        })) as Doctor[];
        
        callback(doctors);
      });
      
      // Store the subscription
      const subscriptionId = `doctors_specialty_${specialty}_${Date.now()}`;
      activeSubscriptions.set(subscriptionId, unsubscribe);
      
      // Return a function to unsubscribe
      return () => {
        unsubscribe();
        activeSubscriptions.delete(subscriptionId);
      };
    } catch (error) {
      console.error(`Error subscribing to doctors by specialty ${specialty}:`, error);
      return () => {};
    }
  },
  
  /**
   * Update a doctor's availability status
   */
  async updateDoctorAvailability(doctorId: number, isAvailable: boolean): Promise<boolean> {
    if (!this.isInitialized()) {
      console.error('Firestore is not initialized');
      return false;
    }
    
    try {
      const db = this.getFirestore();
      const doctorRef = doc(db, 'doctors', doctorId.toString());
      await updateDoc(doctorRef, {
        isAvailable,
        updatedAt: serverTimestamp()
      });
      
      return true;
    } catch (error) {
      console.error('Error updating doctor availability in Firestore:', error);
      return false;
    }
  },
  
  // APPOINTMENT OPERATIONS
  
  /**
   * Get all appointments for a user (patient or doctor)
   */
  subscribeToUserAppointments(
    userId: number, 
    role: 'patient' | 'doctor',
    callback: SubscriptionCallback<Appointment>
  ): () => void {
    if (!this.isInitialized()) {
      console.error('Firestore is not initialized');
      return () => {};
    }
    
    try {
      const db = this.getFirestore();
      const appointmentsRef = collection(db, 'appointments');
      const fieldName = role === 'patient' ? 'patientId' : 'doctorId';
      const appointmentsQuery = query(
        appointmentsRef, 
        where(fieldName, '==', userId),
        orderBy('date', 'desc')
      );
      
      const unsubscribe = onSnapshot(appointmentsQuery, (snapshot) => {
        const appointments = snapshot.docs.map(doc => {
          const data = doc.data();
          // Convert Firestore timestamp to Date
          const date = data.date instanceof Timestamp ? data.date.toDate() : data.date;
          
          return {
            id: parseInt(doc.id),
            ...data,
            date
          };
        }) as Appointment[];
        
        callback(appointments);
      });
      
      // Store the subscription
      const subscriptionId = `appointments_user_${userId}_${role}_${Date.now()}`;
      activeSubscriptions.set(subscriptionId, unsubscribe);
      
      // Return a function to unsubscribe
      return () => {
        unsubscribe();
        activeSubscriptions.delete(subscriptionId);
      };
    } catch (error) {
      console.error(`Error subscribing to ${role} appointments:`, error);
      return () => {};
    }
  },
  
  /**
   * Create a new appointment
   */
  async createAppointment(appointment: Omit<Appointment, 'id'>): Promise<Appointment | null> {
    if (!this.isInitialized()) {
      console.error('Firestore is not initialized');
      return null;
    }
    
    try {
      const db = this.getFirestore();
      const appointmentsRef = collection(db, 'appointments');
      const docRef = await addDoc(appointmentsRef, {
        ...appointment,
        createdAt: serverTimestamp()
      });
      
      const newAppointment = {
        id: parseInt(docRef.id),
        ...appointment
      };
      
      return newAppointment;
    } catch (error) {
      console.error('Error creating appointment in Firestore:', error);
      return null;
    }
  },
  
  /**
   * Update an appointment
   */
  async updateAppointment(appointmentId: number, updates: Partial<Appointment>): Promise<boolean> {
    if (!this.isInitialized()) {
      console.error('Firestore is not initialized');
      return false;
    }
    
    try {
      const db = this.getFirestore();
      const appointmentRef = doc(db, 'appointments', appointmentId.toString());
      await updateDoc(appointmentRef, {
        ...updates,
        updatedAt: serverTimestamp()
      });
      
      return true;
    } catch (error) {
      console.error('Error updating appointment in Firestore:', error);
      return false;
    }
  },
  
  // EMERGENCY TRANSPORT OPERATIONS
  
  /**
   * Subscribe to active emergency transports
   */
  subscribeToActiveEmergencyTransports(
    callback: SubscriptionCallback<EmergencyTransport>
  ): () => void {
    if (!this.isInitialized()) {
      console.error('Firestore is not initialized');
      return () => {};
    }
    
    try {
      const db = this.getFirestore();
      const transportRef = collection(db, 'emergencyTransports');
      const transportQuery = query(
        transportRef,
        where('status', 'in', ['requested', 'assigned', 'in_progress']),
        orderBy('requestDate', 'desc')
      );
      
      const unsubscribe = onSnapshot(transportQuery, (snapshot) => {
        const transports = snapshot.docs.map(doc => {
          const data = doc.data();
          // Convert Firestore timestamps to Dates
          const requestDate = data.requestDate instanceof Timestamp 
            ? data.requestDate.toDate() 
            : data.requestDate;
          
          const estimatedArrival = data.estimatedArrival instanceof Timestamp 
            ? data.estimatedArrival.toDate() 
            : data.estimatedArrival;
          
          return {
            id: parseInt(doc.id),
            ...data,
            requestDate,
            estimatedArrival
          };
        }) as EmergencyTransport[];
        
        callback(transports);
      });
      
      // Store the subscription
      const subscriptionId = `emergency_transports_active_${Date.now()}`;
      activeSubscriptions.set(subscriptionId, unsubscribe);
      
      // Return a function to unsubscribe
      return () => {
        unsubscribe();
        activeSubscriptions.delete(subscriptionId);
      };
    } catch (error) {
      console.error('Error subscribing to active emergency transports:', error);
      return () => {};
    }
  },
  
  /**
   * Create a new emergency transport request
   */
  async createEmergencyTransport(
    transport: Omit<EmergencyTransport, 'id' | 'requestDate'>
  ): Promise<EmergencyTransport | null> {
    if (!this.isInitialized()) {
      console.error('Firestore is not initialized');
      return null;
    }
    
    try {
      const db = this.getFirestore();
      const transportRef = collection(db, 'emergencyTransports');
      const docRef = await addDoc(transportRef, {
        ...transport,
        requestDate: serverTimestamp(),
        status: 'requested'
      });
      
      // Get the created document to return with server-generated values
      const docSnap = await getDoc(docRef);
      if (docSnap.exists()) {
        const data = docSnap.data();
        return {
          id: parseInt(docRef.id),
          ...data,
          requestDate: data.requestDate instanceof Timestamp 
            ? data.requestDate.toDate() 
            : new Date()
        } as EmergencyTransport;
      }
      
      return null;
    } catch (error) {
      console.error('Error creating emergency transport in Firestore:', error);
      return null;
    }
  },
  
  /**
   * Update an emergency transport
   */
  async updateEmergencyTransport(
    transportId: number, 
    updates: Partial<EmergencyTransport>
  ): Promise<boolean> {
    if (!this.isInitialized()) {
      console.error('Firestore is not initialized');
      return false;
    }
    
    try {
      const db = this.getFirestore();
      const transportRef = doc(db, 'emergencyTransports', transportId.toString());
      await updateDoc(transportRef, {
        ...updates,
        updatedAt: serverTimestamp()
      });
      
      return true;
    } catch (error) {
      console.error('Error updating emergency transport in Firestore:', error);
      return false;
    }
  },
  
  // MEDICINE INVENTORY OPERATIONS
  
  /**
   * Subscribe to medicine inventory
   */
  subscribeToMedicines(callback: SubscriptionCallback<any>): () => void {
    if (!this.isInitialized()) {
      console.error('Firestore is not initialized');
      return () => {};
    }
    
    try {
      const db = this.getFirestore();
      const medicinesRef = collection(db, 'medicines');
      const medicinesQuery = query(medicinesRef, orderBy('name'));
      
      const unsubscribe = onSnapshot(medicinesQuery, (snapshot) => {
        const medicines = snapshot.docs.map(doc => {
          const data = doc.data();
          
          // Convert Firestore timestamps to Dates
          const expiryDate = data.expiryDate instanceof Timestamp 
            ? data.expiryDate.toDate() 
            : data.expiryDate;
          
          return {
            id: parseInt(doc.id),
            ...data,
            expiryDate
          };
        });
        
        callback(medicines);
      });
      
      // Store the subscription
      const subscriptionId = `medicines_all_${Date.now()}`;
      activeSubscriptions.set(subscriptionId, unsubscribe);
      
      // Return a function to unsubscribe
      return () => {
        unsubscribe();
        activeSubscriptions.delete(subscriptionId);
      };
    } catch (error) {
      console.error('Error subscribing to medicines:', error);
      return () => {};
    }
  }
};

export { FirestoreClient };