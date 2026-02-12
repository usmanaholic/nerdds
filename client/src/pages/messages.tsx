import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { api } from "@shared/routes";
import { Loader2, Search } from "lucide-react";
import { Input } from "@/components/ui/input";

export default function MessagesPage() {
  const { data: conversations, isLoading } = useQuery({
    queryKey: [api.messages.list.path],
    queryFn: async () => {
       const res = await fetch(api.messages.list.path);
       if (!res.ok) throw new Error("Failed");
       return api.messages.list.responses[200].parse(await res.json());
    }
  });

  const [selectedUser, setSelectedUser] = useState<number | null>(null);

  return (
    <div className="h-[calc(100vh-2rem)] bg-white border rounded-2xl overflow-hidden flex shadow-sm">
       {/* List */}
       <div className="w-full md:w-80 border-r flex flex-col">
          <div className="p-4 border-b">
             <h2 className="font-display font-bold text-xl mb-4">Messages</h2>
             <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input placeholder="Search users..." className="pl-9 bg-neutral-50 border-transparent focus:bg-white transition-colors" />
             </div>
          </div>
          
          <div className="flex-1 overflow-y-auto">
             {isLoading ? (
                <div className="p-8 flex justify-center"><Loader2 className="animate-spin text-muted-foreground" /></div>
             ) : (
                conversations?.map(user => (
                   <div 
                     key={user.id}
                     onClick={() => setSelectedUser(user.id)}
                     className={`p-4 flex items-center gap-3 cursor-pointer hover:bg-neutral-50 transition-colors ${selectedUser === user.id ? 'bg-neutral-100' : ''}`}
                   >
                      <div className="h-12 w-12 rounded-full bg-secondary flex items-center justify-center font-bold text-muted-foreground shrink-0">
                         {user.username[0].toUpperCase()}
                      </div>
                      <div className="min-w-0">
                         <h4 className="font-semibold truncate">{user.username}</h4>
                         <p className="text-sm text-muted-foreground truncate">Tap to chat</p>
                      </div>
                   </div>
                ))
             )}
             
             {conversations?.length === 0 && (
                <div className="p-8 text-center text-muted-foreground text-sm">
                   No conversations yet.
                </div>
             )}
          </div>
       </div>
       
       {/* Chat Area - Placeholder for MVP */}
       <div className="hidden md:flex flex-1 items-center justify-center bg-neutral-50 text-muted-foreground">
          {selectedUser ? (
             <div className="text-center">
                <p>Chat interface implementing...</p>
             </div>
          ) : (
             <div className="text-center">
                <p>Select a conversation to start messaging</p>
             </div>
          )}
       </div>
    </div>
  );
}
