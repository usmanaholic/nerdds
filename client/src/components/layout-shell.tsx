import { Link, useLocation } from "wouter";
import { useEffect, useMemo, useRef, useState } from "react";
import { useAuth } from "@/hooks/use-auth";
import {
  useChallenges,
  type Challenge,
  type ChallengeOption,
  type ChallengeHistory,
  type ChallengeLeaderboardEntry,
  type ChallengeQuestion,
  type ChallengePersonalityResult,
} from "../hooks/use-challenges";
import {
  Home,
  Search,
  MessageSquare,
  User,
  PlusSquare,
  LogOut,
  GraduationCap,
  ArrowLeft,
  Gamepad2,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { Toaster } from "@/components/ui/toaster";

const cadenceLabels: Record<string, string> = {
  daily: "Daily",
  weekly: "Weekly",
  monthly: "Monthly",
  exam: "Exam",
};

const challengeEmojis: Record<string, string> = {
  mood: "🔥",
  dept: "🏆",
  "this-or-that": "🗳️",
  confession: "🎯",
  stress: "📈",
  "brain-flex": "🧠",
  meme: "🥊",
  personality: "🎭",
  "rising-star": "👑",
  "hot-take": "🎤",
};

export default function LayoutShell({ children }: { children: React.ReactNode }) {
  const [location] = useLocation();
  const { user, logout } = useAuth();
  const { data: challengeData, isLoading: challengesLoading, submit } = useChallenges();
  const [activeChallengeKey, setActiveChallengeKey] = useState<string | null>(null);
  const [challengeView, setChallengeView] = useState<"list" | "detail">("list");
  const [isMobileChallengesOpen, setIsMobileChallengesOpen] = useState(false);
  const [personalityStep, setPersonalityStep] = useState(0);
  const [personalityAnswers, setPersonalityAnswers] = useState<number[]>([]);
  const brainFlexStartRef = useRef<number | null>(null);

  const navItems = [
    { icon: Home, label: "Home", href: user?.universityId ? `/u/${user.universityId}` : "/" },
    { icon: Search, label: "Explore", href: "/explore" },
    { icon: MessageSquare, label: "Messages", href: "/messages" },
    { icon: User, label: "Profile", href: user ? `/profile/${user.username}` : "/auth" },
  ];

  if (location.startsWith("/auth")) {
    return <>{children}</>;
  }

  const challengeCards: Challenge[] = challengeData?.challenges ?? [];

  useEffect(() => {
    if (!activeChallengeKey && challengeCards.length > 0) {
      setActiveChallengeKey(challengeCards[0].key);
    }
  }, [activeChallengeKey, challengeCards]);

  useEffect(() => {
    if (activeChallengeKey === "brain-flex") {
      brainFlexStartRef.current = performance.now();
    }
  }, [activeChallengeKey]);

  useEffect(() => {
    if (activeChallengeKey !== "personality") {
      setPersonalityStep(0);
      setPersonalityAnswers([]);
    }
  }, [activeChallengeKey]);

  const activeChallenge = useMemo(() => {
    if (!activeChallengeKey) return challengeCards[0];
    return challengeCards.find((challenge) => challenge.key === activeChallengeKey) ?? challengeCards[0];
  }, [activeChallengeKey, challengeCards]);

  const campusXp = challengeData?.userPoints ?? user?.points ?? 0;
  const activeOptions: ChallengeOption[] = activeChallenge?.options ?? [];
  const activeTotal = activeOptions.reduce<number>((sum, option) => sum + option.count, 0);
  const hasActiveVote = Boolean(activeChallenge?.userVote);
  const moodLeader = useMemo(() => {
    const moodChallenge = challengeCards.find((challenge: Challenge) => challenge.key === "mood");
    if (!moodChallenge?.options?.length) return null;
    return [...moodChallenge.options].sort((a, b) => b.count - a.count)[0];
  }, [challengeCards]);
  const historyEntries: ChallengeHistory[] = activeChallenge?.history ?? [];
  const leaderboardEntries: ChallengeLeaderboardEntry[] = activeChallenge?.leaderboard ?? [];
  const personalityQuestions: ChallengeQuestion[] = activeChallenge?.meta?.questions ?? [];
  const personalityOptions = (personalityQuestions[personalityStep]?.options ?? []) as string[];
  const personalityResults: ChallengePersonalityResult[] = activeChallenge?.meta?.personalityResults ?? [];

  const getPersonalityResultKey = (answers: number[]) => {
    if (!personalityResults.length) return null;
    const maxScore = answers.length * 3;
    const totalScore = answers.reduce((sum, value) => sum + value, 0);
    const normalized = maxScore === 0 ? 0 : totalScore / maxScore;
    const index = Math.min(personalityResults.length - 1, Math.floor(normalized * personalityResults.length));
    return personalityResults[index]?.key ?? personalityResults[0]?.key ?? null;
  };

  const openChallenges = () => {
    setChallengeView("list");
    setIsMobileChallengesOpen(true);
  };

  const selectChallenge = (key: string) => {
    setActiveChallengeKey(key);
    setChallengeView("detail");
  };

  const handleBackToList = () => setChallengeView("list");

  const handleMobileBack = () => {
    if (challengeView === "detail") {
      setChallengeView("list");
      return;
    }
    setIsMobileChallengesOpen(false);
  };

  const challengesPanel = (className: string) => {
    if (challengesLoading) {
      return (
        <div className={cn("flex-1 overflow-y-auto space-y-4", className)}>
          <div className="space-y-3 animate-pulse">
            <div className="h-6 bg-secondary rounded-lg" />
            <div className="grid grid-cols-2 gap-2">
              <div className="h-14 bg-secondary rounded-xl" />
              <div className="h-14 bg-secondary rounded-xl" />
              <div className="h-14 bg-secondary rounded-xl" />
              <div className="h-14 bg-secondary rounded-xl" />
            </div>
            <div className="h-52 bg-secondary rounded-2xl" />
          </div>
        </div>
      );
    }

    return (
      <div className={cn("flex-1 overflow-y-auto space-y-4", className)}>
        {challengeView === "list" ? (
          <div className="space-y-4">
            <div>
              <p className="text-xs uppercase tracking-[0.18em] text-muted-foreground mb-3">Choose a challenge</p>
              <div className="space-y-3">
                {challengeCards.map((challenge) => (
                  <button
                    key={challenge.key}
                    type="button"
                    onClick={() => selectChallenge(challenge.key)}
                    className="w-full rounded-2xl border bg-white p-4 text-left shadow-sm transition-all duration-200 hover:-translate-y-0.5 hover:shadow-md hover:border-neutral-300"
                  >
                    <div className="flex items-start gap-3">
                      <div className="h-10 w-10 rounded-xl bg-neutral-100 border flex items-center justify-center text-lg">
                        {challengeEmojis[challenge.key] ?? "✨"}
                      </div>
                      <div className="flex-1">
                        <div className="flex items-center justify-between">
                          <p className="text-sm font-semibold">{challenge.title}</p>
                          <span className="text-[11px] font-semibold text-muted-foreground px-2 py-0.5 rounded-full border bg-neutral-50">
                            {(cadenceLabels[challenge.cadence] ?? challenge.cadence)} reset
                          </span>
                        </div>
                        <p className="text-xs text-muted-foreground mt-1">
                          {challenge.prompt ?? challenge.description}
                        </p>
                      </div>
                    </div>
                  </button>
                ))}
              </div>
            </div>
          </div>
        ) : (
          <div className="rounded-2xl border bg-white/90 p-4 shadow-sm">
            <div className="flex items-center gap-2 mb-4">
              <Button
                size="icon"
                variant="ghost"
                onClick={handleBackToList}
                aria-label="Back to challenges"
              >
                <ArrowLeft className="h-4 w-4" />
              </Button>
              <div>
                <p className="text-sm font-semibold">{activeChallenge?.title}</p>
                <p className="text-xs text-muted-foreground">{activeChallenge?.prompt ?? activeChallenge?.description}</p>
              </div>
            </div>
            {!activeChallenge ? (
              <p className="text-xs text-muted-foreground">Pick a challenge to get started.</p>
            ) : (
              <>
                {activeChallenge.key === "mood" && (
                  <div className="space-y-4">
                    <div>
                      <p className="text-sm font-semibold">{activeChallenge.title}</p>
                      {moodLeader && (
                        <p className="text-xs text-muted-foreground">
                          Today's Campus Energy: {moodLeader.percent}% {moodLeader.label}
                        </p>
                      )}
                    </div>
                    <div className="grid grid-cols-2 gap-2">
                      {activeOptions.map((option) => (
                        <button
                          key={option.key}
                          type="button"
                          disabled={hasActiveVote || submit.isPending}
                          onClick={() => submit.mutate({ roundId: activeChallenge.roundId, optionKey: option.key })}
                          className="rounded-lg border px-2 py-2 text-left text-xs font-medium hover:bg-secondary/60 transition disabled:opacity-60"
                        >
                          <span className="mr-1">{option.emoji}</span> {option.label}
                        </button>
                      ))}
                    </div>
                    <div className="space-y-2">
                      {activeOptions.map((option) => (
                        <div key={option.key}>
                          <div className="flex items-center justify-between text-[11px] text-muted-foreground">
                            <span>{option.emoji} {option.label}</span>
                            <span>{option.percent}%</span>
                          </div>
                          <div className="h-1.5 rounded-full bg-secondary">
                            <div
                              className="h-1.5 rounded-full bg-primary transition-all"
                              style={{ width: `${option.percent}%` }}
                            />
                          </div>
                        </div>
                      ))}
                    </div>
                    {historyEntries.length > 0 && (
                      <div>
                        <p className="text-[11px] text-muted-foreground mb-2">Mood history (7 days)</p>
                        <div className="flex items-end gap-1 h-10">
                          {historyEntries.map((entry) => (
                            <div key={entry.label} className="flex-1 flex flex-col items-center gap-1">
                              <div
                                className="w-full rounded-sm bg-primary/30"
                                style={{ height: `${entry.value}%` }}
                              />
                              <span className="text-[9px] text-muted-foreground">{entry.label}</span>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                )}

                {activeChallenge.key === "dept" && (
                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm font-semibold">{activeChallenge.title}</p>
                        <p className="text-xs text-muted-foreground">{activeChallenge.prompt}</p>
                      </div>
                      <span className="text-xs text-muted-foreground">Resets weekly</span>
                    </div>
                    <div className="grid grid-cols-2 gap-2">
                      {activeOptions.map((dept) => (
                        <button
                          key={dept.key}
                          type="button"
                          disabled={hasActiveVote || submit.isPending}
                          onClick={() => submit.mutate({ roundId: activeChallenge.roundId, optionKey: dept.key })}
                          className="rounded-lg border px-2 py-2 text-left text-xs font-medium hover:bg-secondary/60 transition disabled:opacity-60"
                        >
                          Vote {dept.label}
                        </button>
                      ))}
                    </div>
                    <div className="space-y-2">
                      {activeOptions.map((dept) => (
                        <div key={dept.key} className="flex items-center gap-2">
                          <span className="text-xs w-12 truncate">{dept.label}</span>
                          <div className="flex-1 h-2 rounded-full bg-secondary">
                            <div
                              className="h-2 rounded-full bg-amber-500 transition-all"
                              style={{ width: `${dept.percent}%` }}
                            />
                          </div>
                          <span className="text-xs text-muted-foreground">{dept.percent}%</span>
                        </div>
                      ))}
                    </div>
                    <p className="text-xs text-amber-600 font-semibold">🔥 Winning dept gets campus bragging rights.</p>
                  </div>
                )}

                {activeChallenge.key === "this-or-that" && (
                  <div className="space-y-4">
                    <div>
                      <p className="text-sm font-semibold">{activeChallenge.title}</p>
                      <p className="text-xs text-muted-foreground">{activeChallenge.prompt}</p>
                    </div>
                    <div className="grid grid-cols-2 gap-2">
                      {activeOptions.map((option) => (
                        <button
                          key={option.key}
                          type="button"
                          disabled={hasActiveVote || submit.isPending}
                          onClick={() => submit.mutate({ roundId: activeChallenge.roundId, optionKey: option.key })}
                          className="rounded-lg border px-3 py-2 text-xs font-semibold hover:bg-secondary/60 transition disabled:opacity-60"
                        >
                          {option.label}
                        </button>
                      ))}
                    </div>
                    <div className="flex items-center gap-2 text-xs text-muted-foreground">
                      <span>See what your campus chose</span>
                      <span className="font-semibold text-foreground">
                        {activeOptions.map((option) => `${option.percent}%`).join(" vs ")}
                      </span>
                    </div>
                  </div>
                )}

                {activeChallenge.key === "confession" && (
                  <div className="space-y-4">
                    <div>
                      <p className="text-sm font-semibold">{activeChallenge.title}</p>
                      <p className="text-xs text-muted-foreground">{activeChallenge.prompt}</p>
                    </div>
                    <div className="grid grid-cols-2 gap-2">
                      {activeOptions.map((option) => (
                        <button
                          key={option.key}
                          type="button"
                          disabled={hasActiveVote || submit.isPending}
                          onClick={() => submit.mutate({ roundId: activeChallenge.roundId, optionKey: option.key })}
                          className="rounded-lg border px-3 py-2 text-xs font-semibold hover:bg-secondary/60 transition disabled:opacity-60"
                        >
                          {option.label}
                        </button>
                      ))}
                    </div>
                    <p className="text-xs text-muted-foreground">Heat check: {activeOptions[0]?.percent ?? 0}% agree</p>
                  </div>
                )}

                {activeChallenge.key === "stress" && (
                  <div className="space-y-4">
                    <div>
                      <p className="text-sm font-semibold">{activeChallenge.title}</p>
                      <p className="text-xs text-muted-foreground">{activeChallenge.prompt}</p>
                    </div>
                    <div className="grid grid-cols-5 gap-2">
                      {activeOptions.map((option) => (
                        <button
                          key={option.key}
                          type="button"
                          disabled={hasActiveVote || submit.isPending}
                          onClick={() => submit.mutate({ roundId: activeChallenge.roundId, optionKey: option.key })}
                          className="rounded-lg border py-2 text-xs font-semibold hover:bg-secondary/60 transition disabled:opacity-60"
                        >
                          {option.label}
                        </button>
                      ))}
                    </div>
                    <p className="text-xs text-muted-foreground">
                      Average stress: {activeTotal === 0 ? "0.0" : (activeOptions.reduce((sum, option) => sum + Number(option.label) * option.count, 0) / activeTotal).toFixed(1)} / 5
                    </p>
                  </div>
                )}

                {activeChallenge.key === "brain-flex" && (
                  <div className="space-y-4">
                    <div>
                      <p className="text-sm font-semibold">{activeChallenge.title}</p>
                      <p className="text-xs text-muted-foreground">{activeChallenge.prompt}</p>
                    </div>
                    <div className="grid grid-cols-2 gap-2">
                      {activeOptions.map((choice) => (
                        <button
                          key={choice.key}
                          type="button"
                          disabled={hasActiveVote || submit.isPending}
                          onClick={() => {
                            const startTime = brainFlexStartRef.current ?? performance.now();
                            const elapsed = Math.max(500, Math.round(performance.now() - startTime));
                            submit.mutate({
                              roundId: activeChallenge.roundId,
                              optionKey: choice.key,
                              timeMs: elapsed,
                            });
                          }}
                          className={cn(
                            "rounded-lg border py-2 text-xs font-semibold hover:bg-secondary/60 transition disabled:opacity-60",
                            activeChallenge.userVote === choice.key && "bg-primary text-primary-foreground border-primary"
                          )}
                        >
                          {choice.label}
                        </button>
                      ))}
                    </div>
                    <p className="text-xs text-muted-foreground">
                      {activeChallenge.userVote
                        ? activeChallenge.meta?.correctOptionKey === activeChallenge.userVote
                          ? "Correct. You cracked it!"
                          : "Close. Try again next week."
                        : "Top 10 fastest answers show here."}
                    </p>
                    {leaderboardEntries.length > 0 && (
                      <div className="space-y-2">
                        <p className="text-[11px] text-muted-foreground">Fastest today</p>
                        {leaderboardEntries.slice(0, 3).map((entry, index) => (
                          <div key={entry.userId} className="flex items-center justify-between text-xs">
                            <span>#{index + 1} {entry.username}</span>
                            <span className="text-muted-foreground">{entry.timeMs ? (entry.timeMs / 1000).toFixed(1) : "-"}s</span>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                )}

                {activeChallenge.key === "meme" && (
                  <div className="space-y-4">
                    <div>
                      <p className="text-sm font-semibold">{activeChallenge.title}</p>
                      <p className="text-xs text-muted-foreground">{activeChallenge.prompt}</p>
                    </div>
                    <div className="grid grid-cols-2 gap-2">
                      {activeOptions.map((option) => (
                        <button
                          key={option.key}
                          type="button"
                          disabled={hasActiveVote || submit.isPending}
                          onClick={() => submit.mutate({ roundId: activeChallenge.roundId, optionKey: option.key })}
                          className="rounded-lg border py-2 text-xs font-semibold hover:bg-secondary/60 transition disabled:opacity-60"
                        >
                          {option.label}
                        </button>
                      ))}
                    </div>
                    <p className="text-xs text-muted-foreground">
                      Score: {activeOptions.map((option) => `${option.percent}%`).join(" vs ")}
                    </p>
                    <p className="text-xs text-muted-foreground">Winner gets the badge: Campus Meme Lord.</p>
                  </div>
                )}

                {activeChallenge.key === "personality" && (
                  <div className="space-y-4">
                    <div>
                      <p className="text-sm font-semibold">{activeChallenge.title}</p>
                      <p className="text-xs text-muted-foreground">{activeChallenge.description}</p>
                    </div>
                    {personalityStep < personalityQuestions.length ? (
                      <div className="space-y-2">
                        <p className="text-xs font-semibold">Question {personalityStep + 1} of {personalityQuestions.length}</p>
                        <p className="text-xs text-muted-foreground">{personalityQuestions[personalityStep]?.prompt}</p>
                        <div className="grid grid-cols-2 gap-2">
                          {personalityOptions.map((option: string, index: number) => (
                            <button
                              key={`${personalityStep}-${option}`}
                              type="button"
                              disabled={submit.isPending}
                              onClick={() => {
                                const nextAnswers = [...personalityAnswers, index];
                                const nextStep = personalityStep + 1;
                                setPersonalityAnswers(nextAnswers);
                                setPersonalityStep(nextStep);
                                if (nextStep >= personalityQuestions.length && activeChallenge) {
                                  const resultKey = getPersonalityResultKey(nextAnswers);
                                  if (resultKey) {
                                    submit.mutate({ roundId: activeChallenge.roundId, resultKey });
                                  }
                                }
                              }}
                              className="rounded-lg border px-2 py-2 text-xs font-semibold hover:bg-secondary/60 transition disabled:opacity-60"
                            >
                              {option}
                            </button>
                          ))}
                        </div>
                      </div>
                    ) : (
                      <div className="space-y-2">
                        <p className="text-xs text-muted-foreground">You are: <span className="font-semibold text-foreground">
                          {personalityResults.find((result) => result.key === activeChallenge.userVote)?.label ?? "Your campus type"}
                        </span></p>
                        <p className="text-xs text-muted-foreground">
                          {personalityResults.find((result) => result.key === activeChallenge.userVote)?.blurb ?? ""}
                        </p>
                        <p className="text-xs text-muted-foreground">
                          Campus split: {activeOptions.map((option) => `${option.percent}% ${option.label}`).join(", ")}
                        </p>
                        <button
                          type="button"
                          onClick={() => {
                            setPersonalityStep(0);
                            setPersonalityAnswers([]);
                          }}
                          className="w-full rounded-lg border py-2 text-xs font-semibold hover:bg-secondary/60 transition"
                        >
                          Retake
                        </button>
                      </div>
                    )}
                  </div>
                )}

                {activeChallenge.key === "rising-star" && (
                  <div className="space-y-4">
                    <div>
                      <p className="text-sm font-semibold">{activeChallenge.title}</p>
                      <p className="text-xs text-muted-foreground">{activeChallenge.prompt}</p>
                    </div>
                    {activeChallenge.meta?.risingStar && (
                      <div className="rounded-xl border p-3 bg-secondary/40">
                        <p className="text-sm font-semibold">@{activeChallenge.meta.risingStar.username}</p>
                        <p className="text-xs text-muted-foreground">{activeChallenge.meta.risingStar.points} points</p>
                      </div>
                    )}
                    <button
                      type="button"
                      disabled={hasActiveVote || submit.isPending}
                      onClick={() => submit.mutate({ roundId: activeChallenge.roundId, optionKey: "cheer" })}
                      className="w-full rounded-lg border py-2 text-xs font-semibold hover:bg-secondary/60 transition disabled:opacity-60"
                    >
                      Send a cheer ({activeChallenge.meta?.risingStar?.cheers ?? 0})
                    </button>
                  </div>
                )}

                {activeChallenge.key === "hot-take" && (
                  <div className="space-y-4">
                    <div>
                      <p className="text-sm font-semibold">{activeChallenge.title}</p>
                      <p className="text-xs text-muted-foreground">{activeChallenge.prompt}</p>
                    </div>
                    <div className="grid grid-cols-2 gap-2">
                      {activeOptions.map((option) => (
                        <button
                          key={option.key}
                          type="button"
                          disabled={hasActiveVote || submit.isPending}
                          onClick={() => submit.mutate({ roundId: activeChallenge.roundId, optionKey: option.key })}
                          className="rounded-lg border py-2 text-xs font-semibold hover:bg-secondary/60 transition disabled:opacity-60"
                        >
                          {option.label}
                        </button>
                      ))}
                    </div>
                    <p className="text-xs text-muted-foreground">Results: {activeOptions[0]?.percent ?? 0}% agree</p>
                    <div className="text-xs text-muted-foreground">Top takes refresh after votes.</div>
                  </div>
                )}
              </>
            )}
          </div>
        )}
      </div>
    );
  };

  return (
    <div className="min-h-screen bg-neutral-50 flex flex-col md:flex-row">
      {/* Mobile Header */}
      <div className="md:hidden h-14 bg-white border-b flex items-center justify-between px-4 sticky top-0 z-50">
        <Link href="/" className="font-display font-bold text-xl tracking-tight">nerdds.</Link>
        <div className="flex items-center gap-1">
          <Button size="icon" variant="ghost" onClick={openChallenges} aria-label="Open challenges">
            <Gamepad2 className="h-5 w-5" />
          </Button>
          <Link href="/create">
            <Button size="icon" variant="ghost">
              <PlusSquare className="h-6 w-6" />
            </Button>
          </Link>
        </div>
      </div>

      {/* Sidebar Navigation (Desktop) */}
      <aside className="hidden md:flex flex-col w-64 h-screen sticky top-0 border-r bg-white px-6 py-8">
        <div className="mb-10 pl-2">
          <Link href="/" className="font-display font-extrabold text-3xl tracking-tighter hover:opacity-80 transition-opacity">
            nerdds.
          </Link>
        </div>

        <nav className="flex-1 space-y-2">
          {navItems.map((item) => {
            const isActive = location === item.href;
            return (
              <Link key={item.href} href={item.href}>
                <div className={cn(
                  "flex items-center gap-4 px-4 py-3 rounded-xl transition-all duration-200 group cursor-pointer",
                  isActive
                    ? "bg-primary text-primary-foreground shadow-lg shadow-primary/20 font-medium"
                    : "text-muted-foreground hover:bg-secondary hover:text-foreground"
                )}>
                  <item.icon className={cn("h-6 w-6", isActive ? "stroke-[2.5px]" : "stroke-[2px]")} />
                  <span className="text-base">{item.label}</span>
                </div>
              </Link>
            );
          })}

          <Link href="/create">
            <div className="flex items-center gap-4 px-4 py-3 rounded-xl transition-all duration-200 text-muted-foreground hover:bg-secondary hover:text-foreground cursor-pointer mt-4">
              <PlusSquare className="h-6 w-6 stroke-[2px]" />
              <span className="text-base">Create Post</span>
            </div>
          </Link>
        </nav>

        {user && (
          <div className="mt-auto pt-6 border-t space-y-4">
            <div className="flex items-center gap-3 px-2">
              <div className="h-10 w-10 rounded-full bg-secondary flex items-center justify-center overflow-hidden border">
                {user.profileImage ? (
                  <img src={user.profileImage} alt={user.username} className="h-full w-full object-cover" />
                ) : (
                  <span className="font-bold text-lg text-muted-foreground">{user.username.charAt(0).toUpperCase()}</span>
                )}
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-semibold truncate">{user.username}</p>
                <p className="text-xs text-muted-foreground truncate">{user.level}</p>
              </div>
            </div>
            <Button
              variant="outline"
              className="w-full justify-start gap-2 text-muted-foreground hover:text-destructive"
              onClick={() => logout.mutate()}
            >
              <LogOut className="h-4 w-4" />
              Log Out
            </Button>
          </div>
        )}
      </aside>

      {/* Main Content Area */}
      <main className="flex-1 w-full max-w-2xl mx-auto min-h-screen pb-20 md:pb-0 md:px-8 py-4 md:py-8">
        {children}
      </main>

      {/* Right Sidebar (Interactive Challenges) - Desktop Only */}
      <aside className="hidden lg:block w-80 h-screen sticky top-0 py-8 px-6 border-l bg-white">
        <div className="h-full flex flex-col gap-6">
          <div className="rounded-2xl p-5 border bg-white shadow-sm">
            <div className="flex items-center justify-between">
              <h3 className="font-display font-bold text-lg flex items-center gap-2">
                <GraduationCap className="h-5 w-5" />
                INTERACTIVE CHALLENGES
              </h3>
              <span className="text-xs font-semibold px-3 py-1 rounded-full border bg-neutral-900 text-white shadow-sm">
                XP · {campusXp}
              </span>
            </div>
            <p className="text-xs text-muted-foreground mt-2">
              {challengeData?.campus?.name ?? "Your campus"}: pick a challenge, play in under 5 seconds, and watch the energy move.
            </p>
          </div>

          {challengesPanel("pr-1")}
        </div>
      </aside>

      {/* Mobile Challenges Overlay */}
      {isMobileChallengesOpen && (
        <div className="fixed inset-0 z-50 md:hidden">
          <div className="absolute inset-0 bg-black/30 backdrop-blur-sm" />
          <div className="relative mx-3 mt-3 mb-6 h-[calc(100%-2rem)] rounded-3xl border bg-white shadow-2xl flex flex-col">
            <div className="h-14 border-b px-4 flex items-center justify-between bg-white/80 backdrop-blur rounded-t-3xl">
              <Button size="icon" variant="ghost" onClick={handleMobileBack} aria-label="Back">
                <ArrowLeft className="h-5 w-5" />
              </Button>
              <div className="text-sm font-semibold">Interactive Challenges</div>
              <div className="text-xs font-semibold px-2 py-1 rounded-full bg-neutral-900 text-white">
                XP {campusXp}
              </div>
            </div>
            <div className="flex-1 px-4 py-4 overflow-y-auto">
              {challengesPanel("pr-0")}
            </div>
          </div>
        </div>
      )}

      {/* Mobile Bottom Nav */}
      <div className="md:hidden fixed bottom-0 left-0 right-0 h-16 bg-white border-t flex items-center justify-around z-50 pb-safe">
        {navItems.map((item) => {
          const isActive = location === item.href;
          return (
            <Link key={item.href} href={item.href}>
              <div className={cn(
                "flex flex-col items-center justify-center p-2 transition-colors",
                isActive ? "text-primary" : "text-muted-foreground"
              )}>
                <item.icon className={cn("h-6 w-6", isActive && "fill-current")} strokeWidth={isActive ? 2.5 : 2} />
              </div>
            </Link>
          );
        })}
      </div>
      <Toaster />
    </div>
  );
}
