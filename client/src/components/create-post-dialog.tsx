import { useState } from "react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogFooter
} from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useCreatePost } from "@/hooks/use-posts";
import { useAuth } from "@/hooks/use-auth";
import { Image as ImageIcon, Smile, Hash } from "lucide-react";

export function CreatePostDialog({ children }: { children?: React.ReactNode }) {
  const [open, setOpen] = useState(false);
  const [content, setContent] = useState("");
  const [tag, setTag] = useState("General");
  const { user } = useAuth();
  const createPost = useCreatePost();

  const handleSubmit = async () => {
    if (!content.trim() || !user) return;
    
    await createPost.mutateAsync({
      content,
      type: "text",
      tags: [tag],
      authorId: user.id
    } as any);
    
    setOpen(false);
    setContent("");
    setTag("General");
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        {children || <Button className="w-full">Create Post</Button>}
      </DialogTrigger>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>Create a new post</DialogTitle>
        </DialogHeader>
        
        <div className="grid gap-4 py-4">
          <div className="flex gap-4">
             <div className="h-10 w-10 rounded-full bg-secondary flex items-center justify-center shrink-0">
                <span className="font-bold">{user?.username?.[0]?.toUpperCase()}</span>
             </div>
             <div className="flex-1">
                <Textarea 
                  placeholder="What's happening on campus?" 
                  className="min-h-[120px] resize-none border-none focus-visible:ring-0 px-0 text-lg placeholder:text-muted-foreground/50"
                  value={content}
                  onChange={(e) => setContent(e.target.value)}
                />
             </div>
          </div>
          
          <div className="flex items-center justify-between border-t pt-4">
            <div className="flex gap-2">
               <Button variant="ghost" size="icon" className="text-primary/60 hover:text-primary hover:bg-primary/10">
                 <ImageIcon className="h-5 w-5" />
               </Button>
               <Button variant="ghost" size="icon" className="text-primary/60 hover:text-primary hover:bg-primary/10">
                 <Smile className="h-5 w-5" />
               </Button>
               <Select value={tag} onValueChange={setTag}>
                 <SelectTrigger className="w-[140px] border-none shadow-none bg-secondary/50 h-9">
                    <SelectValue placeholder="Select Tag" />
                 </SelectTrigger>
                 <SelectContent>
                    <SelectItem value="General">General</SelectItem>
                    <SelectItem value="Question">Question</SelectItem>
                    <SelectItem value="Event">Event</SelectItem>
                    <SelectItem value="Confession">Confession</SelectItem>
                    <SelectItem value="Meme">Meme</SelectItem>
                 </SelectContent>
               </Select>
            </div>
            
            <Button 
              onClick={handleSubmit} 
              disabled={!content.trim() || createPost.isPending}
              className="rounded-full px-6 font-semibold"
            >
              {createPost.isPending ? "Posting..." : "Post"}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
