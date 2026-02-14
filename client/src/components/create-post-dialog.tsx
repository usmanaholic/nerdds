import { useRef, useState } from "react";
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
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useCreatePost } from "@/hooks/use-posts";
import { useAuth } from "@/hooks/use-auth";
import { Image as ImageIcon, Smile, X } from "lucide-react";

type CreatePostDialogProps = {
  children?: React.ReactNode;
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
  defaultOpen?: boolean;
  hideTrigger?: boolean;
};

export function CreatePostDialog({
  children,
  open,
  onOpenChange,
  defaultOpen,
  hideTrigger = false,
}: CreatePostDialogProps) {
  const [internalOpen, setInternalOpen] = useState(defaultOpen ?? false);
  const isControlled = typeof open === "boolean";
  const dialogOpen = isControlled ? open : internalOpen;
  const handleOpenChange = (nextOpen: boolean) => {
    if (isControlled) {
      onOpenChange?.(nextOpen);
      return;
    }
    setInternalOpen(nextOpen);
  };
  const [content, setContent] = useState("");
  const [tag, setTag] = useState("General");
  const [imageUrl, setImageUrl] = useState<string | undefined>(undefined);
  const [imageUploading, setImageUploading] = useState(false);
  const [imageError, setImageError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const { user } = useAuth();
  const createPost = useCreatePost();

  const emojiList = [
    "😀",
    "😂",
    "😍",
    "🤔",
    "😎",
    "🥳",
    "😅",
    "😭",
    "🔥",
    "💯",
    "🎉",
    "🙏",
    "👍",
    "👏",
    "💡",
    "📚",
    "☕",
  ];

  const handlePickEmoji = (emoji: string) => {
    setContent((prev) => `${prev}${emoji}`);
  };

  const handlePickImage = () => {
    fileInputRef.current?.click();
  };

  const handleImageChange = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;
    setImageUploading(true);
    setImageError(null);

    try {
      const formData = new FormData();
      formData.append("image", file);

      const res = await fetch("/api/uploads", {
        method: "POST",
        body: formData,
        credentials: "include",
      });

      if (!res.ok) {
        const text = await res.text();
        throw new Error(text || "Image upload failed");
      }

      const data = (await res.json()) as { url?: string };
      if (!data.url) throw new Error("Image upload failed");
      setImageUrl(data.url);
    } catch (error) {
      const message = error instanceof Error ? error.message : "Image upload failed";
      setImageError(message);
    } finally {
      setImageUploading(false);
      if (fileInputRef.current) {
        fileInputRef.current.value = "";
      }
    }
  };

  const handleSubmit = async () => {
    if (!content.trim() || !user) return;
    
    await createPost.mutateAsync({
      content,
      type: imageUrl ? "image" : "text",
      tags: [tag],
      image: imageUrl,
    });
    
    handleOpenChange(false);
    setContent("");
    setTag("General");
    setImageUrl(undefined);
    setImageError(null);
  };

  return (
    <Dialog open={dialogOpen} onOpenChange={handleOpenChange}>
      {!hideTrigger && (
        <DialogTrigger asChild>
          {children || <Button className="w-full">Create Post</Button>}
        </DialogTrigger>
      )}
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

          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            onChange={handleImageChange}
            className="hidden"
          />

          {imageUrl && (
            <div className="relative overflow-hidden rounded-xl border bg-secondary/40">
              <img src={imageUrl} alt="Upload preview" className="w-full max-h-64 object-cover" />
              <Button
                type="button"
                size="icon"
                variant="secondary"
                className="absolute top-2 right-2 h-8 w-8"
                onClick={() => setImageUrl(undefined)}
              >
                <X className="h-4 w-4" />
              </Button>
            </div>
          )}

          {imageError && (
            <div className="text-sm text-destructive">{imageError}</div>
          )}
          
          <div className="flex items-center justify-between border-t pt-4">
            <div className="flex gap-2">
               <Button
                 type="button"
                 variant="ghost"
                 size="icon"
                 className="text-primary/60 hover:text-primary hover:bg-primary/10"
                 onClick={handlePickImage}
                 disabled={imageUploading}
               >
                 <ImageIcon className="h-5 w-5" />
               </Button>
               <Popover>
                 <PopoverTrigger asChild>
                   <Button variant="ghost" size="icon" className="text-primary/60 hover:text-primary hover:bg-primary/10">
                     <Smile className="h-5 w-5" />
                   </Button>
                 </PopoverTrigger>
                 <PopoverContent className="w-64">
                   <div className="grid grid-cols-6 gap-2">
                     {emojiList.map((emoji) => (
                       <button
                         key={emoji}
                         type="button"
                         className="rounded-md p-2 text-lg hover:bg-secondary"
                         onClick={() => handlePickEmoji(emoji)}
                       >
                         {emoji}
                       </button>
                     ))}
                   </div>
                 </PopoverContent>
               </Popover>
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
