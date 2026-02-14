import { useState } from "react";
import { useAuth } from "@/hooks/use-auth";
import { usePosts } from "@/hooks/use-posts";
import { PostCard } from "@/components/post-card";
import { CreatePostDialog } from "@/components/create-post-dialog";
import { Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";

export default function FeedPage() {
  const { user } = useAuth();
  const [selectedTag, setSelectedTag] = useState<string | undefined>(undefined);
  const { data: posts, isLoading } = usePosts({ tag: selectedTag });

  const tags = ["All", "General", "Question", "Event", "Confession", "Meme"];

  if (isLoading) {
    return (
      <div className="flex justify-center items-center min-h-[50vh]">
        <Loader2 className="w-8 h-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <div className="max-w-xl mx-auto">
      {/* Header / Filter Bar */}
      <div className="mb-6 sticky top-0 md:static z-20 bg-neutral-50/95 backdrop-blur py-2">
        <h1 className="font-display font-bold text-2xl mb-4 px-2 hidden md:block">Your Feed</h1>
        
        <div className="flex gap-2 overflow-x-auto pb-2 hide-scrollbar px-2 md:px-0">
          {tags.map((tag) => {
            const isActive = (tag === "All" && !selectedTag) || tag === selectedTag;
            return (
              <button
                key={tag}
                onClick={() => setSelectedTag(tag === "All" ? undefined : tag)}
                className={`
                  px-4 py-1.5 rounded-full text-sm font-medium transition-all whitespace-nowrap
                  ${isActive 
                    ? "bg-black text-white shadow-md" 
                    : "bg-white text-neutral-600 border hover:bg-neutral-100"}
                `}
              >
                {tag}
              </button>
            );
          })}
        </div>
      </div>

      {/* Create Post Prompt (Mobile/Desktop) */}
      <div className="mb-6 px-4 md:px-0">
         <CreatePostDialog>
            <div className="bg-white border rounded-xl p-4 shadow-sm hover:shadow-md transition-all cursor-pointer flex gap-4 items-center">
               <div className="h-10 w-10 rounded-full bg-secondary shrink-0 flex items-center justify-center font-bold text-muted-foreground">
                  {user?.username?.[0]?.toUpperCase()}
               </div>
               <div className="flex-1 bg-neutral-100 rounded-full h-10 flex items-center px-4 text-muted-foreground text-sm">
                  What's on your mind?
               </div>
            </div>
         </CreatePostDialog>
      </div>

      {/* Posts Feed */}
      <div className="space-y-4">
        {posts?.length === 0 ? (
          <div className="text-center py-20 text-muted-foreground">
            <p className="text-lg font-medium">No posts yet.</p>
            <p className="text-sm">Be the first to post in your university!</p>
          </div>
        ) : (
          posts?.map((post) => (
            <PostCard key={post.id} post={post} />
          ))
        )}
      </div>
    </div>
  );
}
