import { useRoute } from "wouter";
import { useQuery } from "@tanstack/react-query";
import { api, buildUrl } from "@shared/routes";
import { useAuth } from "@/hooks/use-auth";
import { Button } from "@/components/ui/button";
import { Loader2, MapPin, Calendar, Award, BookOpen } from "lucide-react";
import { format } from "date-fns";

export default function ProfilePage() {
  const [match, params] = useRoute("/profile/:username");
  const username = params?.username;
  const { user: currentUser } = useAuth();
  
  const { data: profile, isLoading } = useQuery({
    queryKey: [api.users.get.path, username],
    queryFn: async () => {
      if (!username) return null;
      const url = buildUrl(api.users.get.path, { username });
      const res = await fetch(url);
      if (!res.ok) throw new Error("User not found");
      return api.users.get.responses[200].parse(await res.json());
    },
    enabled: !!username,
  });

  if (isLoading) return <div className="flex justify-center p-20"><Loader2 className="animate-spin" /></div>;
  if (!profile) return <div className="text-center p-20">User not found</div>;

  const isOwnProfile = currentUser?.username === profile.username;

  return (
    <div className="max-w-2xl mx-auto">
      {/* Profile Header */}
      <div className="bg-white border rounded-2xl overflow-hidden mb-6">
        <div className="h-32 bg-gradient-to-r from-neutral-800 to-neutral-900 relative">
          {/* Cover image placeholder */}
        </div>
        
        <div className="px-6 pb-6">
          <div className="relative flex justify-between items-end -mt-12 mb-4">
             <div className="h-24 w-24 rounded-full border-4 border-white bg-white overflow-hidden shadow-sm">
                {profile.profileImage ? (
                   <img src={profile.profileImage} alt={profile.username} className="h-full w-full object-cover" />
                ) : (
                   <div className="h-full w-full bg-secondary flex items-center justify-center text-3xl font-bold text-muted-foreground">
                      {profile.username[0].toUpperCase()}
                   </div>
                )}
             </div>
             
             {!isOwnProfile && (
                <Button className="rounded-full px-6">Follow</Button>
             )}
             {isOwnProfile && (
                <Button variant="outline" className="rounded-full px-6">Edit Profile</Button>
             )}
          </div>
          
          <div>
             <h1 className="font-display font-bold text-2xl">{profile.username}</h1>
             <p className="text-muted-foreground text-sm flex items-center gap-2 mt-1">
                <Award className="h-4 w-4 text-orange-500" />
                <span className="font-medium text-foreground">{profile.level}</span>
                <span className="text-neutral-300">•</span>
                <span>{profile.points} Points</span>
             </p>
          </div>

          <div className="mt-4 space-y-2">
             {profile.bio && <p className="text-sm text-neutral-700">{profile.bio}</p>}
             
             <div className="flex flex-wrap gap-x-6 gap-y-2 text-sm text-muted-foreground mt-4">
                {profile.department && (
                   <div className="flex items-center gap-1.5">
                      <BookOpen className="h-4 w-4" />
                      <span>{profile.department}</span>
                   </div>
                )}
                {profile.semester && (
                   <div className="flex items-center gap-1.5">
                      <Calendar className="h-4 w-4" />
                      <span>Semester {profile.semester}</span>
                   </div>
                )}
                <div className="flex items-center gap-1.5">
                   <Calendar className="h-4 w-4" />
                   <span>Joined {format(new Date(profile.createdAt), "MMMM yyyy")}</span>
                </div>
             </div>
          </div>
          
          <div className="flex gap-6 mt-6 pt-6 border-t">
             <div className="text-center">
                <span className="block font-bold text-lg">{profile.followersCount}</span>
                <span className="text-xs text-muted-foreground uppercase tracking-wider">Followers</span>
             </div>
             <div className="text-center">
                <span className="block font-bold text-lg">{profile.followingCount}</span>
                <span className="text-xs text-muted-foreground uppercase tracking-wider">Following</span>
             </div>
          </div>
        </div>
      </div>
      
      {/* User's Posts would go here */}
      <div className="text-center py-10 border rounded-2xl bg-white text-muted-foreground">
         <p>Posts history coming soon.</p>
      </div>
    </div>
  );
}
