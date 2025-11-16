import { NextRequest } from 'next/server';
import { JWTService } from '@/core/auth/jwt';
import { UserService } from '@/core/data/user-service';
import { lmdb } from '@/core/data/lmdb';
import { User } from '@/shared/types/database';
import { SSEBroadcast } from '@/core/sse/broadcast';

// Helper function to verify token and get user
async function verifyToken(token: string): Promise<User | null> {
  const payload = JWTService.verifyToken(token);
  if (!payload) return null;
  
  const userService = new UserService();
  return await userService.getUserById(payload.userId);
}

export async function GET(request: NextRequest) {
  try {
    // Get token from cookie (HttpOnly cookie set by login)
    const token = request.cookies.get('auth-token')?.value;
    if (!token) {
      return new Response('Unauthorized', { status: 401 });
    }

    const user = await verifyToken(token);
    if (!user) {
      return new Response('Invalid token', { status: 401 });
    }

    // Create SSE stream
    const stream = new ReadableStream({
      start(controller) {
        console.log(`SSE connection started for user ${user.id}`);
        
        // Add connection to broadcast system
        SSEBroadcast.addConnection(user.id, controller);

        // Send initial notification count
        const sendInitialUpdate = async () => {
          try {
            // Get unread notifications count
            const notifications = await lmdb.query('notifications',
              (notif: unknown) => {
                const notification = notif as { userId: string; isRead: boolean };
                return notification.userId === user.id && !notification.isRead;
              }
            );
            
            const unreadCount = notifications.length;
            
            // Send SSE message
            const data = JSON.stringify({
              type: 'notification_update',
              unreadCount,
              timestamp: new Date().toISOString()
            });
            
            controller.enqueue(new TextEncoder().encode(`data: ${data}\n\n`));
            console.log(`Initial SSE update sent to user ${user.id}. Unread count: ${unreadCount}`);
          } catch (error) {
            console.error('Error sending initial notification update:', error);
          }
        };

        // Send initial count
        sendInitialUpdate();

        // Cleanup function
        const cleanup = () => {
          console.log(`SSE connection cleanup for user ${user.id}`);
          SSEBroadcast.removeConnection(user.id, controller);
          try {
            controller.close();
          } catch (error) {
            console.error('Error closing SSE controller:', error);
          }
        };

        // Store cleanup function for later use
        (request as unknown as { cleanup: () => void }).cleanup = cleanup;

        // Handle client disconnect
        request.signal?.addEventListener('abort', cleanup);
      }
    });

    return new Response(stream, {
      headers: {
        'Content-Type': 'text/event-stream',
        'Cache-Control': 'no-cache',
        'Connection': 'keep-alive',
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'GET',
        'Access-Control-Allow-Headers': 'Cache-Control'
      }
    });
  } catch (error) {
    console.error('Error in SSE endpoint:', error);
    return new Response('Internal Server Error', { status: 500 });
  }
}