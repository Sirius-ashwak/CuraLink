# Environment Variables Setup for CuraLink

## Important Security Notice

**NEVER commit your actual API keys to version control!** The `.env` file should always be included in your `.gitignore` file.

## Required Environment Variables

CuraLink requires the following environment variables to be set in a `.env` file at the root of the project:

```
# Google Maps API Key (required for maps functionality)
VITE_GOOGLE_MAPS_API_KEY=your_google_maps_api_key_here

# Firebase Configuration (required for real-time data)
VITE_FIREBASE_API_KEY=your_firebase_api_key_here
VITE_FIREBASE_AUTH_DOMAIN=your_project_id.firebaseapp.com
VITE_FIREBASE_PROJECT_ID=your_project_id
VITE_FIREBASE_STORAGE_BUCKET=your_project_id.appspot.com
VITE_FIREBASE_MESSAGING_SENDER_ID=your_messaging_sender_id
VITE_FIREBASE_APP_ID=your_app_id
VITE_FIREBASE_MEASUREMENT_ID=your_measurement_id

# Google Cloud API credentials
GOOGLE_CLOUD_PROJECT_ID=your_project_id
GOOGLE_CLOUD_API_KEY=your_api_key
GOOGLE_CLOUD_CLIENT_ID=your_client_id
GOOGLE_CLOUD_CLIENT_SECRET=your_client_secret

# AI Features
GEMINI_API_KEY=your_gemini_api_key

# Twilio Video API for video calling
TWILIO_ACCOUNT_SID=your_twilio_account_sid
TWILIO_AUTH_TOKEN=your_twilio_auth_token

# Google Cloud Authentication for Secret Manager and Healthcare API
GOOGLE_APPLICATION_CREDENTIALS=./google-cloud-credentials.json

# Environment mode (development or production)
NODE_ENV=development
```

## Development vs. Production

- For development: `NODE_ENV=development`
- For production: `NODE_ENV=production`

## Fallback Behavior

If certain API keys are missing:

1. **Google Maps**: A fallback map component will be displayed
2. **Firebase**: Mock data will be used for development purposes

## Getting API Keys

### Google Maps API Key

1. Go to the [Google Cloud Console](https://console.cloud.google.com/)
2. Create a new project or select an existing one
3. Enable the Google Maps JavaScript API
4. Create an API key in the Credentials section
5. Add restrictions to the API key for security (recommended)

### Firebase Configuration

1. Go to the [Firebase Console](https://console.firebase.google.com/)
2. Create a new project or select an existing one
3. Add a web app to your project
4. Copy the configuration values from the Firebase SDK snippet

## Production Deployment

When deploying to production:

1. Ensure all required environment variables are set
2. Set `NODE_ENV=production`
3. Use the `npm run build:production` script to build the application
4. Start the server with `npm run start:production`

## Security Best Practices

- Use environment variables for all sensitive information
- Never hardcode API keys in your source code
- Set appropriate restrictions on your API keys
- Regularly rotate your API keys
- Use different API keys for development and production