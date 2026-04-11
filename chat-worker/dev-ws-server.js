/**
 * Local development WebSocket server for chat.
 * Replaces wrangler dev's Durable Object WebSocket (which is unstable locally).
 * 
 * Usage:  node dev-ws-server.js
 * Runs on port 8787 (same as wrangler dev)
 */
const { WebSocketServer } = require('ws');
const http = require('http');
const crypto = require('crypto');

const PORT = 8787;
const JWT_SECRET = 'carrot_market_super_secret_key';
const FASTAPI_URL = 'http://127.0.0.1:8000';
const CF_WORKER_SECRET = 'super-secret-internal-key';

// Room -> Set<{ ws, userId }>
const rooms = new Map();

function base64UrlDecode(str) {
  str = str.replace(/-/g, '+').replace(/_/g, '/');
  while (str.length % 4) str += '=';
  return Buffer.from(str, 'base64').toString();
}

function verifyJWT(token) {
  try {
    const parts = token.split('.');
    if (parts.length !== 3) return null;
    
    const header = JSON.parse(base64UrlDecode(parts[0]));
    const payload = JSON.parse(base64UrlDecode(parts[1]));
    
    // Check expiration
    if (payload.exp && payload.exp < Math.floor(Date.now() / 1000)) {
      console.log('JWT expired');
      return null;
    }
    
    // Simple HMAC verification
    const signatureInput = parts[0] + '.' + parts[1];
    const expectedSig = crypto
      .createHmac('sha256', JWT_SECRET)
      .update(signatureInput)
      .digest('base64url');
    
    if (expectedSig !== parts[2]) {
      console.log('JWT signature mismatch');
      return null;
    }
    
    return payload;
  } catch (e) {
    console.error('JWT verify error:', e.message);
    return null;
  }
}

const server = http.createServer((req, res) => {
  res.writeHead(404);
  res.end('Not found');
});

const wss = new WebSocketServer({ noServer: true });

server.on('upgrade', (request, socket, head) => {
  const url = new URL(request.url, `http://localhost:${PORT}`);
  
  if (!url.pathname.startsWith('/ws/rooms/')) {
    socket.write('HTTP/1.1 404 Not Found\r\n\r\n');
    socket.destroy();
    return;
  }
  
  const roomId = url.pathname.split('/ws/rooms/')[1];
  const ticket = url.searchParams.get('ticket');
  const userId = url.searchParams.get('userId') || 'unknown';
  
  if (!ticket) {
    socket.write('HTTP/1.1 401 Unauthorized\r\n\r\n');
    socket.destroy();
    return;
  }
  
  const payload = verifyJWT(ticket);
  if (!payload) {
    socket.write('HTTP/1.1 401 Unauthorized\r\n\r\n');
    socket.destroy();
    return;
  }
  
  if (!payload.sub || !payload.sub.includes(roomId)) {
    socket.write('HTTP/1.1 403 Forbidden\r\n\r\n');
    socket.destroy();
    return;
  }
  
  wss.handleUpgrade(request, socket, head, (ws) => {
    wss.emit('connection', ws, request, { roomId, userId });
  });
});

wss.on('connection', (ws, request, { roomId, userId }) => {
  console.log(`[WS] User ${userId} connected to room ${roomId}`);
  
  // Add to room
  if (!rooms.has(roomId)) {
    rooms.set(roomId, new Set());
  }
  const room = rooms.get(roomId);
  const session = { ws, userId };
  room.add(session);
  
  ws.on('message', (raw) => {
    try {
      const msgData = JSON.parse(raw.toString());
      const { payload, user } = msgData;
      
      const broadcastMsg = JSON.stringify({
        id: Date.now(),
        payload: payload,
        created_at: new Date().toISOString(),
        userId: parseInt(userId),
        chatRoomId: roomId,
        user: user || { username: 'Unknown', avatar: '' }
      });
      
      // Broadcast to all OTHER sessions in this room
      for (const s of room) {
        if (s !== session && s.ws.readyState === 1) { // OPEN = 1
          s.ws.send(broadcastMsg);
        }
      }
      
      // Sync to backend
      if (payload) {
        fetch(`${FASTAPI_URL}/api/v1/chats/internal/messages`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'x-internal-secret': CF_WORKER_SECRET,
          },
          body: JSON.stringify({
            room_id: roomId,
            user_id: parseInt(userId),
            payload: payload,
          }),
        })
          .then(res => {
            if (!res.ok) console.error('[Webhook] non-ok:', res.status);
          })
          .catch(err => console.error('[Webhook] failed:', err.message));
      }
    } catch (e) {
      console.error('[WS] Message parse error:', e.message);
    }
  });
  
  ws.on('close', () => {
    console.log(`[WS] User ${userId} disconnected from room ${roomId}`);
    room.delete(session);
    if (room.size === 0) {
      rooms.delete(roomId);
    }
  });
  
  ws.on('error', (err) => {
    console.error(`[WS] Error for user ${userId}:`, err.message);
  });
});

server.listen(PORT, () => {
  console.log(`\n🥕 Chat WebSocket server running on ws://localhost:${PORT}`);
  console.log(`   Rooms endpoint: ws://localhost:${PORT}/ws/rooms/{roomId}`);
  console.log(`   Backend sync: ${FASTAPI_URL}\n`);
});
