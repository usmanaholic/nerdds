import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { api } from "@shared/routes";
import { useToast } from "./use-toast";
import { z } from "zod";

export type ChallengeData = z.infer<typeof api.challenges.active.responses[200]>;
export type Challenge = ChallengeData["challenges"][number];
export type ChallengeOption = NonNullable<Challenge["options"]>[number];
export type ChallengeHistory = NonNullable<Challenge["history"]>[number];
export type ChallengeLeaderboardEntry = NonNullable<Challenge["leaderboard"]>[number];
export type ChallengeMeta = NonNullable<Challenge["meta"]>;
export type ChallengeQuestion = NonNullable<ChallengeMeta["questions"]>[number];
export type ChallengePersonalityResult = NonNullable<ChallengeMeta["personalityResults"]>[number];

export function useChallenges() {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  const challengesQuery = useQuery({
    queryKey: [api.challenges.active.path],
    queryFn: async () => {
      const res = await fetch(api.challenges.active.path, { credentials: "include" });
      if (!res.ok) throw new Error("Failed to fetch challenges");
      return api.challenges.active.responses[200].parse(await res.json());
    },
  });

  const submitMutation = useMutation({
    mutationFn: async (payload: { roundId: number; optionKey?: string; resultKey?: string; timeMs?: number }) => {
      const res = await fetch(api.challenges.submit.path.replace(":roundId", String(payload.roundId)), {
        method: api.challenges.submit.method,
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({
          optionKey: payload.optionKey,
          resultKey: payload.resultKey,
          timeMs: payload.timeMs,
        }),
      });

      if (!res.ok) {
        const error = await res.json().catch(() => ({}));
        throw new Error(error.message || "Failed to submit challenge");
      }

      return api.challenges.submit.responses[200].parse(await res.json());
    },
    onSuccess: (data) => {
      queryClient.setQueryData([api.challenges.active.path], (prev: ChallengeData | undefined) => {
        if (!prev) return prev;
        return {
          ...prev,
          userPoints: data.userPoints,
          challenges: prev.challenges.map((challenge) =>
            challenge.roundId === data.challenge.roundId ? data.challenge : challenge
          ),
        };
      });
    },
    onError: (error) => {
      toast({ title: "Challenge update failed", description: error.message, variant: "destructive" });
    },
  });

  return {
    data: challengesQuery.data,
    isLoading: challengesQuery.isLoading,
    submit: submitMutation,
  };
}
