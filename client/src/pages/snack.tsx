import { useState, useEffect } from "react";
import { useAuth } from "@/hooks/use-auth";
import { useSnackMatchStatus } from "@/hooks/use-snack";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { CreateSnackDialog } from "@/components/create-snack-dialog";
import { WaitingScreen } from "@/components/snack-waiting-screen";
import { ActiveSnackSession } from "@/components/snack-active-session";
import { SnackSummaryModal } from "@/components/snack-summary-modal";
import { Sparkles, Users, Clock, Star } from "lucide-react";

const SNACK_TYPES = [
  { value: "study", label: "Study", emoji: "📚", desc: "Find a study buddy" },
  { value: "chill", label: "Chill", emoji: "😌", desc: "Casual hangout" },
  { value: "debate", label: "Debate", emoji: "💬", desc: "Discuss ideas" },
  { value: "game", label: "Game", emoji: "🎮", desc: "Play together" },
  { value: "activity", label: "Activity", emoji: "⚡", desc: "Do something" },
  { value: "campus", label: "Campus", emoji: "🏫", desc: "Explore campus" },
];

export default function SnackPage() {
  const { user } = useAuth();
  const { data: matchStatus, refetch } = useSnackMatchStatus();
  const [showCreateDialog, setShowCreateDialog] = useState(false);
  const [showSummaryModal, setShowSummaryModal] = useState(false);
  const [completedSession, setCompletedSession] = useState<any>(null);

  useEffect(() => {
    // Check for completed sessions
    if (matchStatus?.session && matchStatus.session.status === "ended") {
      setCompletedSession(matchStatus.session);
      setShowSummaryModal(true);
    }
  }, [matchStatus?.session]);

  const handleSessionEnd = () => {
    refetch();
    if (matchStatus?.session) {
      setCompletedSession(matchStatus.session);
      setShowSummaryModal(true);
    }
  };

  // If user has an active session, show the session view
  if (matchStatus?.hasActiveSession && matchStatus.session) {
    return (
      <div className="container mx-auto py-6 px-4">
        <ActiveSnackSession
          session={matchStatus.session}
          onSessionEnd={handleSessionEnd}
        />
        {completedSession && (
          <SnackSummaryModal
            open={showSummaryModal}
            onOpenChange={setShowSummaryModal}
            session={completedSession}
            otherUser={
              user?.id === completedSession.user1Id
                ? completedSession.user2
                : completedSession.user1
            }
            currentUserId={user?.id || 0}
          />
        )}
      </div>
    );
  }

  // If user has an active request, show waiting screen
  if (matchStatus?.hasActiveRequest && matchStatus.request) {
    return (
      <div className="container mx-auto py-6 px-4">
        <WaitingScreen
          request={matchStatus.request}
          onCancel={() => refetch()}
        />
      </div>
    );
  }

  // Default home screen
  return (
    <div className="container mx-auto py-6 px-4 max-w-5xl">
      {/* Hero Section */}
      <div className="text-center mb-12">
        <div className="flex justify-center mb-4">
          <div className="bg-primary/10 p-4 rounded-full">
            <Sparkles className="h-12 w-12 text-primary" />
          </div>
        </div>
        <h1 className="text-4xl font-bold mb-3">Snack</h1>
        <p className="text-xl text-muted-foreground mb-6">
          Quick, meaningful connections with fellow students
        </p>
        <Button size="lg" onClick={() => setShowCreateDialog(true)}>
          Find a Match
        </Button>
      </div>

      {/* Stats */}
      {user && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-12">
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center gap-3">
                <div className="bg-primary/10 p-3 rounded-lg">
                  <Users className="h-5 w-5 text-primary" />
                </div>
                <div>
                  <p className="text-2xl font-bold">{user.snackCount || 0}</p>
                  <p className="text-sm text-muted-foreground">Snacks</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center gap-3">
                <div className="bg-primary/10 p-3 rounded-lg">
                  <Star className="h-5 w-5 text-primary" />
                </div>
                <div>
                  <p className="text-2xl font-bold">
                    {user.snackScore || 0}
                    <span className="text-base text-muted-foreground">/5</span>
                  </p>
                  <p className="text-sm text-muted-foreground">Snack Score</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center gap-3">
                <div className="bg-primary/10 p-3 rounded-lg">
                  <Clock className="h-5 w-5 text-primary" />
                </div>
                <div>
                  <p className="text-2xl font-bold">
                    {(user.snackCount || 0) * 15}
                  </p>
                  <p className="text-sm text-muted-foreground">Minutes</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Snack Types */}
      <div className="mb-12">
        <h2 className="text-2xl font-bold mb-6">Choose Your Snack Type</h2>
        <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
          {SNACK_TYPES.map((type) => (
            <Card
              key={type.value}
              className="cursor-pointer hover:shadow-lg transition-shadow"
              onClick={() => setShowCreateDialog(true)}
            >
              <CardHeader>
                <div className="text-4xl mb-2">{type.emoji}</div>
                <CardTitle className="text-lg">{type.label}</CardTitle>
                <CardDescription>{type.desc}</CardDescription>
              </CardHeader>
            </Card>
          ))}
        </div>
      </div>

      {/* How it Works */}
      <Card>
        <CardHeader>
          <CardTitle>How Snack Works</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex gap-4">
            <div className="bg-primary/10 text-primary font-bold rounded-full h-8 w-8 flex items-center justify-center flex-shrink-0">
              1
            </div>
            <div>
              <h3 className="font-medium mb-1">Choose Your Snack</h3>
              <p className="text-sm text-muted-foreground">
                Pick a type (study, chill, debate, etc.) and set preferences
              </p>
            </div>
          </div>

          <div className="flex gap-4">
            <div className="bg-primary/10 text-primary font-bold rounded-full h-8 w-8 flex items-center justify-center flex-shrink-0">
              2
            </div>
            <div>
              <h3 className="font-medium mb-1">Get Matched</h3>
              <p className="text-sm text-muted-foreground">
                Our algorithm finds someone compatible from your campus
              </p>
            </div>
          </div>

          <div className="flex gap-4">
            <div className="bg-primary/10 text-primary font-bold rounded-full h-8 w-8 flex items-center justify-center flex-shrink-0">
              3
            </div>
            <div>
              <h3 className="font-medium mb-1">Connect & Chat</h3>
              <p className="text-sm text-muted-foreground">
                Chat for 10-30 minutes. Low pressure, time-limited fun!
              </p>
            </div>
          </div>

          <div className="flex gap-4">
            <div className="bg-primary/10 text-primary font-bold rounded-full h-8 w-8 flex items-center justify-center flex-shrink-0">
              4
            </div>
            <div>
              <h3 className="font-medium mb-1">Rate & Connect</h3>
              <p className="text-sm text-muted-foreground">
                Rate the experience and optionally add them as a friend
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      <CreateSnackDialog
        open={showCreateDialog}
        onOpenChange={setShowCreateDialog}
        onMatchFound={(session) => {
          refetch();
        }}
      />
    </div>
  );
}
