import { useRoute } from "wouter";
import { usePost, useComments, useCreateComment } from "@/hooks/use-posts";
import { PostCard } from "@/components/post-card";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Loader2, Send } from "lucide-react";
import { useState } from "react";
import { formatDistanceToNow } from "date-fns";
import { useAuth } from "@/hooks/use-auth";

export default function PostDetailPage() {
  const [, params] = useRoute("/posts/:id");
  const postId = Number(params?.id);
  const { data: post, isLoading: postLoading } = usePost(postId);
  const { data: comments, isLoading: commentsLoading } = useComments(postId);
  const createComment = useCreateComment();
  const [commentText, setCommentText] = useState("");
  const { user } = useAuth();

  const handleComment = async () => {
    if (!commentText.trim()) return;
    await createComment.mutateAsync({ postId, content: commentText });
    setCommentText("");
  };

  if (postLoading) return <div className="flex justify-center p-8"><Loader2 className="animate-spin" /></div>;
  if (!post) return <div className="p-8 text-center">Post not found</div>;

  return (
    <div className="max-w-xl mx-auto pb-20">
      <PostCard post={post} />

      <div className="bg-white border rounded-none md:rounded-2xl p-4 md:p-6 mt-4">
        <h3 className="font-bold text-lg mb-4">Comments ({comments?.length || 0})</h3>
        
        {/* Comment Input */}
        <div className="flex gap-3 mb-8">
           <div className="h-8 w-8 rounded-full bg-secondary shrink-0 flex items-center justify-center text-xs font-bold">
              {user?.username?.[0]?.toUpperCase()}
           </div>
           <div className="flex-1 relative">
              <Textarea
                value={commentText}
                onChange={(e) => setCommentText(e.target.value)}
                placeholder="Add a comment..."
                className="min-h-[80px] pr-12 resize-none bg-neutral-50"
              />
              <Button 
                size="icon" 
                className="absolute bottom-2 right-2 h-8 w-8 rounded-full"
                disabled={!commentText.trim() || createComment.isPending}
                onClick={handleComment}
              >
                 <Send className="h-4 w-4" />
              </Button>
           </div>
        </div>

        {/* Comments List */}
        <div className="space-y-6">
          {commentsLoading ? (
             <div className="flex justify-center"><Loader2 className="animate-spin text-muted-foreground" /></div>
          ) : comments?.length === 0 ? (
             <p className="text-center text-muted-foreground text-sm">No comments yet.</p>
          ) : (
             comments?.map(comment => (
                <div key={comment.id} className="flex gap-3 group">
                   <div className="h-8 w-8 rounded-full bg-secondary shrink-0 flex items-center justify-center overflow-hidden border">
                      {comment.author.profileImage ? (
                        <img src={comment.author.profileImage} alt={comment.author.username} className="h-full w-full object-cover" />
                      ) : (
                        <span className="font-bold text-xs text-muted-foreground">{comment.author.username[0].toUpperCase()}</span>
                      )}
                   </div>
                   <div className="flex-1">
                      <div className="bg-neutral-50 rounded-2xl rounded-tl-none p-3 px-4 inline-block max-w-full">
                         <div className="flex items-center gap-2 mb-1">
                            <span className="font-semibold text-sm">{comment.author.username}</span>
                            <span className="text-[10px] text-muted-foreground">
                               {formatDistanceToNow(new Date(comment.createdAt))} ago
                            </span>
                         </div>
                         <p className="text-sm text-neutral-800">{comment.content}</p>
                      </div>
                   </div>
                </div>
             ))
          )}
        </div>
      </div>
    </div>
  );
}
