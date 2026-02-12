import { Link, useLocation } from "wouter";
import { useAuth } from "@/hooks/use-auth";
import { 
  Home, 
  Search, 
  MessageSquare, 
  User, 
  PlusSquare, 
  LogOut,
  GraduationCap
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { Toaster } from "@/components/ui/toaster";

export default function LayoutShell({ children }: { children: React.ReactNode }) {
  const [location] = useLocation();
  const { user, logout } = useAuth();

  const navItems = [
    { icon: Home, label: "Home", href: user?.universityId ? `/u/${user.universityId}` : "/" },
    { icon: Search, label: "Explore", href: "/explore" },
    { icon: MessageSquare, label: "Messages", href: "/messages" },
    { icon: User, label: "Profile", href: user ? `/profile/${user.username}` : "/auth" },
  ];

  if (location.startsWith("/auth")) {
    return <>{children}</>;
  }

  return (
    <div className="min-h-screen bg-neutral-50 flex flex-col md:flex-row">
      {/* Mobile Header */}
      <div className="md:hidden h-14 bg-white border-b flex items-center justify-between px-4 sticky top-0 z-50">
        <Link href="/" className="font-display font-bold text-xl tracking-tight">nerdds.</Link>
        <Link href="/create">
          <Button size="icon" variant="ghost">
            <PlusSquare className="h-6 w-6" />
          </Button>
        </Link>
      </div>

      {/* Sidebar Navigation (Desktop) */}
      <aside className="hidden md:flex flex-col w-64 h-screen sticky top-0 border-r bg-white px-6 py-8">
        <div className="mb-10 pl-2">
          <Link href="/" className="font-display font-extrabold text-3xl tracking-tighter hover:opacity-80 transition-opacity">
            nerdds.
          </Link>
        </div>

        <nav className="flex-1 space-y-2">
          {navItems.map((item) => {
            const isActive = location === item.href;
            return (
              <Link key={item.href} href={item.href}>
                <div className={cn(
                  "flex items-center gap-4 px-4 py-3 rounded-xl transition-all duration-200 group cursor-pointer",
                  isActive 
                    ? "bg-primary text-primary-foreground shadow-lg shadow-primary/20 font-medium" 
                    : "text-muted-foreground hover:bg-secondary hover:text-foreground"
                )}>
                  <item.icon className={cn("h-6 w-6", isActive ? "stroke-[2.5px]" : "stroke-[2px]")} />
                  <span className="text-base">{item.label}</span>
                </div>
              </Link>
            );
          })}

          <Link href="/create">
             <div className="flex items-center gap-4 px-4 py-3 rounded-xl transition-all duration-200 text-muted-foreground hover:bg-secondary hover:text-foreground cursor-pointer mt-4">
                <PlusSquare className="h-6 w-6 stroke-[2px]" />
                <span className="text-base">Create Post</span>
             </div>
          </Link>
        </nav>

        {user && (
          <div className="mt-auto pt-6 border-t space-y-4">
            <div className="flex items-center gap-3 px-2">
               <div className="h-10 w-10 rounded-full bg-secondary flex items-center justify-center overflow-hidden border">
                 {user.profileImage ? (
                   <img src={user.profileImage} alt={user.username} className="h-full w-full object-cover" />
                 ) : (
                   <span className="font-bold text-lg text-muted-foreground">{user.username.charAt(0).toUpperCase()}</span>
                 )}
               </div>
               <div className="flex-1 min-w-0">
                 <p className="text-sm font-semibold truncate">{user.username}</p>
                 <p className="text-xs text-muted-foreground truncate">{user.level}</p>
               </div>
            </div>
            <Button 
              variant="outline" 
              className="w-full justify-start gap-2 text-muted-foreground hover:text-destructive"
              onClick={() => logout.mutate()}
            >
              <LogOut className="h-4 w-4" />
              Log Out
            </Button>
          </div>
        )}
      </aside>

      {/* Main Content Area */}
      <main className="flex-1 w-full max-w-2xl mx-auto min-h-screen pb-20 md:pb-0 md:px-8 py-4 md:py-8">
        {children}
      </main>

      {/* Right Sidebar (Suggestions etc) - Desktop Only */}
      <aside className="hidden lg:block w-80 h-screen sticky top-0 py-8 px-6 border-l bg-white">
         <div className="bg-secondary/50 rounded-2xl p-6">
            <h3 className="font-display font-bold text-lg mb-4 flex items-center gap-2">
              <GraduationCap className="h-5 w-5" />
              University Updates
            </h3>
            <p className="text-sm text-muted-foreground leading-relaxed">
              Exam season is approaching! Check out the study groups tag to find peers in your department.
            </p>
         </div>
      </aside>

      {/* Mobile Bottom Nav */}
      <div className="md:hidden fixed bottom-0 left-0 right-0 h-16 bg-white border-t flex items-center justify-around z-50 pb-safe">
        {navItems.map((item) => {
          const isActive = location === item.href;
          return (
            <Link key={item.href} href={item.href}>
              <div className={cn(
                "flex flex-col items-center justify-center p-2 transition-colors",
                isActive ? "text-primary" : "text-muted-foreground"
              )}>
                <item.icon className={cn("h-6 w-6", isActive && "fill-current")} strokeWidth={isActive ? 2.5 : 2} />
              </div>
            </Link>
          );
        })}
      </div>
      <Toaster />
    </div>
  );
}
