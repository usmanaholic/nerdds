import { useEffect, useState, useRef } from "react";
import { useAuth } from "@/hooks/use-auth";
import { useSnackSocket } from "@/hooks/use-snack-socket";
import { useSnackMessages, useSendSnackMessage, useExtendSnackSession } from "@/hooks/use-snack";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Clock, Send, UserPlus, Flag, Plus } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import type { SnackSession, User } from "@shared/schema";

interface ActiveSnackSessionProps {
  session: SnackSession & { user1: User; user2: User };
  onSessionEnd?: () => void;
}

export function ActiveSnackSession({ session, onSessionEnd }: ActiveSnackSessionProps) {
  const { user } = useAuth();
  const { toast } = useToast();
  const snackSocket = useSnackSocket(user || null);
  const { data: messages = [], refetch: refetchMessages } = useSnackMessages(session.id);
  const sendMessage = useSendSnackMessage();
  const extendSession = useExtendSnackSession();

  const [messageInput, setMessageInput] = useState("");
  const [timeRemaining, setTimeRemaining] = useState<number>(0);
  const [otherUserTyping, setOtherUserTyping] = useState(false);
  const [extendRequested, setExtendRequested] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const typingTimeoutRef = useRef<NodeJS.Timeout>();

  const otherUser = user?.id === session.user1Id ? session.user2 : session.user1;

  // Calculate time remaining
  useEffect(() => {
    const calculateTime = () => {
      const now = new Date().getTime();
      const expires = new Date(session.expiresAt).getTime();
      const diff = Math.max(0, Math.floor((expires - now) / 1000));
      setTimeRemaining(diff);

      if (diff === 0) {
        onSessionEnd?.();
      }
    };

    calculateTime();
    const interval = setInterval(calculateTime, 1000);

    return () => clearInterval(interval);
  }, [session.expiresAt, onSessionEnd]);

  // Format time remaining
  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, "0")}`;
  };

  // Join session on mount
  useEffect(() => {
    if (snackSocket.isConnected) {
      snackSocket.joinSession(session.id);
    }
  }, [snackSocket.isConnected, session.id]);

  // Listen for socket events
  useEffect(() => {
    if (!snackSocket.socket) return;

    const unsubscribeMessage = snackSocket.on("snack:new-message", (data) => {
      refetchMessages();
    });

    const unsubscribeTyping = snackSocket.on("snack:user-typing", (data) => {
      setOtherUserTyping(data.isTyping);
    });

    const unsubscribeEnded = snackSocket.on("snack:session-ended", () => {
      toast({
        title: "Session ended",
        description: "Your snack session has ended",
      });
      onSessionEnd?.();
    });

    const unsubscribeExtendRequest = snackSocket.on("snack:extend-request", () => {
      toast({
        title: "Extension request",
        description: `${otherUser.username} wants to extend the session by 10 minutes`,
        action: (
          <Button size="sm" onClick={handleExtend}>
            Accept
          </Button>
        ),
      });
    });

    return () => {
      unsubscribeMessage?.();
      unsubscribeTyping?.();
      unsubscribeEnded?.();
      unsubscribeExtendRequest?.();
    };
  }, [snackSocket.socket, otherUser.username]);

  // Auto-scroll messages
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const handleSendMessage = async () => {
    if (!messageInput.trim()) return;

    try {
      await sendMessage.mutateAsync({
        sessionId: session.id,
        content: messageInput.trim(),
      });
      setMessageInput("");
      snackSocket.sendTyping(session.id, false);
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to send message",
        variant: "destructive",
      });
    }
  };

  const handleTyping = (value: string) => {
    setMessageInput(value);

    if (typingTimeoutRef.current) {
      clearTimeout(typingTimeoutRef.current);
    }

    if (value.trim()) {
      snackSocket.sendTyping(session.id, true);
      typingTimeoutRef.current = setTimeout(() => {
        snackSocket.sendTyping(session.id, false);
      }, 2000);
    } else {
      snackSocket.sendTyping(session.id, false);
    }
  };

  const handleExtend = async () => {
    if (extendRequested) {
      try {
        await extendSession.mutateAsync(session.id);
        toast({
          title: "Session extended! ⏰",
          description: "Your session has been extended by 10 minutes",
        });
        setExtendRequested(false);
      } catch (error) {
        toast({
          title: "Error",
          description: "Failed to extend session",
          variant: "destructive",
        });
      }
    } else {
      snackSocket.requestExtend(session.id);
      setExtendRequested(true);
      toast({
        title: "Request sent",
        description: "Waiting for the other person to accept...",
      });
    }
  };

  const getTypeEmoji = (type: string) => {
    const emojis: Record<string, string> = {
      study: "📚",
      chill: "😌",
      debate: "💬",
      game: "🎮",
      activity: "⚡",
      campus: "🏫",
    };
    return emojis[type] || "✨";
  };

  return (
    <div className="flex flex-col h-[calc(100vh-8rem)]">
      <Card className="flex-1 flex flex-col">
        {/* Header */}
        <CardHeader className="flex-none border-b">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Avatar>
                <AvatarImage src={otherUser.profileImage || undefined} />
                <AvatarFallback>
                  {otherUser.username.substring(0, 2).toUpperCase()}
                </AvatarFallback>
              </Avatar>
              <div>
                <CardTitle className="text-lg">{otherUser.username}</CardTitle>
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <span>{getTypeEmoji(session.snackType)}</span>
                  <span className="capitalize">{session.snackType}</span>
                  {session.topic && <span>• {session.topic}</span>}
                </div>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <Badge
                variant={timeRemaining < 120 ? "destructive" : "default"}
                className="text-base px-3 py-1"
              >
                <Clock className="h-4 w-4 mr-1" />
                {formatTime(timeRemaining)}
              </Badge>
            </div>
          </div>
        </CardHeader>

        {/* Messages */}
        <CardContent className="flex-1 overflow-y-auto p-4 space-y-3">
          {messages.length === 0 ? (
            <div className="flex items-center justify-center h-full text-muted-foreground text-sm">
              Say hi to start the conversation! 👋
            </div>
          ) : (
            messages.map((msg: any) => {
              const isMe = msg.senderId === user?.id;
              return (
                <div
                  key={msg.id}
                  className={`flex ${isMe ? "justify-end" : "justify-start"}`}
                >
                  <div
                    className={`max-w-[70%] rounded-lg px-4 py-2 ${
                      isMe
                        ? "bg-primary text-primary-foreground"
                        : "bg-muted"
                    }`}
                  >
                    <p className="text-sm">{msg.content}</p>
                    <span className="text-xs opacity-70">
                      {new Date(msg.createdAt).toLocaleTimeString([], {
                        hour: "2-digit",
                        minute: "2-digit",
                      })}
                    </span>
                  </div>
                </div>
              );
            })
          )}
          {otherUserTyping && (
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <span>{otherUser.username} is typing</span>
              <span className="animate-pulse">...</span>
            </div>
          )}
          <div ref={messagesEndRef} />
        </CardContent>

        {/* Input */}
        <div className="flex-none border-t p-4">
          <div className="flex gap-2 mb-3">
            <Button
              variant="outline"
              size="sm"
              onClick={handleExtend}
              disabled={extendRequested || extendSession.isPending}
            >
              <Plus className="h-4 w-4 mr-1" />
              {extendRequested ? "Requested" : "Extend 10min"}
            </Button>
            <Button variant="outline" size="sm">
              <UserPlus className="h-4 w-4 mr-1" />
              Add Friend
            </Button>
            <Button variant="outline" size="sm" className="ml-auto">
              <Flag className="h-4 w-4 mr-1" />
              Report
            </Button>
          </div>

          <div className="flex gap-2">
            <Input
              placeholder="Type a message..."
              value={messageInput}
              onChange={(e) => handleTyping(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter" && !e.shiftKey) {
                  e.preventDefault();
                  handleSendMessage();
                }
              }}
              disabled={session.status === "ended"}
            />
            <Button
              onClick={handleSendMessage}
              disabled={!messageInput.trim() || sendMessage.isPending}
            >
              <Send className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </Card>
    </div>
  );
}
