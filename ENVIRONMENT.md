# Environment Variables for Curalink

## Required Environment Variables

The application requires the following environment variables to be set:

- `GEMINI_API_KEY`: Google Gemini API key for AI chat and symptom analysis
- `TWILIO_ACCOUNT_SID`: Twilio Account SID for video calling
- `TWILIO_API_KEY`: Twilio API Key for video calling
- `TWILIO_API_SECRET`: Twilio API Secret for video calling

## Local Development

For local development:

1. Create a `.env` file in the root directory with the following structure:

```
# Google Gemini AI API Key
GEMINI_API_KEY=your_gemini_api_key_here

# Twilio Credentials
TWILIO_ACCOUNT_SID=your_twilio_account_sid_here
TWILIO_API_KEY=your_twilio_api_key_here
TWILIO_API_SECRET=your_twilio_api_secret_here

# Node Environment
NODE_ENV=development
```

2. Replace the placeholder values with your actual API keys and credentials
3. Restart your development server if it's already running

## Production Deployment

When deploying to Render or other hosting platforms:

1. Configure these environment variables in your hosting platform's settings
2. Make sure to set `NODE_ENV=production` for production deployments

## How Environment Variables Are Used

- The Gemini AI service uses `GEMINI_API_KEY` for all AI-powered features
- The Twilio video service uses the Twilio credentials for secure video consultations
- All API keys are accessed server-side and never exposed to the client
