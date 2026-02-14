import { type Post, type User } from "@shared/schema";
import { formatDistanceToNow } from "date-fns";
import { MessageCircle, Heart, Share2, MoreHorizontal, Bookmark } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useLikePost } from "@/hooks/use-posts";
import { cn } from "@/lib/utils";
import { Link } from "wouter";

interface PostCardProps {
  post: Post & { author: User };
}

export function PostCard({ post }: PostCardProps) {
  const likeMutation = useLikePost();
  
  const handleLike = (e: React.MouseEvent) => {
    e.preventDefault();
    likeMutation.mutate(post.id);
  };

  const postImageSrc = post.image
    ? post.image.startsWith("http")
      ? post.image
      : post.image.startsWith("/")
        ? post.image
        : `/${post.image}`
    : undefined;

  return (
    <div className="bg-white border rounded-none md:rounded-2xl overflow-hidden mb-4 md:shadow-sm transition-shadow hover:shadow-md">
      {/* Header */}
      <div className="flex items-center justify-between p-4">
        <Link href={`/profile/${post.author.username}`}>
          <div className="flex items-center gap-3 cursor-pointer group">
            <div className="h-10 w-10 rounded-full bg-secondary border flex items-center justify-center overflow-hidden">
              {post.author.profileImage ? (
                <img src={post.author.profileImage} alt={post.author.username} className="h-full w-full object-cover" />
              ) : (
                <span className="font-bold text-sm text-muted-foreground">{post.author.username[0].toUpperCase()}</span>
              )}
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="font-semibold text-sm group-hover:underline">{post.author.username}</span>
                <span className="text-[10px] px-1.5 py-0.5 bg-secondary text-secondary-foreground rounded-full font-medium">
                  {post.author.level}
                </span>
              </div>
              <p className="text-xs text-muted-foreground">
                {formatDistanceToNow(new Date(post.createdAt), { addSuffix: true })}
              </p>
            </div>
          </div>
        </Link>
        <Button variant="ghost" size="icon" className="h-8 w-8">
          <MoreHorizontal className="h-5 w-5 text-muted-foreground" />
        </Button>
      </div>

      {/* Content */}
      <Link href={`/posts/${post.id}`}>
        <div className="cursor-pointer">
          {postImageSrc && (
            <div className="aspect-video w-full bg-secondary overflow-hidden">
              <img src={postImageSrc} alt="Post content" className="w-full h-full object-cover" />
            </div>
          )}
          <div className="p-4 pt-2">
             <div className="flex gap-2 mb-2">
                {post.tags && post.tags.map(tag => (
                   <span key={tag} className="text-xs font-medium text-primary bg-primary/5 px-2 py-1 rounded-md">
                      #{tag}
                   </span>
                ))}
             </div>
            <p className="text-base leading-relaxed whitespace-pre-wrap">{post.content}</p>
          </div>
        </div>
      </Link>

      {/* Actions */}
      <div className="px-4 pb-4 pt-2 flex items-center justify-between border-t border-neutral-50 mt-2">
        <div className="flex items-center gap-4">
          <Button 
            variant="ghost" 
            size="sm" 
            className="flex items-center gap-2 px-2 hover:bg-transparent hover:text-red-500"
            onClick={handleLike}
          >
            <Heart className={cn("h-5 w-5", post.likesCount > 0 ? "fill-red-500 text-red-500" : "")} />
            <span className="font-medium">{post.likesCount > 0 ? post.likesCount : "Like"}</span>
          </Button>

          <Link href={`/posts/${post.id}`}>
            <Button variant="ghost" size="sm" className="flex items-center gap-2 px-2 hover:bg-transparent hover:text-blue-500">
              <MessageCircle className="h-5 w-5" />
              <span className="font-medium">{post.commentsCount > 0 ? post.commentsCount : "Comment"}</span>
            </Button>
          </Link>
          
          <Button variant="ghost" size="sm" className="flex items-center gap-2 px-2 hover:bg-transparent">
            <Share2 className="h-5 w-5" />
          </Button>
        </div>

        <Button variant="ghost" size="icon">
          <Bookmark className="h-5 w-5" />
        </Button>
      </div>
    </div>
  );
}
