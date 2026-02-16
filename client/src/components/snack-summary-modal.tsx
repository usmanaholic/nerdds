import { useState } from "react";
import { useRateSnackSession, useReportSnackUser, useBlockSnackUser } from "@/hooks/use-snack";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Star, UserPlus, Flag, UserX } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import type { SnackSession, User } from "@shared/schema";

interface SnackSummaryModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  session: SnackSession & { user1: User; user2: User };
  otherUser: User;
  currentUserId: number;
}

export function SnackSummaryModal({
  open,
  onOpenChange,
  session,
  otherUser,
  currentUserId,
}: SnackSummaryModalProps) {
  const { toast } = useToast();
  const rateSession = useRateSnackSession();
  const reportUser = useReportSnackUser();
  const blockUser = useBlockSnackUser();

  const [rating, setRating] = useState<number>(0);
  const [hoveredRating, setHoveredRating] = useState<number>(0);
  const [showReport, setShowReport] = useState(false);
  const [reportReason, setReportReason] = useState("");

  const hasRated =
    (currentUserId === session.user1Id && session.ratingUser1 !== null) ||
    (currentUserId === session.user2Id && session.ratingUser2 !== null);

  const handleRate = async (selectedRating: number) => {
    try {
      await rateSession.mutateAsync({
        sessionId: session.id,
        rating: selectedRating,
      });
      setRating(selectedRating);
      toast({
        title: "Thanks for rating! ⭐",
        description: "Your feedback helps improve the community",
      });
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to submit rating",
        variant: "destructive",
      });
    }
  };

  const handleReport = async () => {
    if (!reportReason.trim()) {
      toast({
        title: "Error",
        description: "Please provide a reason for the report",
        variant: "destructive",
      });
      return;
    }

    try {
      await reportUser.mutateAsync({
        reportedId: otherUser.id,
        sessionId: session.id,
        reason: "inappropriate_behavior",
        description: reportReason,
      });
      toast({
        title: "Report submitted",
        description: "Thank you for helping keep our community safe",
      });
      setShowReport(false);
      setReportReason("");
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to submit report",
        variant: "destructive",
      });
    }
  };

  const handleBlock = async () => {
    try {
      await blockUser.mutateAsync(otherUser.id);
      toast({
        title: "User blocked",
        description: "You won't be matched with this user again",
      });
      onOpenChange(false);
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to block user",
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
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle className="text-center text-2xl">
            {getTypeEmoji(session.snackType)} Snack Complete!
          </DialogTitle>
          <DialogDescription className="text-center">
            You spent {session.duration} minutes with {otherUser.username}
          </DialogDescription>
        </DialogHeader>

        {!showReport ? (
          <div className="space-y-6 py-4">
            {/* Rating */}
            {!hasRated && (
              <div className="space-y-3">
                <h3 className="text-center font-medium">How was your experience?</h3>
                <div className="flex justify-center gap-2">
                  {[1, 2, 3, 4, 5].map((star) => (
                    <button
                      key={star}
                      type="button"
                      onClick={() => handleRate(star)}
                      onMouseEnter={() => setHoveredRating(star)}
                      onMouseLeave={() => setHoveredRating(0)}
                      className="transition-transform hover:scale-110"
                      disabled={rateSession.isPending}
                    >
                      <Star
                        className={`h-10 w-10 ${
                          star <= (hoveredRating || rating)
                            ? "fill-yellow-400 text-yellow-400"
                            : "text-gray-300"
                        }`}
                      />
                    </button>
                  ))}
                </div>
              </div>
            )}

            {hasRated && (
              <div className="text-center text-muted-foreground">
                Thanks for your rating! ⭐
              </div>
            )}

            {/* Actions */}
            <div className="space-y-2">
              <Button className="w-full" variant="default">
                <UserPlus className="h-4 w-4 mr-2" />
                Add {otherUser.username} as Friend
              </Button>
              <Button
                className="w-full"
                variant="outline"
                onClick={() => setShowReport(true)}
              >
                <Flag className="h-4 w-4 mr-2" />
                Report User
              </Button>
              <Button
                className="w-full"
                variant="outline"
                onClick={handleBlock}
                disabled={blockUser.isPending}
              >
                <UserX className="h-4 w-4 mr-2" />
                Block User
              </Button>
            </div>

            {/* Session Stats */}
            <div className="bg-muted rounded-lg p-4 space-y-2 text-sm">
              <div className="flex justify-between">
                <span className="text-muted-foreground">Type:</span>
                <span className="font-medium capitalize">{session.snackType}</span>
              </div>
              {session.topic && (
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Topic:</span>
                  <span className="font-medium">{session.topic}</span>
                </div>
              )}
              <div className="flex justify-between">
                <span className="text-muted-foreground">Duration:</span>
                <span className="font-medium">{session.duration} minutes</span>
              </div>
              {otherUser.snackScore && otherUser.snackScore > 0 && (
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Their Snack Score:</span>
                  <span className="font-medium">
                    {otherUser.snackScore}/5 ⭐
                  </span>
                </div>
              )}
            </div>
          </div>
        ) : (
          <div className="space-y-4 py-4">
            <div>
              <h3 className="font-medium mb-2">Report {otherUser.username}</h3>
              <p className="text-sm text-muted-foreground mb-4">
                Help us understand what happened. Your report will be reviewed by our team.
              </p>
              <Textarea
                placeholder="Describe the issue..."
                value={reportReason}
                onChange={(e) => setReportReason(e.target.value)}
                rows={4}
                maxLength={500}
              />
            </div>

            <div className="flex gap-2">
              <Button
                variant="outline"
                className="flex-1"
                onClick={() => setShowReport(false)}
              >
                Cancel
              </Button>
              <Button
                className="flex-1"
                onClick={handleReport}
                disabled={reportUser.isPending || !reportReason.trim()}
              >
                {reportUser.isPending ? "Submitting..." : "Submit Report"}
              </Button>
            </div>
          </div>
        )}

        {!showReport && (
          <DialogFooter>
            <Button
              variant="outline"
              className="w-full"
              onClick={() => onOpenChange(false)}
            >
              Close
            </Button>
          </DialogFooter>
        )}
      </DialogContent>
    </Dialog>
  );
}
