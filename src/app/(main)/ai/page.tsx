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
} from '@/components/ui/sidebar';
import { Button } from '@/components/ui/button';
import { Logo } from '@/components/Logo';
import { MessageSquarePlus, History, Info, Zap, Star } from 'lucide-react';
import { ChatClient } from '@/components/ai/ChatClient';
import type { AiChatMessage } from '@/lib/types';

const initialHistory: AiChatMessage[] = [
    { role: 'model', content: 'Halo! Saya Elitera AI. Senang melihat Anda hari ini. Ada ide cerita yang ingin kita kembangkan atau fitur Elitera yang ingin Anda tanyakan?' }
];

export default function AiPage() {
  return (
    <div className="h-[calc(100vh-theme(spacing.14)-2px)] -mt-6 -mx-4 md:-mx-6 overflow-hidden">
        <SidebarProvider>
            <Sidebar collapsible="icon" className="border-r border-border/50">
                <SidebarHeader className="p-4 border-b">
                    <div className="flex items-center justify-between w-full">
                        <div className="flex items-center gap-3">
                             <Logo className="w-8 h-8 rounded-xl shadow-md" />
                             <div className="group-data-[collapsible=icon]:hidden">
                                <h2 className="text-sm font-black font-headline text-primary leading-none">Elitera AI</h2>
                                <p className="text-[9px] font-bold uppercase tracking-widest text-muted-foreground mt-1">Asisten Menulis</p>
                             </div>
                        </div>
                        <Button variant="ghost" size="icon" className="group-data-[collapsible=icon]:hidden hover:bg-primary/5 rounded-full h-8 w-8">
                            <MessageSquarePlus className="w-4 h-4 text-primary" />
                        </Button>
                    </div>
                </SidebarHeader>
                <SidebarContent className="p-2">
                    <SidebarMenu>
                        <SidebarMenuItem>
                            <SidebarMenuButton className="h-11 rounded-xl">
                                <History className="h-4 w-4 mr-2" />
                                <span className="font-medium text-sm">Obrolan Baru</span>
                            </SidebarMenuButton>
                        </SidebarMenuItem>
                        
                        <div className="px-3 py-4 group-data-[collapsible=icon]:hidden">
                            <p className="text-[10px] font-black uppercase tracking-widest text-muted-foreground/60 mb-4">Kemampuan AI</p>
                            <div className="space-y-4">
                                <div className="flex gap-3">
                                    <div className="h-8 w-8 rounded-lg bg-orange-500/10 flex items-center justify-center shrink-0">
                                        <Zap className="h-4 w-4 text-orange-500" />
                                    </div>
                                    <div>
                                        <p className="text-xs font-bold">Ide Plot Cepat</p>
                                        <p className="text-[10px] text-muted-foreground leading-relaxed mt-0.5">Dapatkan kerangka cerita dalam hitungan detik.</p>
                                    </div>
                                </div>
                                <div className="flex gap-3">
                                    <div className="h-8 w-8 rounded-lg bg-blue-500/10 flex items-center justify-center shrink-0">
                                        <Star className="h-4 w-4 text-blue-500" />
                                    </div>
                                    <div>
                                        <p className="text-xs font-bold">Kritik Sastra</p>
                                        <p className="text-[10px] text-muted-foreground leading-relaxed mt-0.5">Berikan draf Anda dan dapatkan masukan mendalam.</p>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </SidebarMenu>
                </SidebarContent>
                 <SidebarFooter className="mt-auto border-t p-4">
                    <div className="flex items-center gap-3 p-3 rounded-2xl bg-muted/30 border border-border/50 group-data-[collapsible=icon]:hidden">
                        <Info className="h-4 w-4 text-muted-foreground shrink-0" />
                        <p className="text-[10px] leading-relaxed text-muted-foreground font-medium">
                            AI dapat membuat kesalahan. Harap verifikasi informasi penting secara mandiri.
                        </p>
                    </div>
                </SidebarFooter>
            </Sidebar>
            <SidebarInset className="p-0 m-0 bg-background overflow-hidden">
                 <div className="flex items-center gap-4 px-6 h-14 border-b bg-background/95 backdrop-blur-sm z-30 sticky top-0 shadow-sm">
                    <SidebarTrigger className="md:hidden"/>
                    <div className="h-2 w-2 rounded-full bg-green-500 animate-pulse" />
                    <h3 className="font-bold text-sm md:text-base">Percakapan Inspirasi</h3>
                </div>
                <ChatClient history={initialHistory} />
            </SidebarInset>
        </SidebarProvider>
    </div>
  );
}
