import { useState } from "react";
import { useCreateSnackRequest } from "@/hooks/use-snack";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { X } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

interface CreateSnackDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onMatchFound?: (session: any) => void;
}

const SNACK_TYPES = [
  { value: "study", label: "Study", emoji: "📚" },
  { value: "chill", label: "Chill", emoji: "😌" },
  { value: "debate", label: "Debate", emoji: "💬" },
  { value: "game", label: "Game", emoji: "🎮" },
  { value: "activity", label: "Activity", emoji: "⚡" },
  { value: "campus", label: "Campus", emoji: "🏫" },
];

const DURATIONS = [
  { value: 10, label: "10 min" },
  { value: 15, label: "15 min" },
  { value: 30, label: "30 min" },
];

export function CreateSnackDialog({
  open,
  onOpenChange,
  onMatchFound,
}: CreateSnackDialogProps) {
  const { toast } = useToast();
  const createRequest = useCreateSnackRequest();

  const [snackType, setSnackType] = useState<string>("chill");
  const [topic, setTopic] = useState("");
  const [duration, setDuration] = useState<number>(15);
  const [location, setLocation] = useState("");
  const [tagInput, setTagInput] = useState("");
  const [tags, setTags] = useState<string[]>([]);

  const handleAddTag = () => {
    if (tagInput.trim() && tags.length < 5) {
      setTags([...tags, tagInput.trim()]);
      setTagInput("");
    }
  };

  const handleRemoveTag = (index: number) => {
    setTags(tags.filter((_, i) => i !== index));
  };

  const handleSubmit = async () => {
    try {
      const result = await createRequest.mutateAsync({
        snackType: snackType as any,
        topic: topic || null,
        duration,
        location: location || null,
        tags: tags.length > 0 ? tags : null,
      });

      if (result.matched && result.session) {
        toast({
          title: "Match found! 🎉",
          description: "You've been matched with someone!",
        });
        onMatchFound?.(result.session);
        onOpenChange(false);
      } else {
        toast({
          title: "Finding a match...",
          description: "You're in the queue. We'll notify you when we find someone!",
        });
        onOpenChange(false);
      }

      // Reset form
      setTopic("");
      setLocation("");
      setTags([]);
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Failed to create snack request",
        variant: "destructive",
      });
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>Create a Snack</DialogTitle>
          <DialogDescription>
            Get matched with another student for a quick, time-limited connection
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          {/* Snack Type */}
          <div className="space-y-2">
            <Label>Snack Type</Label>
            <div className="grid grid-cols-3 gap-2">
              {SNACK_TYPES.map((type) => (
                <Button
                  key={type.value}
                  type="button"
                  variant={snackType === type.value ? "default" : "outline"}
                  onClick={() => setSnackType(type.value)}
                  className="h-auto py-3 flex flex-col gap-1"
                >
                  <span className="text-2xl">{type.emoji}</span>
                  <span className="text-xs">{type.label}</span>
                </Button>
              ))}
            </div>
          </div>

          {/* Topic */}
          <div className="space-y-2">
            <Label htmlFor="topic">Topic (Optional)</Label>
            <Input
              id="topic"
              placeholder="e.g., Linear Algebra, Coffee Chat..."
              value={topic}
              onChange={(e) => setTopic(e.target.value)}
              maxLength={100}
            />
          </div>

          {/* Duration */}
          <div className="space-y-2">
            <Label>Duration</Label>
            <div className="flex gap-2">
              {DURATIONS.map((dur) => (
                <Button
                  key={dur.value}
                  type="button"
                  variant={duration === dur.value ? "default" : "outline"}
                  onClick={() => setDuration(dur.value)}
                  className="flex-1"
                >
                  {dur.label}
                </Button>
              ))}
            </div>
          </div>

          {/* Location */}
          <div className="space-y-2">
            <Label htmlFor="location">Location (Optional)</Label>
            <Input
              id="location"
              placeholder="e.g., Library, Cafeteria..."
              value={location}
              onChange={(e) => setLocation(e.target.value)}
              maxLength={50}
            />
          </div>

          {/* Tags */}
          <div className="space-y-2">
            <Label htmlFor="tags">Tags (Optional, max 5)</Label>
            <div className="flex gap-2">
              <Input
                id="tags"
                placeholder="Add a tag..."
                value={tagInput}
                onChange={(e) => setTagInput(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter") {
                    e.preventDefault();
                    handleAddTag();
                  }
                }}
                disabled={tags.length >= 5}
              />
              <Button
                type="button"
                onClick={handleAddTag}
                disabled={tags.length >= 5 || !tagInput.trim()}
              >
                Add
              </Button>
            </div>
            {tags.length > 0 && (
              <div className="flex flex-wrap gap-2">
                {tags.map((tag, index) => (
                  <Badge key={index} variant="secondary" className="gap-1">
                    {tag}
                    <X
                      className="h-3 w-3 cursor-pointer"
                      onClick={() => handleRemoveTag(index)}
                    />
                  </Badge>
                ))}
              </div>
            )}
          </div>
        </div>

        <DialogFooter>
          <Button
            type="button"
            variant="outline"
            onClick={() => onOpenChange(false)}
          >
            Cancel
          </Button>
          <Button
            type="button"
            onClick={handleSubmit}
            disabled={createRequest.isPending}
          >
            {createRequest.isPending ? "Creating..." : "Find Match"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
