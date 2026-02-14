import { useState } from "react";
import { useLocation } from "wouter";
import { CreatePostDialog } from "@/components/create-post-dialog";

export default function CreatePostPage() {
  const [, setLocation] = useLocation();
  const [open, setOpen] = useState(true);

  const handleOpenChange = (nextOpen: boolean) => {
    setOpen(nextOpen);
    if (!nextOpen) {
      setLocation("/");
    }
  };

  return (
    <div className="max-w-xl mx-auto pt-8">
      <CreatePostDialog
        open={open}
        onOpenChange={handleOpenChange}
        hideTrigger
      />
    </div>
  );
}
