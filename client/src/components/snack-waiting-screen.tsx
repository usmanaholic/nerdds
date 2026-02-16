import { useEffect, useState } from "react";
import { useCancelSnackRequest } from "@/hooks/use-snack";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Loader2 } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import type { SnackRequest } from "@shared/schema";

interface WaitingScreenProps {
  request: SnackRequest;
  onCancel?: () => void;
}

export function WaitingScreen({ request, onCancel }: WaitingScreenProps) {
  const { toast } = useToast();
  const cancelRequest = useCancelSnackRequest();
  const [dots, setDots] = useState(".");

  useEffect(() => {
    const interval = setInterval(() => {
      setDots((prev) => (prev.length >= 3 ? "." : prev + "."));
    }, 500);

    return () => clearInterval(interval);
  }, []);

  const handleCancel = async () => {
    try {
      await cancelRequest.mutateAsync(request.id);
      toast({
        title: "Request cancelled",
        description: "Your snack request has been cancelled",
      });
      onCancel?.();
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to cancel request",
        variant: "destructive",
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
    <div className="flex items-center justify-center min-h-[60vh]">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <div className="flex justify-center mb-4">
            <div className="relative">
              <Loader2 className="h-16 w-16 animate-spin text-primary" />
              <div className="absolute inset-0 flex items-center justify-center">
                <span className="text-3xl">{getTypeEmoji(request.snackType)}</span>
              </div>
            </div>
          </div>
          <CardTitle>Finding your match{dots}</CardTitle>
          <CardDescription>
            We're looking for someone who wants to {request.snackType} with you
          </CardDescription>
        </CardHeader>

        <CardContent className="space-y-4">
          <div className="bg-muted rounded-lg p-4 space-y-2">
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">Type:</span>
              <span className="font-medium capitalize">{request.snackType}</span>
            </div>
            {request.topic && (
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Topic:</span>
                <span className="font-medium">{request.topic}</span>
              </div>
            )}
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">Duration:</span>
              <span className="font-medium">{request.duration} minutes</span>
            </div>
            {request.location && (
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Location:</span>
                <span className="font-medium">{request.location}</span>
              </div>
            )}
            {request.tags && request.tags.length > 0 && (
              <div className="text-sm">
                <span className="text-muted-foreground">Tags:</span>
                <div className="flex flex-wrap gap-1 mt-1">
                  {request.tags.map((tag, index) => (
                    <span
                      key={index}
                      className="px-2 py-0.5 bg-primary/10 text-primary rounded-full text-xs"
                    >
                      {tag}
                    </span>
                  ))}
                </div>
              </div>
            )}
          </div>

          <div className="text-center text-sm text-muted-foreground">
            This might take a minute. We're finding someone perfect for you!
          </div>

          <Button
            variant="outline"
            className="w-full"
            onClick={handleCancel}
            disabled={cancelRequest.isPending}
          >
            {cancelRequest.isPending ? "Cancelling..." : "Cancel Request"}
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}
