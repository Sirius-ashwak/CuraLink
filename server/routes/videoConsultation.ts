import express from "express";
import twilio from "twilio";

const router = express.Router();

// Initialize Twilio client
const accountSid = process.env.TWILIO_ACCOUNT_SID;
const authToken = process.env.TWILIO_AUTH_TOKEN;
const client = twilio(accountSid, authToken);

router.post('/create-room', express.json(), async (req, res) => {
  try {
    const { doctorId, patientId, appointmentId } = req.body;

    if (!doctorId || !patientId) {
      return res.status(400).json({ error: 'Doctor ID and Patient ID are required' });
    }

    // Create a unique room name
    const roomName = `consultation-${doctorId}-${patientId}-${Date.now()}`;

    // Create Twilio Video room
    const room = await client.video.v1.rooms.create({
      uniqueName: roomName,
      type: 'peer-to-peer', // More suitable for 1-on-1 consultations
      maxParticipants: 2
    });

    // Generate access tokens for both doctor and patient
    const AccessToken = twilio.jwt.AccessToken;
    const VideoGrant = AccessToken.VideoGrant;

    // Doctor token
    const doctorToken = new AccessToken(accountSid!, authToken!, {
      identity: `doctor-${doctorId}`,
      ttl: 3600 // 1 hour
    });
    const doctorVideoGrant = new VideoGrant({ room: roomName });
    doctorToken.addGrant(doctorVideoGrant);

    // Patient token  
    const patientToken = new AccessToken(accountSid!, authToken!, {
      identity: `patient-${patientId}`,
      ttl: 3600 // 1 hour
    });
    const patientVideoGrant = new VideoGrant({ room: roomName });
    patientToken.addGrant(patientVideoGrant);

    res.json({
      roomSid: room.sid,
      roomName: room.uniqueName,
      doctorToken: doctorToken.toJwt(),
      patientToken: patientToken.toJwt(),
      roomUrl: `${process.env.REPLIT_DEV_DOMAIN || 'localhost:5000'}/video-call/${room.uniqueName}`,
      status: room.status,
      createdAt: room.dateCreated
    });

  } catch (error) {
    console.error('Video consultation creation error:', error);
    res.status(500).json({ 
      error: 'Failed to create video consultation room',
      details: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

router.get('/room/:roomName/status', async (req, res) => {
  try {
    const { roomName } = req.params;
    
    const room = await client.video.v1.rooms(roomName).fetch();
    
    res.json({
      roomName: room.uniqueName,
      status: room.status,
      participants: room.maxParticipants,
      duration: room.duration,
      createdAt: room.dateCreated,
      endedAt: room.dateUpdated
    });

  } catch (error) {
    console.error('Room status error:', error);
    res.status(500).json({ error: 'Failed to get room status' });
  }
});

router.post('/end-call', express.json(), async (req, res) => {
  try {
    const { roomName } = req.body;

    if (!roomName) {
      return res.status(400).json({ error: 'Room name is required' });
    }

    // Complete the room
    const room = await client.video.v1.rooms(roomName).update({
      status: 'completed'
    });

    res.json({
      message: 'Video consultation ended successfully',
      roomName: room.uniqueName,
      status: room.status,
      endedAt: room.dateUpdated
    });

  } catch (error) {
    console.error('End call error:', error);
    res.status(500).json({ error: 'Failed to end video consultation' });
  }
});

export default router;