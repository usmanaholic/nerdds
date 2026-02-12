import { useQuery } from "@tanstack/react-query";
import { api } from "@shared/routes";

export function useUniversities() {
  return useQuery({
    queryKey: [api.universities.list.path],
    queryFn: async () => {
      const res = await fetch(api.universities.list.path);
      if (!res.ok) throw new Error("Failed to fetch universities");
      return api.universities.list.responses[200].parse(await res.json());
    },
  });
}
