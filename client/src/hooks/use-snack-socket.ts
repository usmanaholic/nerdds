import { useEffect, useState, useCallback } from "react";
import { io, Socket } from "socket.io-client";
import type { User, SnackMessage, SnackSession } from "@shared/schema";

interface SnackSocketEvents {
  "snack:matched": (data: { session: SnackSession & { user1: User; user2: User } }) => void;
  "snack:new-message": (data: SnackMessage & { sender: User }) => void;
  "snack:user-typing": (data: { userId: number; username: string; isTyping: boolean }) => void;
  "snack:session-ended": (data: { sessionId: number; reason: string }) => void;
  "snack:extend-request": (data: { fromUserId: number; fromUsername: string; sessionId: number }) => void;
  "snack:user-joined": (data: { username: string; userId: number }) => void;
  "snack:error": (data: { message: string }) => void;
}

/**
 * Hook to manage Socket.io connection for Snack feature
 */
export function useSnackSocket(user: User | null) {
  const [socket, setSocket] = useState<Socket | null>(null);
  const [isConnected, setIsConnected] = useState(false);
  const [events] = useState<Map<string, Set<Function>>>(new Map());

  useEffect(() => {
    if (!user) return;

    const socketUrl = process.env.NODE_ENV === "production" 
      ? window.location.origin 
      : "http://localhost:5000";

    const newSocket = io(socketUrl, {
      withCredentials: true,
      autoConnect: true,
    });

    newSocket.on("connect", () => {
      console.log("Snack socket connected");
      setIsConnected(true);
      
      // Authenticate the socket
      newSocket.emit("snack:authenticate", {
        userId: user.id,
        username: user.username,
      });
    });

    newSocket.on("disconnect", () => {
      console.log("Snack socket disconnected");
      setIsConnected(false);
    });

    setSocket(newSocket);

    return () => {
      newSocket.close();
    };
  }, [user?.id]);

  // Generic event listener
  const on = useCallback(<K extends keyof SnackSocketEvents>(
    event: K,
    callback: SnackSocketEvents[K]
  ) => {
    if (!socket) return;

    socket.on(event, callback as any);

    // Track event listeners for cleanup
    if (!events.has(event)) {
      events.set(event, new Set());
    }
    events.get(event)!.add(callback);

    return () => {
      socket.off(event, callback as any);
      events.get(event)?.delete(callback);
    };
  }, [socket, events]);

  // Generic event emitter
  const emit = useCallback((event: string, data: any) => {
    if (!socket || !isConnected) {
      console.warn("Socket not connected, cannot emit:", event);
      return;
    }
    socket.emit(event, data);
  }, [socket, isConnected]);

  // Join a snack session
  const joinSession = useCallback((sessionId: number) => {
    emit("snack:join-session", { sessionId });
  }, [emit]);

  // Send a message
  const sendMessage = useCallback((sessionId: number, content: string) => {
    emit("snack:send-message", { sessionId, content });
  }, [emit]);

  // Send typing indicator
  const sendTyping = useCallback((sessionId: number, isTyping: boolean) => {
    emit("snack:typing", { sessionId, isTyping });
  }, [emit]);

  // Request session extension
  const requestExtend = useCallback((sessionId: number) => {
    emit("snack:request-extend", { sessionId });
  }, [emit]);

  // End session
  const endSession = useCallback((sessionId: number) => {
    emit("snack:end-session", { sessionId });
  }, [emit]);

  // Poll for match
  const pollMatch = useCallback((requestId: number) => {
    emit("snack:poll-match", { requestId });
  }, [emit]);

  return {
    socket,
    isConnected,
    on,
    emit,
    joinSession,
    sendMessage,
    sendTyping,
    requestExtend,
    endSession,
    pollMatch,
  };
}
