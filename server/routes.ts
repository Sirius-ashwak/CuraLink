import express, { type Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { insertUserSchema, insertAppointmentSchema, insertEmergencyTransportSchema } from "../shared/schema";
import { z } from "zod";
import { WebSocketServer } from 'ws';

// Define a type for the global object with our WebSocket server
declare global {
  var wss: WebSocketServer | undefined;
}

// Export WebSocket server for use in other modules
export let wss: WebSocketServer = global.wss || new WebSocketServer({ noServer: true });

// Import our route handlers
import symptomCheckerRoutes from "./routes/symptomChecker";
import doctorMatchRoutes from "./routes/doctorMatch";
import medicinesRoutes from "./routes/medicines";
import privacyRoutes from "./routes/privacy";
import auditRoutes from "./routes/audit";
import prescriptionRoutes from "./routes/prescriptions";
import vitalSignsRoutes from "./routes/vitalSigns";
import videoRoutes from "./routes/video";
import emergencyTransportRoutes from "./routes/emergencyTransport";
import aiChatRoutes from "./routes/aiChat";
import healthRecordRoutes from "./routes/healthRecord";
import authRoutes from "./routes/auth";
import mapsRoutes from "./routes/maps";
import secretManagerRoutes from "./routes/secretManager";
import secretTestRoutes from "./routes/secretTest";
import voiceRoutes from "./voiceRoutes";
import facilitiesRoutes from "./facilitiesRoutes";
import industryMonitoringRoutes from "./routes/industryMonitoring";
import owaspSecurityRoutes from "./routes/owaspSecurity";
import aiDiagnosisRoutes from "./routes/aiDiagnosis";
import videoConsultationRoutes from "./routes/videoConsultation";
import realPrescriptionsRoutes from "./routes/realPrescriptions";
import seedProfilesRoutes from "./routes/seedProfiles";
import translationRoutes from "./routes/translation";

export async function registerRoutes(app: Express): Promise<Server> {
  const httpServer = createServer(app);

  // API Routes
  // Use our modular auth routes
  app.use('/api/auth', authRoutes);

  // User routes
  app.get('/api/users/:id', async (req, res) => {
    const id = parseInt(req.params.id);
    const user = await storage.getUser(id);
    
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }
    
    // Don't return password
    const { password, ...userWithoutPassword } = user;
    res.json(userWithoutPassword);
  });

  // Doctor routes
  app.get('/api/doctors', async (req, res) => {
    const { specialty } = req.query;
    
    try {
      let doctors;
      if (specialty && typeof specialty === 'string') {
        doctors = await storage.getDoctorsBySpecialty(specialty);
      } else {
        doctors = await storage.getDoctors();
      }
      res.json(doctors);
    } catch (error) {
      console.error('Error fetching doctors:', error);
      res.status(500).json({ message: 'Internal server error' });
    }
  });

  app.get('/api/doctors/:id', async (req, res) => {
    const id = parseInt(req.params.id);
    const doctor = await storage.getDoctor(id);
    
    if (!doctor) {
      return res.status(404).json({ message: 'Doctor not found' });
    }
    
    res.json(doctor);
  });

  app.post('/api/doctors/:id/availability', express.json(), async (req, res) => {
    const doctorId = parseInt(req.params.id);
    const { isAvailable } = req.body;
    
    try {
      const doctor = await storage.updateDoctorAvailability(doctorId, isAvailable);
      res.json(doctor);
    } catch (error) {
      console.error('Error updating doctor availability:', error);
      res.status(500).json({ message: 'Internal server error' });
    }
  });

  app.get('/api/doctors/:id/availability', async (req, res) => {
    const doctorId = parseInt(req.params.id);
    
    try {
      const availability = await storage.getAvailability(doctorId);
      res.json(availability);
    } catch (error) {
      console.error('Error fetching availability:', error);
      res.status(500).json({ message: 'Internal server error' });
    }
  });

  app.get('/api/doctors/:id/time-off', async (req, res) => {
    const doctorId = parseInt(req.params.id);
    
    try {
      const timeOffs = await storage.getTimeOffs(doctorId);
      res.json(timeOffs);
    } catch (error) {
      console.error('Error fetching time offs:', error);
      res.status(500).json({ message: 'Internal server error' });
    }
  });

  // Appointment routes
  app.get('/api/appointments/patient/:patientId', async (req, res) => {
    const patientId = parseInt(req.params.patientId);
    
    try {
      const appointments = await storage.getAppointmentsByPatient(patientId);
      res.json(appointments);
    } catch (error) {
      console.error('Error fetching patient appointments:', error);
      res.status(500).json({ message: 'Internal server error' });
    }
  });

  app.get('/api/appointments/doctor/:doctorId', async (req, res) => {
    const doctorId = parseInt(req.params.doctorId);
    
    try {
      const appointments = await storage.getAppointmentsByDoctor(doctorId);
      res.json(appointments);
    } catch (error) {
      console.error('Error fetching doctor appointments:', error);
      res.status(500).json({ message: 'Internal server error' });
    }
  });

  app.post('/api/appointments', express.json(), async (req, res) => {
    try {
      const appointmentData = insertAppointmentSchema.parse(req.body);
      const appointment = await storage.createAppointment(appointmentData);
      res.status(201).json(appointment);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: 'Invalid input', errors: error.errors });
      }
      console.error('Error creating appointment:', error);
      res.status(500).json({ message: 'Internal server error' });
    }
  });

  app.patch('/api/appointments/:id', express.json(), async (req, res) => {
    const id = parseInt(req.params.id);
    
    try {
      const appointment = await storage.updateAppointment(id, req.body);
      res.json(appointment);
    } catch (error) {
      console.error('Error updating appointment:', error);
      res.status(500).json({ message: 'Internal server error' });
    }
  });

  app.delete('/api/appointments/:id', async (req, res) => {
    const id = parseInt(req.params.id);
    
    try {
      const appointment = await storage.cancelAppointment(id);
      res.json(appointment);
    } catch (error) {
      console.error('Error canceling appointment:', error);
      res.status(500).json({ message: 'Internal server error' });
    }
  });

  // Emergency transport routes
  app.get('/api/emergency/active', async (req, res) => {
    try {
      const transports = await storage.getActiveEmergencyTransports();
      res.json(transports);
    } catch (error) {
      console.error('Error fetching active emergency transports:', error);
      res.status(500).json({ message: 'Internal server error' });
    }
  });

  app.get('/api/emergency/patient/:patientId', async (req, res) => {
    const patientId = parseInt(req.params.patientId);
    
    try {
      const transports = await storage.getEmergencyTransportsByPatient(patientId);
      res.json(transports);
    } catch (error) {
      console.error('Error fetching patient emergency transports:', error);
      res.status(500).json({ message: 'Internal server error' });
    }
  });

  // Add missing emergency transport creation endpoint
  app.post('/api/emergency/transport', express.json(), async (req, res) => {
    try {
      const transportData = insertEmergencyTransportSchema.parse(req.body);
      const transport = await storage.createEmergencyTransport(transportData);
      res.status(201).json(transport);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: 'Invalid input', errors: error.errors });
      }
      console.error('Error creating emergency transport:', error);
      res.status(500).json({ message: 'Internal server error' });
    }
  });

  // Mount route handlers
  app.use('/api/symptom-checker', symptomCheckerRoutes);
  app.use('/api/doctor-match', doctorMatchRoutes);
  app.use('/api/medicines', medicinesRoutes);
  app.use('/api/video', videoRoutes);
  app.use('/api/emergency', emergencyTransportRoutes);
  app.use('/api/emergency-transport', emergencyTransportRoutes); // Add this line for the correct endpoint
  app.use('/api/ai-chat', aiChatRoutes);
  app.use('/api/health-record', healthRecordRoutes);
  app.use('/api/auth', authRoutes);
  app.use('/api/maps', mapsRoutes);
  app.use('/api/secret-manager', secretManagerRoutes);
  app.use('/api/secret-test', secretTestRoutes);
  app.use('/api/privacy', privacyRoutes);
  app.use('/api/audit', auditRoutes);
  app.use('/api/prescriptions', prescriptionRoutes);
  app.use('/api/real-prescriptions', realPrescriptionsRoutes);
  app.use('/api/vital-signs', vitalSignsRoutes);
  app.use('/api/voice-assistant', voiceRoutes);
  app.use('/api/facilities', facilitiesRoutes);
  app.use('/api/ai-diagnosis', aiDiagnosisRoutes);
  app.use('/api/video-consultation', videoConsultationRoutes);
  app.use('/api/seed-profiles', seedProfilesRoutes);
  app.use('/api/translation', translationRoutes);

  // Health check endpoint
  // Industry-ready monitoring and compliance dashboard
  app.use('/api/monitoring', industryMonitoringRoutes);
  
  // OWASP Top 10 security assessment
  app.use('/api/security/owasp', owaspSecurityRoutes);

  app.get('/api/health', (req, res) => {
    res.json({ 
      status: 'ok',
      timestamp: new Date().toISOString(),
      services: {
        api: 'running',
        database: 'connected'
      }
    });
  });

  return httpServer;
}