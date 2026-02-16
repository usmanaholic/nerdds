import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { api } from "@shared/routes";
import type { 
  InsertSnackRequest, 
  SnackRequest, 
  SnackSession,
  User,
  InsertSnackRating,
  InsertSnackReport,
} from "@shared/schema";

interface CreateSnackRequestResponse {
  request: SnackRequest;
  matched: boolean;
  session?: SnackSession & { user1: User; user2: User };
}

interface MatchStatusResponse {
  hasActiveRequest: boolean;
  request?: SnackRequest;
  hasActiveSession: boolean;
  session?: SnackSession & { user1: User; user2: User };
}

/**
 * Hook to get current match status (active request or session)
 */
export function useSnackMatchStatus() {
  return useQuery<MatchStatusResponse>({
    queryKey: ["snack", "match-status"],
    queryFn: async () => {
      const res = await fetch(api.snack.getMatchStatus.path, {
        credentials: "include",
      });
      if (!res.ok) throw new Error("Failed to fetch match status");
      return res.json();
    },
    refetchInterval: 3000, // Poll every 3 seconds for matches
  });
}

/**
 * Hook to create a snack request
 */
export function useCreateSnackRequest() {
  const queryClient = useQueryClient();

  return useMutation<CreateSnackRequestResponse, Error, InsertSnackRequest>({
    mutationFn: async (data) => {
      const res = await fetch(api.snack.createRequest.path, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify(data),
      });
      if (!res.ok) {
        const error = await res.json();
        throw new Error(error.message || "Failed to create snack request");
      }
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["snack", "match-status"] });
    },
  });
}

/**
 * Hook to cancel a snack request
 */
export function useCancelSnackRequest() {
  const queryClient = useQueryClient();

  return useMutation<{ success: boolean }, Error, number>({
    mutationFn: async (requestId) => {
      const res = await fetch(
        api.snack.cancelRequest.path.replace(":id", String(requestId)),
        {
          method: "DELETE",
          credentials: "include",
        }
      );
      if (!res.ok) throw new Error("Failed to cancel request");
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["snack", "match-status"] });
    },
  });
}

/**
 * Hook to submit rating for a snack session
 */
export function useRateSnackSession() {
  const queryClient = useQueryClient();

  return useMutation<
    { success: boolean; session: SnackSession },
    Error,
    InsertSnackRating
  >({
    mutationFn: async (data) => {
      const res = await fetch(api.snack.rate.path, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify(data),
      });
      if (!res.ok) throw new Error("Failed to submit rating");
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["snack", "match-status"] });
    },
  });
}

/**
 * Hook to report a user
 */
export function useReportSnackUser() {
  return useMutation<{ success: boolean }, Error, Omit<InsertSnackReport, "reporterId">>({
    mutationFn: async (data) => {
      const res = await fetch(api.snack.report.path, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify(data),
      });
      if (!res.ok) throw new Error("Failed to report user");
      return res.json();
    },
  });
}

/**
 * Hook to block a user
 */
export function useBlockSnackUser() {
  return useMutation<{ success: boolean }, Error, number>({
    mutationFn: async (userId) => {
      const res = await fetch(api.snack.block.path, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ userId }),
      });
      if (!res.ok) throw new Error("Failed to block user");
      return res.json();
    },
  });
}

/**
 * Hook to get messages for a snack session
 */
export function useSnackMessages(sessionId: number | undefined) {
  return useQuery({
    queryKey: ["snack", "messages", sessionId],
    queryFn: async () => {
      if (!sessionId) return [];
      const res = await fetch(
        api.snack.getMessages.path.replace(":sessionId", String(sessionId)),
        {
          credentials: "include",
        }
      );
      if (!res.ok) throw new Error("Failed to fetch messages");
      return res.json();
    },
    enabled: !!sessionId,
    refetchInterval: 2000, // Poll every 2 seconds
  });
}

/**
 * Hook to send a message in a snack session
 */
export function useSendSnackMessage() {
  const queryClient = useQueryClient();

  return useMutation<
    any,
    Error,
    { sessionId: number; content: string }
  >({
    mutationFn: async ({ sessionId, content }) => {
      const res = await fetch(
        api.snack.sendMessage.path.replace(":sessionId", String(sessionId)),
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          credentials: "include",
          body: JSON.stringify({ content }),
        }
      );
      if (!res.ok) throw new Error("Failed to send message");
      return res.json();
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ 
        queryKey: ["snack", "messages", variables.sessionId] 
      });
    },
  });
}

/**
 * Hook to extend a snack session
 */
export function useExtendSnackSession() {
  const queryClient = useQueryClient();

  return useMutation<
    { success: boolean; session: SnackSession },
    Error,
    number
  >({
    mutationFn: async (sessionId) => {
      const res = await fetch(
        api.snack.extendSession.path.replace(":sessionId", String(sessionId)),
        {
          method: "POST",
          credentials: "include",
        }
      );
      if (!res.ok) throw new Error("Failed to extend session");
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["snack", "match-status"] });
    },
  });
}
