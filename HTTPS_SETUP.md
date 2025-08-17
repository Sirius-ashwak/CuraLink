# HTTPS Setup for CuraLink

This guide explains how to set up HTTPS for your CuraLink application, which is essential for secure healthcare communications.

## Why HTTPS is Important for Healthcare Applications

HTTPS provides several critical security features for healthcare applications:

1. **Data Encryption**: All data transmitted between the client and server is encrypted, protecting sensitive patient information.
2. **Authentication**: Verifies that users are communicating with the legitimate CuraLink server, not an impostor.
3. **Data Integrity**: Ensures that data hasn't been modified during transmission.
4. **HIPAA Compliance**: Required for handling Protected Health Information (PHI) in accordance with healthcare regulations.
5. **Browser Features**: Many modern browser features (like geolocation, WebRTC, and service workers) require HTTPS.

## Local Development with HTTPS

### Generating SSL Certificates

For local development, you can generate self-signed SSL certificates using the provided script:

```bash
npm run generate-ssl
```

This will create the necessary SSL certificates in the `ssl` directory:
- `key.pem`: The private key
- `cert.pem`: The self-signed certificate

### Running the Application with HTTPS

To start the application with HTTPS enabled:

```bash
npm run dev:https
```

This will start both HTTP (port 5000) and HTTPS (port 5443) servers. You can access the application at:
- HTTP: http://localhost:5000 (will redirect to HTTPS in production)
- HTTPS: https://localhost:5443

### Handling Browser Security Warnings

Since the certificates are self-signed, browsers will show a security warning. You can:

1. Click "Advanced" and then "Proceed to localhost (unsafe)" in Chrome
2. Add a security exception in Firefox
3. For a better development experience, you can install the certificate in your system's trust store

## Production Deployment with HTTPS

For production, you should use properly signed certificates from a trusted Certificate Authority (CA).

### Option 1: Using Let's Encrypt (Recommended for Production)

[Let's Encrypt](https://letsencrypt.org/) provides free, trusted SSL certificates:

1. Install Certbot: https://certbot.eff.org/
2. Generate certificates for your domain:
   ```bash
   certbot certonly --standalone -d yourdomain.com
   ```
3. Update your `.env` file with the certificate paths:
   ```
   SSL_KEY_PATH=/etc/letsencrypt/live/yourdomain.com/privkey.pem
   SSL_CERT_PATH=/etc/letsencrypt/live/yourdomain.com/fullchain.pem
   ```

### Option 2: Using a Reverse Proxy (Nginx/Apache)

For production deployments, it's common to use a reverse proxy to handle SSL:

1. Run CuraLink on HTTP only (port 5000)
2. Configure Nginx/Apache as a reverse proxy with SSL termination
3. The proxy handles HTTPS and forwards requests to your application

Example Nginx configuration:
```nginx
server {
    listen 443 ssl;
    server_name yourdomain.com;

    ssl_certificate /etc/letsencrypt/live/yourdomain.com/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/yourdomain.com/privkey.pem;

    location / {
        proxy_pass http://localhost:5000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }
}

server {
    listen 80;
    server_name yourdomain.com;
    return 301 https://$host$request_uri;
}
```

### Option 3: Cloud Provider SSL

If deploying to a cloud provider like Heroku, Render, or Google Cloud Run, they often provide SSL certificates automatically:

1. Configure your application to detect the `X-Forwarded-Proto` header
2. The application will use this to determine if the request came through HTTPS

## WebSocket Secure (WSS) Support

The application automatically upgrades WebSocket connections to WSS when HTTPS is used:

- WS: ws://localhost:5000/ws (HTTP)
- WSS: wss://localhost:5443/ws (HTTPS)

## Environment Variables for HTTPS

Configure HTTPS using the following environment variables in your `.env` file:

```
USE_HTTPS=true
HTTPS_PORT=5443
SSL_KEY_PATH=../ssl/key.pem
SSL_CERT_PATH=../ssl/cert.pem
```

## Troubleshooting

### Certificate Issues

If you encounter certificate issues:

1. Verify the certificate paths in your `.env` file
2. Ensure the application has read permissions for the certificate files
3. Check certificate expiration dates

### Connection Refused

If you get "Connection Refused" errors:

1. Verify the HTTPS port is not blocked by a firewall
2. Check if another application is using the same port
3. Ensure the server is properly binding to the specified port

### Mixed Content Warnings

If you see mixed content warnings in the browser:

1. Ensure all resources (images, scripts, etc.) are loaded via HTTPS
2. Update any hardcoded HTTP URLs in your application
3. Use relative URLs or protocol-relative URLs (//example.com/resource)