/**
 * Google Cloud Healthcare API Service
 * Provides HIPAA-compliant storage for medical data
 */

import axios from 'axios';
import { OAuth2Client } from 'google-auth-library';
import * as dotenv from 'dotenv';
import { secretManagerService } from './secretManagerService';

// Load environment variables
dotenv.config();

interface PatientData {
  firstName: string;
  lastName: string;
  gender: string;
  birthDate: string;
  phoneNumber?: string;
  email?: string;
  address?: string;
}

interface AppointmentData {
  patientId: string;
  doctorId: string;
  startTime: string;
  endTime: string;
  reason: string;
  status: 'scheduled' | 'completed' | 'cancelled';
  notes?: string;
}

interface ObservationData {
  patientId: string;
  practitionerId?: string;
  code: string;
  display: string;
  value: string | number;
  unit?: string;
  dateTime: string;
  status: 'registered' | 'preliminary' | 'final' | 'amended' | 'corrected' | 'cancelled';
}

class HealthcareService {
  private projectId: string;
  private location: string;
  private datasetId: string;
  private fhirStoreId: string;
  private dicomStoreId: string;
  private auth: OAuth2Client;
  private isConfigured: boolean = false;
  private baseUrl: string = '';
  private initialized: boolean = false;
  private initializationPromise: Promise<void> | null = null;

  constructor() {
    // Load from environment variables with specific Healthcare API variables if available
    this.projectId = process.env.GOOGLE_CLOUD_PROJECT_ID || '';
    this.location = process.env.GOOGLE_HEALTHCARE_LOCATION || 'us-central1';
    this.datasetId = process.env.GOOGLE_HEALTHCARE_DATASET || 'telehealth';
    this.fhirStoreId = process.env.GOOGLE_HEALTHCARE_FHIR_STORE || 'telehealth-fhir-store';
    this.dicomStoreId = process.env.GOOGLE_HEALTHCARE_DICOM_STORE || 'telehealth-dicom-store';
    
    // Initialize OAuth client with temporary empty values
    this.auth = new OAuth2Client();
    
    // Initialize async in the background
    this.initializationPromise = this.initializeAsync();
  }
  
  /**
   * Asynchronously initialize the service
   * This allows us to use the Secret Manager to get credentials
   */
  private async initializeAsync(): Promise<void> {
    try {
      // Get credentials from Secret Manager (fallback to env vars)
      const clientId = await secretManagerService.getSecret('GOOGLE_CLOUD_CLIENT_ID', 'GOOGLE_CLOUD_CLIENT_ID');
      const clientSecret = await secretManagerService.getSecret('GOOGLE_CLOUD_CLIENT_SECRET', 'GOOGLE_CLOUD_CLIENT_SECRET');
      
      // Re-initialize OAuth2 client with retrieved credentials
      this.auth = new OAuth2Client(clientId, clientSecret);
      
      // Set base URL for Healthcare API
      this.baseUrl = `https://healthcare.googleapis.com/v1/projects/${this.projectId}/locations/${this.location}`;
      
      // Check if we have all required config
      this.isConfigured = Boolean(
        this.projectId && 
        clientId && 
        clientSecret
      );
      
      if (this.isConfigured) {
        console.log('Google Cloud Healthcare API client initialized successfully');
        console.log(`- Project: ${this.projectId}`);
        console.log(`- Location: ${this.location}`);
        console.log(`- Dataset: ${this.datasetId}`);
        
        // Try to initialize dataset and stores
        try {
          await this.createDatasetIfNotExists();
          await this.createFhirStoreIfNotExists();
          await this.createDicomStoreIfNotExists();
        } catch (error) {
          console.warn('Error initializing Healthcare API resources:', error);
          // Don't fail initialization if this fails - resources may need to be created manually
        }
      } else {
        console.warn('Google Cloud Healthcare API configuration incomplete');
      }
    } catch (error) {
      console.error('Failed to initialize Google Cloud Healthcare API client:', error);
      this.isConfigured = false;
    } finally {
      this.initialized = true;
    }
  }

  /**
   * Ensure the service is initialized before making API calls
   */
  private async ensureInitialized(): Promise<void> {
    if (!this.initialized && this.initializationPromise) {
      await this.initializationPromise;
    }
    
    if (!this.isConfigured) {
      throw new Error('Healthcare API client is not properly configured');
    }
  }

  /**
   * Check if the Healthcare API is properly configured
   */
  getStatus(): { isConfigured: boolean } {
    return { isConfigured: this.isConfigured };
  }

  /**
   * Get an access token for API requests
   */
  private async getAccessToken(): Promise<string> {
    try {
      const credentials = await this.auth.getAccessToken();
      return credentials.token || '';
    } catch (error) {
      console.error('Error getting access token:', error);
      throw new Error('Failed to authenticate with Google Cloud');
    }
  }

  /**
   * Create a dataset if it doesn't exist
   */
  async createDatasetIfNotExists(): Promise<void> {
    await this.ensureInitialized();
    
    try {
      // Check if dataset exists
      const token = await this.getAccessToken();
      const datasetUrl = `${this.baseUrl}/datasets/${this.datasetId}`;
      
      try {
        await axios.get(datasetUrl, {
          headers: { Authorization: `Bearer ${token}` }
        });
        console.log(`Dataset ${this.datasetId} already exists`);
        return;
      } catch (getError: any) {
        // If dataset doesn't exist (404), create it
        if (getError.response && getError.response.status === 404) {
          const createUrl = `${this.baseUrl}/datasets`;
          await axios.post(
            createUrl,
            {
              name: `projects/${this.projectId}/locations/${this.location}/datasets/${this.datasetId}`,
            },
            {
              headers: { Authorization: `Bearer ${token}` }
            }
          );
          console.log(`Created dataset: ${this.datasetId}`);
        } else {
          throw getError;
        }
      }
    } catch (error) {
      console.error('Error creating dataset:', error);
      throw new Error('Failed to create Healthcare API dataset');
    }
  }

  /**
   * Create a FHIR store if it doesn't exist
   */
  async createFhirStoreIfNotExists(): Promise<void> {
    await this.ensureInitialized();
    
    try {
      // Check if FHIR store exists
      const token = await this.getAccessToken();
      const storeUrl = `${this.baseUrl}/datasets/${this.datasetId}/fhirStores/${this.fhirStoreId}`;
      
      try {
        await axios.get(storeUrl, {
          headers: { Authorization: `Bearer ${token}` }
        });
        console.log(`FHIR store ${this.fhirStoreId} already exists`);
        return;
      } catch (getError: any) {
        // If store doesn't exist (404), create it
        if (getError.response && getError.response.status === 404) {
          const createUrl = `${this.baseUrl}/datasets/${this.datasetId}/fhirStores`;
          await axios.post(
            createUrl,
            {
              name: `projects/${this.projectId}/locations/${this.location}/datasets/${this.datasetId}/fhirStores/${this.fhirStoreId}`,
              version: 'R4',
              enableUpdateCreate: true,
            },
            {
              headers: { Authorization: `Bearer ${token}` }
            }
          );
          console.log(`Created FHIR store: ${this.fhirStoreId}`);
        } else {
          throw getError;
        }
      }
    } catch (error) {
      console.error('Error creating FHIR store:', error);
      throw new Error('Failed to create Healthcare API FHIR store');
    }
  }

  /**
   * Create a DICOM store if it doesn't exist
   */
  async createDicomStoreIfNotExists(): Promise<void> {
    await this.ensureInitialized();
    
    try {
      // Check if DICOM store exists
      const token = await this.getAccessToken();
      const storeUrl = `${this.baseUrl}/datasets/${this.datasetId}/dicomStores/${this.dicomStoreId}`;
      
      try {
        await axios.get(storeUrl, {
          headers: { Authorization: `Bearer ${token}` }
        });
        console.log(`DICOM store ${this.dicomStoreId} already exists`);
        return;
      } catch (getError: any) {
        // If store doesn't exist (404), create it
        if (getError.response && getError.response.status === 404) {
          const createUrl = `${this.baseUrl}/datasets/${this.datasetId}/dicomStores`;
          await axios.post(
            createUrl,
            {
              name: `projects/${this.projectId}/locations/${this.location}/datasets/${this.datasetId}/dicomStores/${this.dicomStoreId}`,
            },
            {
              headers: { Authorization: `Bearer ${token}` }
            }
          );
          console.log(`Created DICOM store: ${this.dicomStoreId}`);
        } else {
          throw getError;
        }
      }
    } catch (error) {
      console.error('Error creating DICOM store:', error);
      throw new Error('Failed to create Healthcare API DICOM store');
    }
  }

  /**
   * Create a patient health record in the FHIR store
   */
  async createPatient(data: PatientData): Promise<any> {
    await this.ensureInitialized();
    
    try {
      const token = await this.getAccessToken();
      const fhirUrl = `${this.baseUrl}/datasets/${this.datasetId}/fhirStores/${this.fhirStoreId}/fhir/Patient`;
      
      // Construct FHIR Patient resource with proper typing
      const patientResource: any = {
        resourceType: 'Patient',
        name: [{
          family: data.lastName,
          given: [data.firstName]
        }],
        gender: data.gender.toLowerCase(),
        birthDate: data.birthDate,
        telecom: []
      };
      
      if (data.phoneNumber) {
        patientResource.telecom.push({
          system: 'phone',
          value: data.phoneNumber
        });
      }
      
      if (data.email) {
        patientResource.telecom.push({
          system: 'email',
          value: data.email
        });
      }
      
      if (data.address) {
        patientResource.address = [{
          text: data.address
        }];
      }
      
      const response = await axios.post(
        fhirUrl,
        patientResource,
        {
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/fhir+json'
          }
        }
      );
      
      return response.data;
    } catch (error) {
      console.error('Error creating patient record:', error);
      throw new Error('Failed to create patient health record');
    }
  }

  /**
   * Get a patient by ID
   */
  async getPatient(patientId: string): Promise<any> {
    await this.ensureInitialized();
    
    try {
      const token = await this.getAccessToken();
      const patientUrl = `${this.baseUrl}/datasets/${this.datasetId}/fhirStores/${this.fhirStoreId}/fhir/Patient/${patientId}`;
      
      const response = await axios.get(patientUrl, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/fhir+json'
        }
      });
      
      return response.data;
    } catch (error) {
      console.error('Error getting patient:', error);
      throw new Error('Failed to retrieve patient record');
    }
  }

  /**
   * Create an appointment in the FHIR store
   */
  async createAppointment(data: AppointmentData): Promise<any> {
    await this.ensureInitialized();
    
    try {
      const token = await this.getAccessToken();
      const fhirUrl = `${this.baseUrl}/datasets/${this.datasetId}/fhirStores/${this.fhirStoreId}/fhir/Appointment`;
      
      // Construct FHIR Appointment resource with proper typing
      const appointmentResource: any = {
        resourceType: 'Appointment',
        status: data.status === 'cancelled' ? 'cancelled' : 
               (data.status === 'completed' ? 'fulfilled' : 'booked'),
        start: data.startTime,
        end: data.endTime,
        participant: [
          {
            actor: {
              reference: `Patient/${data.patientId}`
            },
            status: 'accepted'
          },
          {
            actor: {
              reference: `Practitioner/${data.doctorId}`
            },
            status: 'accepted'
          }
        ],
        description: data.reason
      };
      
      if (data.notes) {
        appointmentResource.comment = data.notes;
      }
      
      const response = await axios.post(
        fhirUrl,
        appointmentResource,
        {
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/fhir+json'
          }
        }
      );
      
      return response.data;
    } catch (error) {
      console.error('Error creating appointment:', error);
      throw new Error('Failed to create appointment');
    }
  }

  /**
   * Get appointments for a patient
   */
  async getPatientAppointments(patientId: string): Promise<any> {
    await this.ensureInitialized();
    
    try {
      const token = await this.getAccessToken();
      const appointmentUrl = `${this.baseUrl}/datasets/${this.datasetId}/fhirStores/${this.fhirStoreId}/fhir/Appointment`;
      
      // Search for appointments with this patient
      const response = await axios.get(appointmentUrl, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/fhir+json'
        },
        params: {
          patient: `Patient/${patientId}`
        }
      });
      
      return response.data;
    } catch (error) {
      console.error('Error getting patient appointments:', error);
      throw new Error('Failed to retrieve patient appointments');
    }
  }

  /**
   * Create a medical observation in the FHIR store
   */
  async createObservation(data: ObservationData): Promise<any> {
    await this.ensureInitialized();
    
    try {
      const token = await this.getAccessToken();
      const fhirUrl = `${this.baseUrl}/datasets/${this.datasetId}/fhirStores/${this.fhirStoreId}/fhir/Observation`;
      
      // Construct FHIR Observation resource
      const observationResource: any = {
        resourceType: 'Observation',
        status: data.status,
        category: [
          {
            coding: [
              {
                system: 'http://terminology.hl7.org/CodeSystem/observation-category',
                code: 'vital-signs',
                display: 'Vital Signs'
              }
            ]
          }
        ],
        code: {
          coding: [
            {
              system: 'http://loinc.org',
              code: data.code,
              display: data.display
            }
          ]
        },
        subject: {
          reference: `Patient/${data.patientId}`
        },
        effectiveDateTime: data.dateTime,
        valueQuantity: {
          value: typeof data.value === 'number' ? data.value : parseFloat(String(data.value)),
          unit: data.unit || '',
          system: 'http://unitsofmeasure.org',
          code: data.unit || ''
        }
      };

      // Add performer if practitioner is provided
      if (data.practitionerId) {
        observationResource.performer = [
          {
            reference: `Practitioner/${data.practitionerId}`
          }
        ];
      }
      
      const response = await axios.post(
        fhirUrl,
        observationResource,
        {
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/fhir+json'
          }
        }
      );
      
      return response.data;
    } catch (error) {
      console.error('Error creating observation:', error);
      throw new Error('Failed to create medical observation');
    }
  }

  /**
   * Get observations for a patient
   */
  async getPatientObservations(patientId: string): Promise<any> {
    await this.ensureInitialized();
    
    try {
      const token = await this.getAccessToken();
      const observationUrl = `${this.baseUrl}/datasets/${this.datasetId}/fhirStores/${this.fhirStoreId}/fhir/Observation`;
      
      // Search for observations with this patient
      const response = await axios.get(observationUrl, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/fhir+json'
        },
        params: {
          subject: `Patient/${patientId}`
        }
      });
      
      return response.data;
    } catch (error) {
      console.error('Error getting patient observations:', error);
      throw new Error('Failed to retrieve patient observations');
    }
  }

  /**
   * Upload a DICOM image to the DICOM store
   */
  async uploadDicomImage(patientId: string, studyUid: string, imageData: Buffer): Promise<any> {
    await this.ensureInitialized();
    
    try {
      const token = await this.getAccessToken();
      const dicomUrl = `${this.baseUrl}/datasets/${this.datasetId}/dicomStores/${this.dicomStoreId}/dicomWeb/studies/${studyUid}`;
      
      const response = await axios.post(
        dicomUrl,
        imageData,
        {
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/dicom'
          }
        }
      );
      
      return {
        success: true,
        studyUid,
        patientId
      };
    } catch (error) {
      console.error('Error uploading DICOM image:', error);
      throw new Error('Failed to upload medical image');
    }
  }

  /**
   * Get DICOM studies for a patient
   */
  async getPatientDicomStudies(patientId: string): Promise<any> {
    await this.ensureInitialized();
    
    try {
      const token = await this.getAccessToken();
      const dicomUrl = `${this.baseUrl}/datasets/${this.datasetId}/dicomStores/${this.dicomStoreId}/dicomWeb/studies`;
      
      const response = await axios.get(dicomUrl, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Accept': 'application/dicom+json'
        },
        params: {
          'PatientID': patientId
        }
      });
      
      return response.data;
    } catch (error) {
      console.error('Error getting patient DICOM studies:', error);
      throw new Error('Failed to retrieve patient medical images');
    }
  }
}

// Export a singleton instance
export const healthcareService = new HealthcareService();