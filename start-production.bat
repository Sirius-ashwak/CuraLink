@echo off
echo Starting CuraLink in production mode...

:: Check if .env file exists
if not exist .env (
  echo ERROR: .env file not found. Please create a .env file with your API keys.
  echo Required variables include:
  echo   VITE_GOOGLE_MAPS_API_KEY
  echo   VITE_FIREBASE_API_KEY
  echo   VITE_FIREBASE_PROJECT_ID
  echo   And other Firebase configuration variables
  pause
  exit /b 1
)

:: Set environment to production
set NODE_ENV=production

:: Build the application for production
echo Building application for production...
call npm run build:production

:: If build was successful, start the production server
if %ERRORLEVEL% EQU 0 (
  echo Starting production server...
  cd dist
  node index.js
) else (
  echo Build failed with error code %ERRORLEVEL%
)

pause