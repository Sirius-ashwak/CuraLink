# Curalink

Curalink is a cutting-edge telehealth platform revolutionizing digital healthcare through intelligent, user-centric design and advanced technological integrations.

## Key Features

- **Real-time Doctor Availability Management**: Allows healthcare providers to set and update their availability schedules
- **Appointment Scheduling System**: Enables patients to book appointments with available healthcare providers
- **Video Consultations**: Secure telehealth consultations between patients and doctors
- **AI-powered Symptom Checker**: Helps patients understand their symptoms and get medical recommendations powered by Google Gemini AI
- **Doctor Matcher**: Matches patients with the most suitable doctors based on their symptoms and needs
- **Medicine Stock Tracker**: Helps patients manage their medications with reminders and information
- **Emergency Transport Tracking**: Real-time tracking of emergency transport services

## Technical Components

- **Frontend**: React.js with TypeScript for type safety
- **UI Design**: Responsive and accessible interface using Tailwind CSS and shadcn components
- **State Management**: Context API for global state management
- **Real-time Data**: WebSocket implementation for real-time updates
- **AI Integration**: Google Gemini AI for medical symptom analysis and recommendations
- **Video Integration**: Twilio for secure video consultations

## Getting Started

1. Clone the repository
2. Install dependencies with `npm install`
3. Start the development server with `npm run dev`
4. Open your browser to view the application

## Prerequisites

- Node.js 20.x or higher
- npm 9.x or higher
- Google Gemini API key for AI features
- Twilio credentials for video consultations

## Deployment to Render

### Manual Deployment Steps

1. Create a new Web Service on Render
2. Connect your GitHub repository
3. Use the following settings:
   - **Build Command**: `npm install && npm run build`
   - **Start Command**: `npm start`
4. Add the following environment variables:
   - `NODE_ENV`: `production`
   - `GEMINI_API_KEY`: Your Google Gemini API key
   - `TWILIO_ACCOUNT_SID`: Your Twilio Account SID
   - `TWILIO_API_KEY`: Your Twilio API Key
   - `TWILIO_API_SECRET`: Your Twilio API Secret
5. Deploy your application