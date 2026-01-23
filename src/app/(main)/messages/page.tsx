import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Send, Smile, Search, MoreVertical, MessageSquare } from 'lucide-react';
import { cn } from '@/lib/utils';

export default function MessagesPage() {
  return (
    <div className="h-[calc(100vh-theme(spacing.14)-2px)] -mt-6 -mx-4 md:-mx-6 border rounded-lg overflow-hidden">
      <div className="grid grid-cols-12 h-full">
        {/* Chat List */}
        <div className="col-span-12 md:col-span-4 lg:col-span-3 border-r h-full flex flex-col">
          <div className="p-4 border-b">
            <h1 className="text-2xl font-headline font-bold">Pesan</h1>
            <div className="relative mt-2">
                <Search className="absolute left-2 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input placeholder="Cari obrolan" className="pl-8" />
            </div>
          </div>
          <ScrollArea className="flex-1">
            <div className="p-4 text-center text-sm text-muted-foreground">
              Tidak ada pesan.
            </div>
          </ScrollArea>
        </div>

        {/* Chat Box */}
        <div className="col-span-12 md:col-span-8 lg:col-span-9 h-full flex-col hidden md:flex items-center justify-center bg-muted/20">
          <div className="text-center">
            <MessageSquare className="h-16 w-16 mx-auto text-muted-foreground/50" />
            <h2 className="mt-4 text-xl font-semibold">Pilih obrolan</h2>
            <p className="text-muted-foreground mt-1">Pilih dari obrolan yang ada, atau mulai yang baru.</p>
          </div>
        </div>
      </div>
    </div>
  )
}
