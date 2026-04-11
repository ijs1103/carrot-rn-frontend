import { DurableObject } from "cloudflare:workers";
import * as jose from 'jose';

export interface Env {
  CHAT_ROOM: DurableObjectNamespace;
  FASTAPI_URL: string;
  JWT_SECRET_KEY: string;
  CF_WORKER_SECRET: string;
}

export class ChatRoom extends DurableObject {
  env: Env;

  constructor(ctx: DurableObjectState, env: Env) {
    super(ctx, env);
    this.env = env;
  }

  async fetch(request: Request): Promise<Response> {
    const upgradeHeader = request.headers.get('Upgrade');
    if (!upgradeHeader || upgradeHeader !== 'websocket') {
      return new Response('Expected Upgrade: websocket', { status: 426 });
    }

    const { 0: client, 1: server } = new WebSocketPair();

    // Use Hibernation API (required when extending DurableObject)
    this.ctx.acceptWebSocket(server);

    return new Response(null, {
      status: 101,
      webSocket: client,
    });
  }

  async webSocketMessage(ws: WebSocket, message: ArrayBuffer | string) {
    try {
      const raw = typeof message === 'string' ? message : new TextDecoder().decode(message);
      const msgData = JSON.parse(raw);
      const { roomId, userId, payload, user } = msgData;

      const broadcastMsg = JSON.stringify({
        id: Date.now(),
        payload: payload,
        created_at: new Date().toISOString(),
        userId: userId,
        chatRoomId: roomId,
        user: user || { username: 'Unknown', avatar: '' }
      });

      // Broadcast to all OTHER connected WebSockets via Hibernation API
      const sockets = this.ctx.getWebSockets();
      for (const socket of sockets) {
        if (socket !== ws) {
          try {
            socket.send(broadcastMsg);
          } catch (e) {
            // socket might be closing, ignore
          }
        }
      }

      // Sync to backend DB
      if (roomId && payload) {
        this.ctx.waitUntil(
          fetch(`${this.env.FASTAPI_URL}/api/v1/chats/internal/messages`, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              'x-internal-secret': this.env.CF_WORKER_SECRET || 'super-secret-internal-key'
            },
            body: JSON.stringify({
              room_id: roomId,
              user_id: userId,
              payload: payload
            })
          }).then(res => {
            if (!res.ok) console.error("Webhook non-ok:", res.status);
          }).catch(err => console.error("Webhook failed:", err.message))
        );
      }
    } catch (e) {
      console.error("Message handling error:", e);
    }
  }

  async webSocketClose(ws: WebSocket, code: number, reason: string, wasClean: boolean) {
    // Connection closed normally, nothing to clean up with Hibernation API
    console.log(`WS closed: code=${code} reason=${reason} clean=${wasClean}`);
  }

  async webSocketError(ws: WebSocket, error: unknown) {
    console.error("WS error in DO:", error);
  }
}

export default {
  async fetch(request: Request, env: Env, ctx: ExecutionContext): Promise<Response> {
    const url = new URL(request.url);

    if (url.pathname.startsWith('/ws/rooms/')) {
      const parts = url.pathname.split('/ws/rooms/');
      const roomId = parts[1];
      const ticket = url.searchParams.get('ticket');

      if (!ticket) {
        return new Response("Missing ticket", { status: 401 });
      }

      try {
        const secret = new TextEncoder().encode(env.JWT_SECRET_KEY);
        const { payload } = await jose.jwtVerify(ticket, secret);
        const sub = payload.sub as string;
        if (!sub.includes(roomId)) {
          return new Response("Invalid ticket for this room", { status: 403 });
        }
      } catch (err) {
        console.error("JWT verification failed:", err);
        return new Response("Invalid or expired ticket", { status: 401 });
      }

      const id = env.CHAT_ROOM.idFromName(roomId);
      const stub = env.CHAT_ROOM.get(id);

      // Forward the raw request to the Durable Object
      return stub.fetch(request);
    }

    if (url.pathname === '/') {
      return new Response("Chat Worker is running", { status: 200 });
    }

    return new Response("Not found", { status: 404 });
  }
};
