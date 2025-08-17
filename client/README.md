# CuraLink Client

## Environment Configuration

To enable all features of the CuraLink client application, you need to set up the following environment variables in a `.env` file in the client directory:

### Required Environment Variables

Create a `.env` file in the `client` directory with the following variables:

```
# Google Maps API Key
VITE_GOOGLE_MAPS_API_KEY=YOUR_GOOGLE_MAPS_API_KEY

# Firebase Configuration
VITE_FIREBASE_API_KEY=YOUR_FIREBASE_API_KEY
VITE_FIREBASE_AUTH_DOMAIN=YOUR_PROJECT_ID.firebaseapp.com
VITE_FIREBASE_PROJECT_ID=YOUR_PROJECT_ID
VITE_FIREBASE_STORAGE_BUCKET=YOUR_PROJECT_ID.appspot.com
VITE_FIREBASE_MESSAGING_SENDER_ID=YOUR_MESSAGING_SENDER_ID
VITE_FIREBASE_APP_ID=YOUR_FIREBASE_APP_ID

# Alternative Google Cloud Project ID (used if Firebase config is not provided)
VITE_GOOGLE_CLOUD_PROJECT_ID=YOUR_GOOGLE_CLOUD_PROJECT_ID
VITE_GOOGLE_CLOUD_API_KEY=YOUR_GOOGLE_CLOUD_API_KEY
```

### Getting API Keys

#### Google Maps API Key

1. Go to the [Google Cloud Console](https://console.cloud.google.com/)
2. Create a new project or select an existing one
3. Enable the Google Maps JavaScript API
4. Create an API key in the Credentials section
5. Add restrictions to the API key for security (optional but recommended)

#### Firebase Configuration

1. Go to the [Firebase Console](https://console.firebase.google.com/)
2. Create a new project or select an existing one
3. Add a web app to your project
4. Copy the configuration values from the Firebase SDK snippet

## Development Mode

If you don't have the API keys yet, the application will run in development mode with mock data:

- Maps will display a simplified fallback view
- Firebase operations will use mock data

This allows you to develop and test the application without setting up the external services.