import { database } from './firebaseConfig';
import { ref, set, onValue, update, get, remove, push, child } from 'firebase/database';

interface SyncOptions {
  debounceTime?: number;
  mergeStrategy?: 'server-wins' | 'client-wins' | 'last-write-wins';
}

/**
 * Multi-device Synchronization Service
 * Uses Firebase Realtime Database to sync data across multiple devices
 */
export class SyncService {
  /**
   * Synchronize user health data across devices
   */
  async syncUserData(userId: string, dataType: string, data: any, options: SyncOptions = {}): Promise<void> {
    try {
      const path = `users/${userId}/${dataType}`;
      const dataRef = ref(database, path);
      
      // Add timestamp for last-write-wins strategy
      const timestamp = new Date().getTime();
      const dataWithMeta = {
        ...data,
        _lastUpdated: timestamp,
        _deviceId: this.getDeviceId()
      };
      
      // Default merge strategy is last-write-wins
      const mergeStrategy = options.mergeStrategy || 'last-write-wins';
      
      if (mergeStrategy === 'last-write-wins') {
        // Simply write the data with timestamp
        await set(dataRef, dataWithMeta);
      } else {
        // Check existing data first
        const snapshot = await get(dataRef);
        const existingData = snapshot.exists() ? snapshot.val() : null;
        
        if (!existingData) {
          // No existing data, just write
          await set(dataRef, dataWithMeta);
        } else {
          // Merge based on strategy
          if (mergeStrategy === 'server-wins') {
            // Only update fields that don't exist on server
            const newData = { ...dataWithMeta };
            Object.keys(existingData).forEach(key => {
              if (existingData[key] !== null && existingData[key] !== undefined) {
                delete newData[key];
              }
            });
            // Update with new fields only
            await update(dataRef, newData);
          } else if (mergeStrategy === 'client-wins') {
            // Client data overrides server
            await set(dataRef, dataWithMeta);
          }
        }
      }
    } catch (error: any) {
      console.error('Error syncing user data:', error);
      throw new Error(`Failed to sync user data: ${error.message}`);
    }
  }
  
  /**
   * Subscribe to data changes for a user
   */
  subscribeToUserData(
    userId: string, 
    dataType: string, 
    callback: (data: any) => void
  ): () => void {
    const path = `users/${userId}/${dataType}`;
    const dataRef = ref(database, path);
    
    // Set up the listener
    const unsubscribe = onValue(dataRef, (snapshot) => {
      const data = snapshot.exists() ? snapshot.val() : null;
      callback(data);
    });
    
    // Return unsubscribe function
    return unsubscribe;
  }
  
  /**
   * Sync vital signs data across devices
   */
  async syncVitalSigns(userId: string, vitalSigns: any[]): Promise<void> {
    try {
      const path = `health/${userId}/vitalSigns`;
      const vitalSignsRef = ref(database, path);
      
      // For vital signs, we store them as a list with timestamps
      // Each entry gets a unique key based on timestamp
      for (const vitalSign of vitalSigns) {
        const timestamp = vitalSign.timestamp || new Date().getTime();
        const vitalWithMeta = {
          ...vitalSign,
          _syncedAt: new Date().getTime(),
          _deviceId: this.getDeviceId()
        };
        
        // Generate a new child with a unique key
        const newVitalRef = push(vitalSignsRef);
        await set(newVitalRef, vitalWithMeta);
      }
    } catch (error: any) {
      console.error('Error syncing vital signs:', error);
      throw new Error(`Failed to sync vital signs: ${error.message}`);
    }
  }
  
  /**
   * Sync medication schedule across devices
   */
  async syncMedicationSchedule(userId: string, medications: any[]): Promise<void> {
    try {
      const path = `health/${userId}/medications`;
      const medicationsRef = ref(database, path);
      
      // Clear existing medication data first
      // For medication schedules, we want a complete replacement
      await remove(medicationsRef);
      
      // Add timestamp for each medication entry
      const medicationsWithMeta = medications.map(medication => ({
        ...medication,
        _syncedAt: new Date().getTime(),
        _deviceId: this.getDeviceId()
      }));
      
      // Set all medication data
      await set(medicationsRef, medicationsWithMeta);
    } catch (error: any) {
      console.error('Error syncing medication schedule:', error);
      throw new Error(`Failed to sync medication schedule: ${error.message}`);
    }
  }
  
  /**
   * Synchronize appointment data
   */
  async syncAppointments(userId: string, appointments: any[]): Promise<void> {
    try {
      const path = `appointments/${userId}`;
      const appointmentsRef = ref(database, path);
      
      // For appointments, we use a map with appointment IDs as keys
      const appointmentsMap: Record<string, any> = {};
      
      for (const appointment of appointments) {
        if (!appointment.id) {
          throw new Error('Appointment must have an ID for syncing');
        }
        
        appointmentsMap[appointment.id] = {
          ...appointment,
          _syncedAt: new Date().getTime(),
          _deviceId: this.getDeviceId()
        };
      }
      
      // Update the appointments
      await update(appointmentsRef, appointmentsMap);
    } catch (error: any) {
      console.error('Error syncing appointments:', error);
      throw new Error(`Failed to sync appointments: ${error.message}`);
    }
  }
  
  /**
   * Get data for offline use
   */
  async getOfflineData(userId: string): Promise<Record<string, any>> {
    try {
      const userDataRef = ref(database, `users/${userId}`);
      const healthDataRef = ref(database, `health/${userId}`);
      const appointmentsRef = ref(database, `appointments/${userId}`);
      
      // Get all user data at once
      const userSnapshot = await get(userDataRef);
      const healthSnapshot = await get(healthDataRef);
      const appointmentsSnapshot = await get(appointmentsRef);
      
      return {
        userData: userSnapshot.exists() ? userSnapshot.val() : {},
        healthData: healthSnapshot.exists() ? healthSnapshot.val() : {},
        appointments: appointmentsSnapshot.exists() ? appointmentsSnapshot.val() : {}
      };
    } catch (error: any) {
      console.error('Error getting offline data:', error);
      throw new Error(`Failed to get offline data: ${error.message}`);
    }
  }
  
  /**
   * Generate or retrieve a device ID for sync tracking
   */
  private getDeviceId(): string {
    // Try to get existing device ID from local storage
    const deviceId = localStorage.getItem('device_id');
    if (deviceId) {
      return deviceId;
    }
    
    // Generate a new device ID
    const newDeviceId = 'device_' + Math.random().toString(36).substring(2, 15);
    
    // Store the device ID for future use
    try {
      localStorage.setItem('device_id', newDeviceId);
    } catch (error) {
      console.warn('Could not save device ID to localStorage');
    }
    
    return newDeviceId;
  }
}

// Export a singleton instance
export const syncService = new SyncService();