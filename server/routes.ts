import express, { type Express } from "express";
import { createServer, type Server } from "http";
import { WebSocketServer, WebSocket } from "ws";
import { storage } from "./storage";
import { insertUserSchema, insertAppointmentSchema } from "@shared/schema";
import { z } from "zod";

// Import our new route handlers
import symptomCheckerRoutes from "./routes/symptomChecker";
import doctorMatchRoutes from "./routes/doctorMatch";
import medicinesRoutes from "./routes/medicines";
import videoRoutes from "./routes/video";

export async function registerRoutes(app: Express): Promise<Server> {
  const httpServer = createServer(app);
  
  // WebSocket server setup
  const wss = new WebSocketServer({ server: httpServer, path: '/ws' });
  
  // Store active connections
  const clients = new Map<number, WebSocket[]>();
  
  wss.on('connection', (ws) => {
    let userId: number | null = null;
    
    ws.on('message', async (messageData) => {
      try {
        const message = JSON.parse(messageData.toString());
        
        // Handle authentication
        if (message.type === 'auth') {
          userId = message.userId;
          if (userId !== null) {
            if (!clients.has(userId)) {
              clients.set(userId, []);
            }
            clients.get(userId)!.push(ws);
          
            // Send initial data
            if (message.role === 'patient') {
              const appointments = await storage.getAppointmentsByPatient(userId);
              ws.send(JSON.stringify({
                type: 'appointments',
                data: appointments
              }));
            } else if (message.role === 'doctor') {
              const doctor = await storage.getDoctorByUserId(userId);
              if (doctor) {
                const appointments = await storage.getAppointmentsByDoctor(doctor.id);
                const availability = await storage.getAvailability(doctor.id);
                const timeOffs = await storage.getTimeOffs(doctor.id);
                
                ws.send(JSON.stringify({
                  type: 'doctorData',
                  data: {
                    appointments,
                    availability,
                    timeOffs
                  }
                }));
              }
            }
          }
        }
        
        // Handle doctor status update
        if (message.type === 'updateDoctorStatus' && userId) {
          const doctor = await storage.getDoctorByUserId(userId);
          if (doctor) {
            await storage.updateDoctorAvailability(doctor.id, message.isAvailable);
            
            // Broadcast to all clients
            broadcastDoctorUpdate(doctor.id);
          }
        }
        
        // Handle appointment status update
        if (message.type === 'updateAppointment' && userId) {
          const appointment = await storage.getAppointment(message.appointmentId);
          if (appointment) {
            if (message.status === 'canceled') {
              await storage.cancelAppointment(message.appointmentId);
            } else {
              await storage.updateAppointment(message.appointmentId, {
                status: message.status
              });
            }
            
            // Notify both doctor and patient
            notifyAppointmentUpdate(appointment.patientId, appointment.doctorId);
          }
        }
      } catch (err) {
        console.error('WebSocket message error:', err);
      }
    });
    
    ws.on('close', () => {
      if (userId && clients.has(userId)) {
        const userClients = clients.get(userId)!;
        const index = userClients.indexOf(ws);
        if (index !== -1) {
          userClients.splice(index, 1);
        }
        if (userClients.length === 0) {
          clients.delete(userId);
        }
      }
    });
  });
  
  // Helper function to broadcast doctor updates
  const broadcastDoctorUpdate = async (doctorId: number) => {
    const doctor = await storage.getDoctor(doctorId);
    if (!doctor) return;
    
    const appointments = await storage.getAppointmentsByDoctor(doctorId);
    
    // Notify all patients with appointments with this doctor
    for (const appointment of appointments) {
      notifyUser(appointment.patientId, {
        type: 'doctorUpdate',
        data: {
          doctorId,
          isAvailable: doctor.isAvailable
        }
      });
    }
    
    // Notify the doctor
    notifyUser(doctor.userId, {
      type: 'doctorStatusUpdated',
      data: {
        isAvailable: doctor.isAvailable
      }
    });
  };
  
  // Helper function to notify about appointment updates
  const notifyAppointmentUpdate = async (patientId: number, doctorId: number) => {
    const doctor = await storage.getDoctor(doctorId);
    if (!doctor) return;
    
    const patientAppointments = await storage.getAppointmentsByPatient(patientId);
    notifyUser(patientId, {
      type: 'appointments',
      data: patientAppointments
    });
    
    const doctorAppointments = await storage.getAppointmentsByDoctor(doctorId);
    notifyUser(doctor.userId, {
      type: 'appointments',
      data: doctorAppointments
    });
  };
  
  // Helper function to send message to a specific user
  const notifyUser = (userId: number, data: any) => {
    if (clients.has(userId)) {
      const userClients = clients.get(userId)!;
      userClients.forEach(client => {
        if (client.readyState === 1) { // OPEN = 1
          client.send(JSON.stringify(data));
        }
      });
    }
  };
  
  // API Routes
  // Auth routes
  app.post('/api/auth/login', express.json(), async (req, res) => {
    try {
      const { email, password } = req.body;
      
      if (!email || !password) {
        return res.status(400).json({ message: 'Email and password are required' });
      }
      
      const user = await storage.getUserByEmail(email);
      
      if (!user || user.password !== password) {
        return res.status(401).json({ message: 'Invalid credentials' });
      }
      
      // Send user data without password
      const { password: _, ...userData } = user;
      
      // Add doctor information if user is a doctor
      if (user.role === 'doctor') {
        const doctor = await storage.getDoctorByUserId(user.id);
        return res.json({ ...userData, doctorInfo: doctor });
      }
      
      return res.json(userData);
    } catch (error) {
      console.error('Login error:', error);
      return res.status(500).json({ message: 'Internal server error' });
    }
  });
  
  app.post('/api/auth/register', express.json(), async (req, res) => {
    try {
      const userResult = insertUserSchema.safeParse(req.body);
      
      if (!userResult.success) {
        return res.status(400).json({ 
          message: 'Invalid user data', 
          errors: userResult.error.format() 
        });
      }
      
      const existingUser = await storage.getUserByEmail(userResult.data.email);
      
      if (existingUser) {
        return res.status(409).json({ message: 'Email already in use' });
      }
      
      const user = await storage.createUser(userResult.data);
      
      // If registering as a doctor, create doctor record
      if (user.role === 'doctor' && user.specialty) {
        const doctor = await storage.createDoctor({
          userId: user.id,
          specialty: user.specialty,
          averageRating: 0,
          reviewCount: 0,
          isAvailable: true
        });
        
        // Setup default availability (Mon-Fri, 9am-5pm)
        const weekdays = [1, 2, 3, 4, 5]; // Monday to Friday
        for (const day of weekdays) {
          await storage.createAvailability({
            doctorId: doctor.id,
            dayOfWeek: day,
            startTime: "09:00",
            endTime: "17:00",
            isAvailable: true
          });
        }
        
        // Send user data without password
        const { password: _, ...userData } = user;
        return res.status(201).json({ ...userData, doctorInfo: doctor });
      }
      
      // Send user data without password
      const { password: _, ...userData } = user;
      return res.status(201).json(userData);
    } catch (error) {
      console.error('Register error:', error);
      return res.status(500).json({ message: 'Internal server error' });
    }
  });
  
  // Doctor routes
  app.get('/api/doctors', async (req, res) => {
    try {
      const specialty = req.query.specialty as string | undefined;
      
      let doctors;
      if (specialty) {
        doctors = await storage.getDoctorsBySpecialty(specialty);
      } else {
        doctors = await storage.getDoctors();
      }
      
      return res.json(doctors);
    } catch (error) {
      console.error('Get doctors error:', error);
      return res.status(500).json({ message: 'Internal server error' });
    }
  });
  
  app.get('/api/doctors/:id', async (req, res) => {
    try {
      const doctorId = parseInt(req.params.id);
      
      if (isNaN(doctorId)) {
        return res.status(400).json({ message: 'Invalid doctor ID' });
      }
      
      const doctor = await storage.getDoctor(doctorId);
      
      if (!doctor) {
        return res.status(404).json({ message: 'Doctor not found' });
      }
      
      const user = await storage.getUser(doctor.userId);
      
      if (!user) {
        return res.status(404).json({ message: 'Doctor user not found' });
      }
      
      const { password: _, ...userData } = user;
      
      return res.json({ ...doctor, user: userData });
    } catch (error) {
      console.error('Get doctor error:', error);
      return res.status(500).json({ message: 'Internal server error' });
    }
  });
  
  app.get('/api/doctors/:id/availability', async (req, res) => {
    try {
      const doctorId = parseInt(req.params.id);
      
      if (isNaN(doctorId)) {
        return res.status(400).json({ message: 'Invalid doctor ID' });
      }
      
      const availability = await storage.getAvailability(doctorId);
      const timeOffs = await storage.getTimeOffs(doctorId);
      
      return res.json({ availability, timeOffs });
    } catch (error) {
      console.error('Get doctor availability error:', error);
      return res.status(500).json({ message: 'Internal server error' });
    }
  });
  
  app.post('/api/doctors/:id/availability', express.json(), async (req, res) => {
    try {
      const doctorId = parseInt(req.params.id);
      
      if (isNaN(doctorId)) {
        return res.status(400).json({ message: 'Invalid doctor ID' });
      }
      
      const { dayOfWeek, startTime, endTime, isAvailable } = req.body;
      
      if (typeof dayOfWeek !== 'number' || typeof startTime !== 'string' || typeof endTime !== 'string') {
        return res.status(400).json({ message: 'Invalid availability data' });
      }
      
      const availability = await storage.createAvailability({
        doctorId,
        dayOfWeek,
        startTime,
        endTime,
        isAvailable: isAvailable !== false
      });
      
      return res.status(201).json(availability);
    } catch (error) {
      console.error('Create availability error:', error);
      return res.status(500).json({ message: 'Internal server error' });
    }
  });
  
  app.post('/api/doctors/:id/time-off', express.json(), async (req, res) => {
    try {
      const doctorId = parseInt(req.params.id);
      
      if (isNaN(doctorId)) {
        return res.status(400).json({ message: 'Invalid doctor ID' });
      }
      
      const { title, startDate, endDate } = req.body;
      
      if (typeof title !== 'string' || !startDate || !endDate) {
        return res.status(400).json({ message: 'Invalid time-off data' });
      }
      
      const timeOff = await storage.createTimeOff({
        doctorId,
        title,
        startDate: new Date(startDate),
        endDate: new Date(endDate)
      });
      
      return res.status(201).json(timeOff);
    } catch (error) {
      console.error('Create time-off error:', error);
      return res.status(500).json({ message: 'Internal server error' });
    }
  });
  
  app.delete('/api/time-off/:id', async (req, res) => {
    try {
      const timeOffId = parseInt(req.params.id);
      
      if (isNaN(timeOffId)) {
        return res.status(400).json({ message: 'Invalid time-off ID' });
      }
      
      const result = await storage.deleteTimeOff(timeOffId);
      
      if (!result) {
        return res.status(404).json({ message: 'Time-off not found' });
      }
      
      return res.status(204).end();
    } catch (error) {
      console.error('Delete time-off error:', error);
      return res.status(500).json({ message: 'Internal server error' });
    }
  });
  
  // Appointment routes
  app.get('/api/appointments', async (req, res) => {
    try {
      const patientId = req.query.patientId ? parseInt(req.query.patientId as string) : undefined;
      const doctorId = req.query.doctorId ? parseInt(req.query.doctorId as string) : undefined;
      const dateStr = req.query.date as string | undefined;
      
      if (patientId) {
        const appointments = await storage.getAppointmentsByPatient(patientId);
        return res.json(appointments);
      } else if (doctorId) {
        if (dateStr) {
          const date = new Date(dateStr);
          const appointments = await storage.getAppointmentsByDate(doctorId, date);
          return res.json(appointments);
        } else {
          const appointments = await storage.getAppointmentsByDoctor(doctorId);
          return res.json(appointments);
        }
      }
      
      return res.status(400).json({ message: 'Either patientId or doctorId is required' });
    } catch (error) {
      console.error('Get appointments error:', error);
      return res.status(500).json({ message: 'Internal server error' });
    }
  });
  
  app.get('/api/appointments/:id', async (req, res) => {
    try {
      const appointmentId = parseInt(req.params.id);
      
      if (isNaN(appointmentId)) {
        return res.status(400).json({ message: 'Invalid appointment ID' });
      }
      
      const appointment = await storage.getAppointment(appointmentId);
      
      if (!appointment) {
        return res.status(404).json({ message: 'Appointment not found' });
      }
      
      return res.json(appointment);
    } catch (error) {
      console.error('Get appointment error:', error);
      return res.status(500).json({ message: 'Internal server error' });
    }
  });
  
  app.post('/api/appointments', express.json(), async (req, res) => {
    try {
      const appointmentResult = insertAppointmentSchema.safeParse(req.body);
      
      if (!appointmentResult.success) {
        return res.status(400).json({ 
          message: 'Invalid appointment data', 
          errors: appointmentResult.error.format() 
        });
      }
      
      const appointment = await storage.createAppointment(appointmentResult.data);
      const fullAppointment = await storage.getAppointment(appointment.id);
      
      // Notify both the patient and the doctor
      if (fullAppointment) {
        notifyAppointmentUpdate(fullAppointment.patientId, fullAppointment.doctorId);
      }
      
      return res.status(201).json(appointment);
    } catch (error) {
      console.error('Create appointment error:', error);
      return res.status(500).json({ message: 'Internal server error' });
    }
  });
  
  app.patch('/api/appointments/:id', express.json(), async (req, res) => {
    try {
      const appointmentId = parseInt(req.params.id);
      
      if (isNaN(appointmentId)) {
        return res.status(400).json({ message: 'Invalid appointment ID' });
      }
      
      const { status, notes, callUrl } = req.body;
      
      const updatedFields: any = {};
      if (status) updatedFields.status = status;
      if (notes) updatedFields.notes = notes;
      if (callUrl) updatedFields.callUrl = callUrl;
      
      const appointment = await storage.updateAppointment(appointmentId, updatedFields);
      const fullAppointment = await storage.getAppointment(appointment.id);
      
      // Notify both the patient and the doctor
      if (fullAppointment) {
        notifyAppointmentUpdate(fullAppointment.patientId, fullAppointment.doctorId);
      }
      
      return res.json(appointment);
    } catch (error) {
      console.error('Update appointment error:', error);
      return res.status(500).json({ message: 'Internal server error' });
    }
  });
  
  app.delete('/api/appointments/:id', async (req, res) => {
    try {
      const appointmentId = parseInt(req.params.id);
      
      if (isNaN(appointmentId)) {
        return res.status(400).json({ message: 'Invalid appointment ID' });
      }
      
      const appointment = await storage.getAppointment(appointmentId);
      
      if (!appointment) {
        return res.status(404).json({ message: 'Appointment not found' });
      }
      
      await storage.cancelAppointment(appointmentId);
      
      // Notify both the patient and the doctor
      notifyAppointmentUpdate(appointment.patientId, appointment.doctorId);
      
      return res.status(204).end();
    } catch (error) {
      console.error('Cancel appointment error:', error);
      return res.status(500).json({ message: 'Internal server error' });
    }
  });
  
  // Register our new routes
  // Symptom checker API
  app.use('/api/symptom-checker', symptomCheckerRoutes);
  
  // Doctor matching API and symptom categories 
  app.use('/api/doctor-match', doctorMatchRoutes);
  
  // Medicines management API
  app.use('/api/medicines', medicinesRoutes);
  
  // Video calling API
  app.use('/api/video', videoRoutes);
  
  return httpServer;
}
