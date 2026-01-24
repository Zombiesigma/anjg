import {
  SidebarProvider,
  Sidebar,
  SidebarHeader,
  SidebarContent,
  SidebarInset,
  SidebarTrigger,
  SidebarMenu,
  SidebarMenuItem,
  SidebarMenuButton,
  SidebarFooter,
  SidebarMenuAction
} from '@/components/ui/sidebar';
import { Button } from '@/components/ui/button';
import { Logo } from '@/components/Logo';
import { MessageSquarePlus, Trash2 } from 'lucide-react';
import { ChatClient } from '@/components/ai/ChatClient';
import type { AiChatMessage } from '@/lib/types';
import { Separator } from '@/components/ui/separator';

const initialHistory: AiChatMessage[] = [
    { role: 'model', content: 'Halo! Saya Litera AI. Ada yang bisa saya bantu dengan tulisan, riset, atau rekomendasi buku Anda hari ini?' }
];

export default function AiPage() {
  return (
    <div className="h-[calc(100vh-theme(spacing.14)-2px)] -mt-6 -mx-4 md:-mx-6">
        <SidebarProvider>
            <Sidebar collapsible="icon">
                <SidebarHeader className="border-b">
                    <div className="flex items-center justify-between w-full">
                        <div className="flex items-center gap-2">
                             <Logo className="w-7 h-7" />
                             <h2 className="text-lg font-semibold font-headline text-primary group-data-[collapsible=icon]:hidden">Litera AI</h2>
                        </div>
                        <Button variant="ghost" size="icon" className="group-data-[collapsible=icon]:hidden">
                            <MessageSquarePlus className="w-5 h-5" />
                        </Button>
                    </div>
                </SidebarHeader>
                <SidebarContent>
                    <SidebarMenu>
                        {/* Chat history list can be implemented here */}
                    </SidebarMenu>
                </SidebarContent>
                 <SidebarFooter className="mt-auto border-t p-2">
                    <p className="text-xs text-muted-foreground group-data-[collapsible=icon]:hidden px-2">
                        Litera AI dapat membuat kesalahan. Pertimbangkan untuk memeriksa informasi penting.
                    </p>
                </SidebarFooter>
            </Sidebar>
            <SidebarInset className="p-0 m-0 !min-h-0 rounded-none shadow-none">
                 <div className="flex items-center gap-2 p-2 border-b h-[var(--sidebar-header-height)]">
                    <SidebarTrigger className="md:hidden"/>
                    <h3 className="font-semibold">Obrolan Baru</h3>
                </div>
                <ChatClient history={initialHistory} />
            </SidebarInset>
        </SidebarProvider>
    </div>
  );
}
