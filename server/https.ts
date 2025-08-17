import fs from 'fs';
import path from 'path';
import https from 'https';
import { Express } from 'express';
import { Server } from 'http';
import { WebSocketServer, WebSocket } from 'ws';
import { IncomingMessage } from 'http';
import { AuthenticatedWebSocket, handleWebSocketMessage } from './websocket-types';
import { fileURLToPath } from 'url';

// Get __dirname equivalent for ES modules
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// SSL certificate paths
const SSL_KEY_PATH = process.env.SSL_KEY_PATH || path.join(__dirname, '../ssl/key.pem');
const SSL_CERT_PATH = process.env.SSL_CERT_PATH || path.join(__dirname, '../ssl/cert.pem');
const HTTPS_PORT = parseInt(process.env.HTTPS_PORT || '5443', 10);

/**
 * Check if SSL certificates exist
 */
export function sslCertificatesExist(): boolean {
  try {
    return fs.existsSync(SSL_KEY_PATH) && fs.existsSync(SSL_CERT_PATH);
  } catch (error) {
    console.error('Error checking SSL certificates:', error);
    return false;
  }
}

/**
 * Create HTTPS server with SSL certificates
 */
export function createHttpsServer(app: Express, httpServer: Server): { httpsServer: https.Server, wss: WebSocketServer } {
  try {
    // Check if SSL certificates exist
    if (!sslCertificatesExist()) {
      console.warn('SSL certificates not found. HTTPS server will not start.');
      console.warn(`Expected certificates at: ${SSL_KEY_PATH} and ${SSL_CERT_PATH}`);
      throw new Error('SSL certificates not found');
    }

    // Create HTTPS server with SSL certificates
    const httpsOptions = {
      key: fs.readFileSync(SSL_KEY_PATH),
      cert: fs.readFileSync(SSL_CERT_PATH)
    };

    console.log('Creating HTTPS server with SSL certificates');
    const httpsServer = https.createServer(httpsOptions, app);

    // Create WebSocket server on HTTPS server
    const wss = new WebSocketServer({ server: httpsServer });

    // Handle WebSocket connections
    wss.on('connection', (ws: WebSocket, req: IncomingMessage) => {
      console.log('WebSocket client connected');

      // Handle incoming messages using our type-safe handler
      ws.on('message', (data: WebSocket.Data) => {
        handleWebSocketMessage(ws, data);
      });

      ws.on('close', () => {
        console.log('WebSocket client disconnected');
      });

      ws.on('error', (error: Error) => {
        console.error('WebSocket error:', error.message);
      });
    });

    return { httpsServer, wss };
  } catch (error: unknown) {
    console.error('Error creating HTTPS server:', error);
    // Return a dummy WebSocket server that does nothing
    const dummyWss = {
      clients: new Set<WebSocket>(),
      on: (_event: string, _callback: (...args: any[]) => void) => {}
    } as unknown as WebSocketServer;
    return { httpsServer: httpServer as unknown as https.Server, wss: dummyWss };
  }
}

/**
 * Start HTTPS server
 */
export function startHttpsServer(httpsServer: https.Server): void {
  httpsServer.listen(HTTPS_PORT, () => {
    console.log(`HTTPS server running on port ${HTTPS_PORT}`);
    console.log(`Access your secure app at https://localhost:${HTTPS_PORT}`);
  });
}