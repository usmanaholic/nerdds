import { useState } from "react";
import { useAuth } from "@/hooks/use-auth";
import { useExplore } from "@/hooks/use-explore";
import { PostCard } from "@/components/post-card";
import { Loader2, Flame, Users, Zap, TrendingUp, UserPlus } from "lucide-react";
import { Link } from "wouter";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";

export default function ExplorePage() {
  const { user } = useAuth();
  const { data: exploreData, isLoading } = useExplore();
  const [activeTab, setActiveTab] = useState<"trending" | "people" | "topics">("trending");

  if (isLoading) {
    return (
      <div className="flex justify-center items-center min-h-[50vh]">
        <Loader2 className="w-8 h-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  const hasNoFollowers = user && user.followersCount === 0;
  const hasNoPosts = user && (exploreData?.trending.length || 0) === 0;

  return (
    <div className="max-w-6xl mx-auto px-2 md:px-4 py-6">
      {/* Header */}
      <div className="mb-8 px-2">
        <h1 className="font-display font-bold text-4xl mb-2">Explore</h1>
        <p className="text-neutral-600">Discover what's happening on campus</p>
      </div>

      {/* Smart Onboarding Section - Show if user has 0 followers */}
      {hasNoFollowers && (
        <Card className="mb-8 bg-gradient-to-br from-blue-50 to-purple-50 border-blue-200 shadow-sm">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-xl">
              <Zap className="w-6 h-6 text-blue-600" />
              🎯 Start Here - New to Campus?
            </CardTitle>
            <CardDescription className="text-base">
              Get started with Campus Connect and build your campus presence
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <Link href="/create">
                <div className="p-4 bg-white rounded-xl border-2 border-neutral-200 hover:border-blue-400 transition-all cursor-pointer group hover:shadow-md">
                  <div className="text-3xl mb-2">✍️</div>
                  <p className="font-semibold text-base mb-2 group-hover:text-blue-600">Introduce Yourself</p>
                  <p className="text-sm text-neutral-600 mb-3">
                    Write a post about yourself or your interests
                  </p>
                  <Button size="sm" className="w-full">
                    Create Post
                  </Button>
                </div>
              </Link>
              <div className="p-4 bg-white rounded-xl border-2 border-neutral-200 hover:border-purple-400 transition-all cursor-pointer group hover:shadow-md">
                <div className="text-3xl mb-2">🏆</div>
                <p className="font-semibold text-base mb-2 group-hover:text-purple-600">Join a Challenge</p>
                <p className="text-sm text-neutral-600 mb-3">
                  Participate in campus challenges and earn points
                </p>
                <Button size="sm" className="w-full" variant="secondary">
                  View Challenges
                </Button>
              </div>
              <div className="p-4 bg-white rounded-xl border-2 border-neutral-200 hover:border-green-400 transition-all cursor-pointer group hover:shadow-md" onClick={() => setActiveTab("people")}>
                <div className="text-3xl mb-2">🤝</div>
                <p className="font-semibold text-base mb-2 group-hover:text-green-600">Follow People</p>
                <p className="text-sm text-neutral-600 mb-3">
                  Find and follow interesting people from your campus
                </p>
                <Button size="sm" className="w-full" variant="outline">
                  Discover People
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      <div className="max-w-4xl mx-auto">
        {/* Main Content */}
        <div className="space-y-6">
          {/* Tab Navigation */}
          <div className="flex gap-1 bg-neutral-100 p-1 rounded-lg">
            <button
              onClick={() => setActiveTab("trending")}
              className={`flex-1 px-4 py-2.5 font-medium text-sm rounded-md transition-all ${
                activeTab === "trending"
                  ? "bg-white text-black shadow-sm"
                  : "text-neutral-600 hover:text-neutral-900"
              }`}
            >
              <Flame className={`w-4 h-4 inline mr-2 ${activeTab === "trending" ? "text-orange-500" : ""}`} />
              Trending
            </button>
            <button
              onClick={() => setActiveTab("people")}
              className={`flex-1 px-4 py-2.5 font-medium text-sm rounded-md transition-all ${
                activeTab === "people"
                  ? "bg-white text-black shadow-sm"
                  : "text-neutral-600 hover:text-neutral-900"
              }`}
            >
              <Users className={`w-4 h-4 inline mr-2 ${activeTab === "people" ? "text-blue-500" : ""}`} />
              People
            </button>
            <button
              onClick={() => setActiveTab("topics")}
              className={`flex-1 px-4 py-2.5 font-medium text-sm rounded-md transition-all ${
                activeTab === "topics"
                  ? "bg-white text-black shadow-sm"
                  : "text-neutral-600 hover:text-neutral-900"
              }`}
            >
              <TrendingUp className={`w-4 h-4 inline mr-2 ${activeTab === "topics" ? "text-purple-500" : ""}`} />
              Topics
            </button>
          </div>

          {/* Trending Posts Tab */}
          {activeTab === "trending" && (
            <div className="space-y-4">
              <div className="flex items-center gap-2 mb-2">
                <Flame className="w-6 h-6 text-orange-500" />
                <h2 className="font-bold text-xl">Trending Today</h2>
              </div>
              {exploreData?.trending && exploreData.trending.length > 0 ? (
                <div className="space-y-4">
                  {exploreData.trending.map((post) => (
                    <PostCard key={post.id} post={post} />
                  ))}
                </div>
              ) : (
                <Card className="p-12 text-center border-2 border-dashed">
                  <Flame className="w-12 h-12 text-neutral-300 mx-auto mb-3" />
                  <p className="text-neutral-600 font-medium">No trending posts yet</p>
                  <p className="text-sm text-neutral-500 mt-1">Check back soon for hot content!</p>
                </Card>
              )}
            </div>
          )}

          {/* People You Should Know Tab */}
          {activeTab === "people" && (
            <div className="space-y-4">
              <div className="flex items-center gap-2 mb-2">
                <Users className="w-6 h-6 text-blue-500" />
                <h2 className="font-bold text-xl">People You Should Know</h2>
              </div>
              {exploreData?.suggestedUsers && exploreData.suggestedUsers.length > 0 ? (
                <div className="space-y-4">
                  {exploreData.suggestedUsers.map((suggestedUser) => (
                    <Card key={suggestedUser.id} className="hover:shadow-lg transition-all border-2 hover:border-blue-200">
                      <CardContent className="pt-6">
                        <div className="flex items-start gap-3 mb-4">
                          <Avatar className="w-14 h-14 border-2 border-neutral-200">
                            <AvatarImage src={suggestedUser.profileImage || undefined} />
                            <AvatarFallback className="text-lg font-bold bg-gradient-to-br from-blue-400 to-purple-500 text-white">
                              {suggestedUser.username[0].toUpperCase()}
                            </AvatarFallback>
                          </Avatar>
                          <div className="flex-1 min-w-0">
                            <Link href={`/profile/${suggestedUser.username}`}>
                              <p className="font-bold text-base hover:text-blue-600 cursor-pointer truncate">
                                @{suggestedUser.username}
                              </p>
                            </Link>
                            <div className="flex items-center gap-2 mt-1">
                              <Badge variant="secondary" className="text-xs">
                                {suggestedUser.level}
                              </Badge>
                              <span className="text-xs text-neutral-500">
                                {suggestedUser.followersCount} followers
                              </span>
                            </div>
                          </div>
                        </div>
                        {suggestedUser.bio && (
                          <p className="text-sm text-neutral-700 mb-4 line-clamp-2">{suggestedUser.bio}</p>
                        )}
                        <div className="flex gap-2">
                          <Link href={`/profile/${suggestedUser.username}`} className="flex-1">
                            <Button size="sm" className="w-full" variant="outline">
                              View Profile
                            </Button>
                          </Link>
                          <Button size="sm" className="flex-1 bg-black hover:bg-black/90">
                            <UserPlus className="w-4 h-4 mr-1" />
                            Follow
                          </Button>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              ) : (
                <Card className="p-12 text-center border-2 border-dashed">
                  <Users className="w-12 h-12 text-neutral-300 mx-auto mb-3" />
                  <p className="text-neutral-600 font-medium">No suggested people right now</p>
                  <p className="text-sm text-neutral-500 mt-1">More users will appear as the community grows</p>
                </Card>
              )}
            </div>
          )}

          {/* Hot Topics Tab */}
          {activeTab === "topics" && (
            <div className="space-y-4">
              <div className="flex items-center gap-2 mb-2">
                <TrendingUp className="w-6 h-6 text-purple-500" />
                <h2 className="font-bold text-xl">Hot Topics</h2>
              </div>
              {exploreData?.hotTopics && exploreData.hotTopics.length > 0 ? (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  {exploreData.hotTopics.map((topic) => (
                    <Card 
                      key={topic.hashtag} 
                      className="hover:bg-gradient-to-br hover:from-purple-50 hover:to-blue-50 cursor-pointer transition-all border-2 hover:border-purple-300 hover:shadow-md"
                    >
                      <CardContent className="pt-6">
                        <div className="flex items-center justify-between">
                          <div className="flex-1">
                            <p className="font-bold text-lg text-blue-600 mb-1">#{topic.hashtag}</p>
                            <p className="text-sm text-neutral-600">{topic.count} {topic.count === 1 ? 'post' : 'posts'}</p>
                          </div>
                          <TrendingUp className="w-6 h-6 text-purple-400" />
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              ) : (
                <Card className="p-12 text-center border-2 border-dashed">
                  <TrendingUp className="w-12 h-12 text-neutral-300 mx-auto mb-3" />
                  <p className="text-neutral-600 font-medium">No trending topics yet</p>
                  <p className="text-sm text-neutral-500 mt-1">Use hashtags in your posts to create trends!</p>
                </Card>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
