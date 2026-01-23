import { users, chatThreads } from '@/lib/placeholder-data';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Send, Smile, Search, MoreVertical } from 'lucide-react';
import { cn } from '@/lib/utils';

const currentUser = users[0];
const activeChat = chatThreads[0];

export default function MessagesPage() {
  return (
    <div className="h-[calc(100vh-theme(spacing.14)-2px)] -mt-6 -mx-4 md:-mx-6 border rounded-lg overflow-hidden">
      <div className="grid grid-cols-12 h-full">
        {/* Chat List */}
        <div className="col-span-12 md:col-span-4 lg:col-span-3 border-r h-full flex flex-col">
          <div className="p-4 border-b">
            <h1 className="text-2xl font-headline font-bold">Messages</h1>
            <div className="relative mt-2">
                <Search className="absolute left-2 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input placeholder="Search chats" className="pl-8" />
            </div>
          </div>
          <ScrollArea className="flex-1">
            {chatThreads.map((thread) => {
              const otherUser = thread.participants.find(p => p.id !== currentUser.id) || thread.participants[0];
              const isActive = thread.id === activeChat.id;
              return (
                <div key={thread.id} className={cn(
                    "flex items-center gap-3 p-3 m-2 rounded-lg cursor-pointer transition-colors",
                    isActive ? "bg-primary/10" : "hover:bg-accent"
                )}>
                  <Avatar>
                    <AvatarImage src={otherUser.avatarUrl} alt={otherUser.name} data-ai-hint="person portrait"/>
                    <AvatarFallback>{otherUser.name.charAt(0)}</AvatarFallback>
                  </Avatar>
                  <div className="flex-1 overflow-hidden">
                    <div className="flex justify-between items-center">
                      <h3 className="font-semibold truncate">{otherUser.name}</h3>
                      <p className="text-xs text-muted-foreground">{thread.lastMessage.timestamp}</p>
                    </div>
                    <div className="flex justify-between items-start">
                      <p className="text-sm text-muted-foreground truncate">{thread.lastMessage.text}</p>
                      {thread.unreadCount > 0 && (
                        <Badge className="h-5 w-5 flex items-center justify-center p-0">{thread.unreadCount}</Badge>
                      )}
                    </div>
                  </div>
                </div>
              )
            })}
          </ScrollArea>
        </div>

        {/* Chat Box */}
        <div className="col-span-12 md:col-span-8 lg:col-span-9 h-full flex-col hidden md:flex">
          <div className="flex items-center justify-between p-3 border-b">
            <div className="flex items-center gap-3">
              <Avatar>
                <AvatarImage src={users[1].avatarUrl} alt={users[1].name} data-ai-hint="person portrait"/>
                <AvatarFallback>{users[1].name.charAt(0)}</AvatarFallback>
              </Avatar>
              <div>
                <h2 className="font-semibold">{users[1].name}</h2>
                <p className="text-xs text-green-500">Online</p>
              </div>
            </div>
            <Button variant="ghost" size="icon"><MoreVertical className="h-5 w-5"/></Button>
          </div>

          <ScrollArea className="flex-1 bg-muted/30">
            <div className="p-6 space-y-6">
                {/* Mock messages */}
                <div className="flex justify-start gap-3">
                    <Avatar className="h-8 w-8"><AvatarImage src={users[1].avatarUrl} data-ai-hint="person portrait"/><AvatarFallback>JD</AvatarFallback></Avatar>
                    <div className="bg-card p-3 rounded-lg rounded-bl-none max-w-md shadow-sm">Hey, did you finish reading my last chapter?</div>
                </div>
                <div className="flex justify-end gap-3">
                    <div className="bg-primary text-primary-foreground p-3 rounded-lg rounded-br-none max-w-md shadow-sm">Almost! The ending was a huge surprise. I'll send my notes over soon.</div>
                    <Avatar className="h-8 w-8"><AvatarImage src={currentUser.avatarUrl} data-ai-hint="man portrait"/><AvatarFallback>GP</AvatarFallback></Avatar>
                </div>
                 <div className="flex justify-start gap-3">
                    <Avatar className="h-8 w-8"><AvatarImage src={users[1].avatarUrl} data-ai-hint="person portrait"/><AvatarFallback>JD</AvatarFallback></Avatar>
                    <div className="bg-card p-3 rounded-lg rounded-bl-none max-w-md shadow-sm">Awesome, can't wait!</div>
                </div>
            </div>
          </ScrollArea>

          <div className="p-4 border-t bg-background">
            <div className="relative">
              <Input placeholder="Type a message..." className="pr-24" />
              <div className="absolute top-1/2 right-2 -translate-y-1/2 flex items-center gap-1">
                <Button variant="ghost" size="icon"><Smile className="h-5 w-5 text-muted-foreground"/></Button>
                <Button size="icon"><Send className="h-5 w-5"/></Button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
