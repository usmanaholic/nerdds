import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { api, buildUrl } from "@shared/routes";
import { z } from "zod";
import { useToast } from "./use-toast";
import { Post } from "@shared/schema";

// Fetch posts
export function usePosts(params?: { universityId?: number; tag?: string }) {
  return useQuery({
    queryKey: [api.posts.list.path, params],
    queryFn: async () => {
      let url = api.posts.list.path;
      if (params) {
        const queryParams = new URLSearchParams();
        if (params.universityId) queryParams.set("universityId", String(params.universityId));
        if (params.tag) queryParams.set("tag", params.tag);
        url += `?${queryParams.toString()}`;
      }
      
      const res = await fetch(url, { credentials: "include" });
      if (!res.ok) throw new Error("Failed to fetch posts");
      return api.posts.list.responses[200].parse(await res.json());
    },
  });
}

// Fetch single post
export function usePost(id: number) {
  return useQuery({
    queryKey: [api.posts.get.path, id],
    queryFn: async () => {
      const url = buildUrl(api.posts.get.path, { id });
      const res = await fetch(url, { credentials: "include" });
      if (!res.ok) throw new Error("Failed to fetch post");
      return api.posts.get.responses[200].parse(await res.json());
    },
    enabled: !!id,
  });
}

// Create post
export function useCreatePost() {
  const queryClient = useQueryClient();
  const { toast } = useToast();
  
  return useMutation({
    mutationFn: async (data: z.infer<typeof api.posts.create.input>) => {
      const payload = {
        ...data,
        content: data.content?.trim(),
      };
      const res = await fetch(api.posts.create.path, {
        method: api.posts.create.method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
        credentials: "include",
      });
      if (!res.ok) {
        let errorText = "Failed to create post";
        try {
          const json = await res.json();
          errorText = json?.message || errorText;
          if (json?.field) {
            errorText = `${errorText}: ${json.field}`;
          }
        } catch {
          const text = await res.text();
          if (text) errorText = text;
        }
        throw new Error(errorText);
      }
      return api.posts.create.responses[201].parse(await res.json());
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [api.posts.list.path] });
      toast({ title: "Posted!", description: "Your post is live." });
    },
    onError: () => {
      toast({ title: "Error", description: "Could not create post.", variant: "destructive" });
    },
  });
}

// Like post
export function useLikePost() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async (postId: number) => {
      const url = buildUrl(api.posts.like.path, { id: postId });
      const res = await fetch(url, { method: api.posts.like.method, credentials: "include" });
      if (!res.ok) throw new Error("Failed to like post");
      return api.posts.like.responses[200].parse(await res.json());
    },
    onSuccess: (data, postId) => {
      queryClient.invalidateQueries({ queryKey: [api.posts.list.path] });
      queryClient.invalidateQueries({ queryKey: [api.posts.get.path, postId] });
    },
  });
}

// Comments
export function useComments(postId: number) {
  return useQuery({
    queryKey: [api.comments.list.path, postId],
    queryFn: async () => {
      const url = buildUrl(api.comments.list.path, { postId });
      const res = await fetch(url, { credentials: "include" });
      if (!res.ok) throw new Error("Failed to fetch comments");
      return api.comments.list.responses[200].parse(await res.json());
    },
    enabled: !!postId,
  });
}

export function useCreateComment() {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: async ({ postId, content }: { postId: number; content: string }) => {
      const url = buildUrl(api.comments.create.path, { postId });
      const res = await fetch(url, {
        method: api.comments.create.method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ content }),
        credentials: "include",
      });
      if (!res.ok) throw new Error("Failed to add comment");
      return api.comments.create.responses[201].parse(await res.json());
    },
    onSuccess: (data, variables) => {
      queryClient.invalidateQueries({ queryKey: [api.comments.list.path, variables.postId] });
      queryClient.invalidateQueries({ queryKey: [api.posts.get.path, variables.postId] }); // Update comment count
      toast({ title: "Comment added" });
    },
  });
}
