import twilio from 'twilio';
import { Request, Response } from 'express';

const AccessToken = twilio.jwt.AccessToken;
const VideoGrant = AccessToken.VideoGrant;

// Twilio credentials
const twilioAccountSid = process.env.TWILIO_ACCOUNT_SID;
const twilioApiKey = process.env.TWILIO_API_KEY; 
const twilioApiSecret = process.env.TWILIO_API_SECRET;

// Generate an access token for Twilio Video
export const generateToken = (identity: string, roomName: string): string => {
  // Create an access token
  const token = new AccessToken(
    twilioAccountSid as string,
    twilioApiKey as string,
    twilioApiSecret as string,
    { identity }
  );

  // Create a video grant and add it to the token
  const videoGrant = new VideoGrant({
    room: roomName,
  });
  
  token.addGrant(videoGrant);
  
  // Serialize the token and return it
  return token.toJwt();
};

// Check if Twilio credentials are properly configured
export const checkTwilioCredentials = (): boolean => {
  return !!(twilioAccountSid && twilioApiKey && twilioApiSecret);
};

class TwilioService {
  // Generate a token for a participant to join a video room
  generateToken(identity: string, roomName: string): string {
    return generateToken(identity, roomName);
  }
  
  // Check if all required Twilio credentials are configured
  isConfigured(): boolean {
    return checkTwilioCredentials();
  }
}

export const twilioService = new TwilioService();