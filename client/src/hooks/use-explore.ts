import { useQuery } from "@tanstack/react-query";
import { api } from "@shared/routes";
import { Post, User } from "@shared/schema";

export interface ExploreData {
  trending: (Post & { author: User })[];
  suggestedUsers: User[];
  hotTopics: Array<{ hashtag: string; count: number }>;
}

export function useExplore() {
  return useQuery({
    queryKey: [api.explore.data.path],
    queryFn: async () => {
      const res = await fetch(api.explore.data.path, { credentials: "include" });
      if (!res.ok) throw new Error("Failed to fetch explore data");
      return api.explore.data.responses[200].parse(await res.json());
    },
  });
}
