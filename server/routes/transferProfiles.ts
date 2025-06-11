import express from 'express';
import { storage } from '../storage';
import { MemStorage } from '../storage';
import { FirebaseStorage } from '../FirebaseStorage';

const router = express.Router();

// Transfer profiles from memory to Firebase
router.post('/transfer-to-firebase', async (req, res) => {
  try {
    console.log('Starting profile transfer from memory to Firebase...');
    
    // Create instances
    const memoryStorage = new MemStorage();
    const firebaseStorage = new FirebaseStorage();
    
    let transferredUsers = 0;
    let transferredDoctors = 0;
    
    // Get all users from memory storage
    console.log('Fetching users from memory storage...');
    const memoryUsers = await memoryStorage.getAllUsers?.() || [];
    
    // Get all doctors from memory storage  
    console.log('Fetching doctors from memory storage...');
    const memoryDoctors = await memoryStorage.getDoctors();
    
    console.log(`Found ${memoryUsers.length} users and ${memoryDoctors.length} doctors in memory`);
    
    // Transfer users to Firebase
    for (const user of memoryUsers) {
      try {
        // Check if user already exists in Firebase
        const existingUser = await firebaseStorage.getUserByEmail(user.email);
        if (!existingUser) {
          await firebaseStorage.createUser({
            email: user.email,
            firstName: user.firstName,
            lastName: user.lastName,
            role: user.role,
            passwordHash: user.passwordHash
          });
          transferredUsers++;
          console.log(`✅ Transferred user: ${user.firstName} ${user.lastName}`);
        } else {
          console.log(`👥 User already exists: ${user.email}`);
        }
      } catch (error) {
        console.error(`❌ Error transferring user ${user.email}:`, error);
      }
    }
    
    // Transfer doctors to Firebase
    for (const doctor of memoryDoctors) {
      try {
        // Check if doctor already exists
        const existingDoctor = await firebaseStorage.getDoctor(doctor.id);
        if (!existingDoctor) {
          await firebaseStorage.createDoctor({
            userId: doctor.userId,
            specialty: doctor.specialty,
            isAvailable: doctor.isAvailable || true
          });
          transferredDoctors++;
          console.log(`✅ Transferred doctor: ${doctor.specialty} specialist`);
        } else {
          console.log(`👨‍⚕️ Doctor already exists: ${doctor.id}`);
        }
      } catch (error) {
        console.error(`❌ Error transferring doctor ${doctor.id}:`, error);
      }
    }
    
    console.log(`🎉 Transfer completed! ${transferredUsers} users and ${transferredDoctors} doctors transferred to Firebase`);
    
    res.json({
      success: true,
      message: 'Profiles transferred successfully',
      transferred: {
        users: transferredUsers,
        doctors: transferredDoctors
      },
      total: {
        users: memoryUsers.length,
        doctors: memoryDoctors.length
      }
    });
    
  } catch (error) {
    console.error('Transfer failed:', error);
    res.status(500).json({
      success: false,
      message: 'Transfer failed',
      error: error.message
    });
  }
});

export default router;