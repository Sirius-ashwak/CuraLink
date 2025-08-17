import { WebSocket } from 'ws';

// Define a custom interface for our extended WebSocket
interface AuthenticatedWebSocket extends WebSocket {
  userId?: string;
  role?: string;
}

// Function to handle WebSocket messages with proper typing
function handleWebSocketMessage(ws: WebSocket, data: WebSocket.Data): void {
  try {
    // Convert data to string regardless of type
    let messageStr: string;
    
    if (typeof data === 'string') {
      messageStr = data;
    } else if (data instanceof Buffer) {
      messageStr = data.toString();
    } else if (data instanceof ArrayBuffer) {
      messageStr = Buffer.from(data).toString();
    } else if (Array.isArray(data)) {
      // For array of buffers, convert each to string and join
      messageStr = Buffer.concat(data.map(chunk => 
        chunk instanceof Buffer ? chunk : Buffer.from(chunk)
      )).toString();
    } else {
      // For Uint8Array
      messageStr = Buffer.from(data).toString();
    }
    
    const parsedData = JSON.parse(messageStr);
    console.log('Received message:', parsedData);
    
    // Handle authentication
    if (parsedData.type === 'auth') {
      const authWs = ws as AuthenticatedWebSocket;
      authWs.userId = parsedData.userId;
      authWs.role = parsedData.role;
    }
  } catch (error: unknown) {
    console.error('Error processing WebSocket message:', error);
  }
}

export { AuthenticatedWebSocket, handleWebSocketMessage };