import { Server as SocketIOServer } from "socket.io";
import type { Server } from "http";
import { storage } from "./storage";
import { attemptMatch, endSnackSession } from "./snack-matching";

interface SocketUser {
  userId: number;
  username: string;
}

interface SnackSocketData {
  user?: SocketUser;
}

/**
 * Setup Socket.io for real-time Snack features
 */
export function setupSnackSocket(httpServer: Server): SocketIOServer {
  const io = new SocketIOServer<
    any,
    any,
    any,
    SnackSocketData
  >(httpServer, {
    cors: {
      origin: process.env.NODE_ENV === "production" 
        ? process.env.CLIENT_URL || false 
        : "http://localhost:5000",
      credentials: true,
    },
  });

  // Track which socket is associated with which user
  const userSockets = new Map<number, string>(); // userId -> socketId

  io.on("connection", (socket) => {
    console.log("Socket connected:", socket.id);

    // Authenticate socket connection
    socket.on("snack:authenticate", (data: { userId: number; username: string }) => {
      socket.data.user = {
        userId: data.userId,
        username: data.username,
      };
      userSockets.set(data.userId, socket.id);
      console.log(`User ${data.username} authenticated on socket ${socket.id}`);
    });

    // Join a snack session room
    socket.on("snack:join-session", async (data: { sessionId: number }) => {
      if (!socket.data.user) {
        socket.emit("snack:error", { message: "Not authenticated" });
        return;
      }

      try {
        const session = await storage.getSnackSession(data.sessionId);
        
        if (!session) {
          socket.emit("snack:error", { message: "Session not found" });
          return;
        }

        // Verify user is part of this session
        if (session.user1Id !== socket.data.user.userId && 
            session.user2Id !== socket.data.user.userId) {
          socket.emit("snack:error", { message: "Access denied" });
          return;
        }

        socket.join(`session:${data.sessionId}`);
        console.log(`User ${socket.data.user.username} joined session ${data.sessionId}`);

        // Notify the other user
        const otherUserId = session.user1Id === socket.data.user.userId 
          ? session.user2Id 
          : session.user1Id;
        
        const otherSocketId = userSockets.get(otherUserId);
        if (otherSocketId) {
          io.to(otherSocketId).emit("snack:user-joined", {
            username: socket.data.user.username,
            userId: socket.data.user.userId,
          });
        }
      } catch (error) {
        console.error("Error joining session:", error);
        socket.emit("snack:error", { message: "Failed to join session" });
      }
    });

    // Send a message in a snack session
    socket.on("snack:send-message", async (data: { 
      sessionId: number; 
      content: string;
    }) => {
      if (!socket.data.user) {
        socket.emit("snack:error", { message: "Not authenticated" });
        return;
      }

      try {
        const message = await storage.createSnackMessage({
          sessionId: data.sessionId,
          senderId: socket.data.user.userId,
          content: data.content,
        });

        // Get sender info
        const sender = await storage.getUser(socket.data.user.userId);

        // Broadcast to session room
        io.to(`session:${data.sessionId}`).emit("snack:new-message", {
          ...message,
          sender,
        });
      } catch (error) {
        console.error("Error sending message:", error);
        socket.emit("snack:error", { message: "Failed to send message" });
      }
    });

    // Typing indicator
    socket.on("snack:typing", (data: { sessionId: number; isTyping: boolean }) => {
      if (!socket.data.user) return;

      socket.to(`session:${data.sessionId}`).emit("snack:user-typing", {
        userId: socket.data.user.userId,
        username: socket.data.user.username,
        isTyping: data.isTyping,
      });
    });

    // Request to extend session
    socket.on("snack:request-extend", async (data: { sessionId: number }) => {
      if (!socket.data.user) {
        socket.emit("snack:error", { message: "Not authenticated" });
        return;
      }

      try {
        const session = await storage.getSnackSession(data.sessionId);
        
        if (!session) {
          socket.emit("snack:error", { message: "Session not found" });
          return;
        }

        // Notify the other user
        const otherUserId = session.user1Id === socket.data.user.userId 
          ? session.user2Id 
          : session.user1Id;
        
        const otherSocketId = userSockets.get(otherUserId);
        if (otherSocketId) {
          io.to(otherSocketId).emit("snack:extend-request", {
            fromUserId: socket.data.user.userId,
            fromUsername: socket.data.user.username,
            sessionId: data.sessionId,
          });
        }
      } catch (error) {
        console.error("Error requesting extend:", error);
        socket.emit("snack:error", { message: "Failed to request extension" });
      }
    });

    // Session ended (auto-expire or manual end)
    socket.on("snack:end-session", async (data: { sessionId: number }) => {
      if (!socket.data.user) {
        socket.emit("snack:error", { message: "Not authenticated" });
        return;
      }

      try {
        const success = await endSnackSession(data.sessionId);
        
        if (success) {
          // Notify everyone in the session
          io.to(`session:${data.sessionId}`).emit("snack:session-ended", {
            sessionId: data.sessionId,
            reason: "completed",
          });
        }
      } catch (error) {
        console.error("Error ending session:", error);
      }
    });

    // Check for match (for users in waiting queue)
    socket.on("snack:poll-match", async (data: { requestId: number }) => {
      if (!socket.data.user) return;

      try {
        const request = await storage.getSnackRequest(data.requestId);
        
        if (!request) return;

        if (request.status === "matched") {
          // Find the session
          const session = await storage.getMyActiveSnackSession(socket.data.user.userId);
          
          if (session) {
            socket.emit("snack:matched", { session });
          }
        }
      } catch (error) {
        console.error("Error polling match:", error);
      }
    });

    // Disconnect
    socket.on("disconnect", () => {
      if (socket.data.user) {
        userSockets.delete(socket.data.user.userId);
        console.log(`User ${socket.data.user.username} disconnected`);
      }
    });
  });

  // Background job: Check for expired sessions every 30 seconds
  setInterval(async () => {
    try {
      const now = new Date();
      
      // This is a simple check - in production, use a proper job queue
      // For MVP, we'll just emit events to active sockets
      // The frontend will handle the actual expiration check
      
      // You could add database query here to find expired sessions
      // and emit expiration events
    } catch (error) {
      console.error("Error in session expiry check:", error);
    }
  }, 30000);

  return io;
}
