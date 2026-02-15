import { Switch, Route } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { useAuth } from "@/hooks/use-auth";
import { Loader2 } from "lucide-react";

import NotFound from "@/pages/not-found";
import AuthPage from "@/pages/auth";
import FeedPage from "@/pages/feed";
import PostDetailPage from "@/pages/post-detail";
import ProfilePage from "@/pages/profile";
import MessagesPage from "@/pages/messages";
import CreatePostPage from "@/pages/create-post";
import LayoutShell from "@/components/layout-shell";
import ExplorePage from "@/pages/explore";
function Router() {
  const { user, isLoading } = useAuth();

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!user) {
    return <AuthPage />;
  }

  return (
    <LayoutShell>
      <Switch>
        <Route path="/" component={FeedPage} />
        <Route path="/u/:universityId" component={FeedPage} />
        <Route path="/posts/:id" component={PostDetailPage} />
        <Route path="/create" component={CreatePostPage} />
        <Route path="/profile/:username" component={ProfilePage} />
        <Route path="/messages" component={MessagesPage} />
        <Route path="/explore" component={ExplorePage} />
        <Route component={NotFound} />
      </Switch>
    </LayoutShell>
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <Router />
        <Toaster />
      </TooltipProvider>
    </QueryClientProvider>
  );
}

export default App;
