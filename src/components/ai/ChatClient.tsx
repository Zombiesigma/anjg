"use client";

import { useState, useRef, useEffect } from 'react';
import type { FormEvent } from 'react';
import { Bot, Send, Loader2, CornerDownLeft, Sparkles, Lightbulb, HelpCircle, BookOpen } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { chatWithEliteraAI } from "@/ai/flows/chat-with-litera-ai";
import type { AiChatMessage } from '@/lib/types';
import { useUser } from '@/firebase';
import { cn } from '@/lib/utils';
import { motion, AnimatePresence } from 'framer-motion';

const SUGGESTIONS = [
    { label: "Bantu ide plot fantasi", icon: Sparkles },
    { label: "Cara jadi penulis Elitera", icon: BookOpen },
    { label: "Tips mengatasi writer's block", icon: Lightbulb },
    { label: "Cara kerja fitur Story", icon: HelpCircle },
];

export function ChatClient({ history }: { history: AiChatMessage[] }) {
  const { user: currentUser } = useUser();
  const [messages, setMessages] = useState<AiChatMessage[]>(history);
  const [input, setInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const scrollAreaRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  const scrollToBottom = () => {
    if (scrollAreaRef.current) {
        const viewport = scrollAreaRef.current.querySelector('[data-radix-scroll-area-viewport]');
        if (viewport) {
            viewport.scrollTo({
                top: viewport.scrollHeight,
                behavior: 'smooth'
            });
        }
    }
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages, isLoading]);

  const handleInputChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setInput(e.target.value);
  };

  const handleSend = async (text: string) => {
    if (!text.trim() || isLoading) return;

    const userMessage: AiChatMessage = { role: "user", content: text };
    setMessages((prev) => [...prev, userMessage]);
    setInput("");
    setIsLoading(true);

    try {
      const chatHistory = messages.map(msg => ({
        role: msg.role,
        content: msg.content
      }));

      const result = await chatWithEliteraAI({ 
        message: text, 
        chatHistory,
        userName: currentUser?.displayName || 'Teman Elitera',
      });
      
      const assistantMessage: AiChatMessage = {
        role: "model",
        content: result.response,
      };
      setMessages((prev) => [...prev, assistantMessage]);

    } catch (error) {
      console.error("Error with Elitera AI:", error);
      const errorMessage: AiChatMessage = {
        role: "model",
        content: "Maaf, saya sedang mengalami kendala teknis. Bisakah kita coba lagi dalam beberapa saat?",
      };
      setMessages((prev) => [...prev, errorMessage]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSubmit = (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    handleSend(input);
  };

  return (
    <div className="flex flex-col h-full bg-background/50">
      <ScrollArea className="flex-1" ref={scrollAreaRef}>
        <div className="max-w-3xl mx-auto p-4 md:p-8 space-y-8 pb-32">
          
          {/* Welcome Message for Empty State */}
          {messages.length <= 1 && !isLoading && (
            <motion.div 
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="py-10 text-center space-y-6"
            >
                <div className="inline-flex p-4 rounded-3xl bg-primary/5 border border-primary/10">
                    <Bot className="h-12 w-12 text-primary animate-pulse" />
                </div>
                <div className="space-y-2">
                    <h2 className="text-2xl font-headline font-black">Halo, {currentUser?.displayName?.split(' ')[0]}!</h2>
                    <p className="text-muted-foreground max-w-sm mx-auto text-sm leading-relaxed">
                        Saya Elitera AI. Saya siap membantu menyusun plot, memberikan inspirasi menulis, atau menjawab pertanyaan Anda tentang Elitera.
                    </p>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 max-w-lg mx-auto">
                    {SUGGESTIONS.map((item, i) => (
                        <Button 
                            key={i} 
                            variant="outline" 
                            className="justify-start h-auto py-3 px-4 rounded-xl hover:bg-primary/5 hover:border-primary/20 transition-all group"
                            onClick={() => handleSend(item.label)}
                        >
                            <item.icon className="h-4 w-4 mr-3 text-primary/60 group-hover:text-primary transition-colors" />
                            <span className="text-xs font-semibold">{item.label}</span>
                        </Button>
                    ))}
                </div>
            </motion.div>
          )}

          <AnimatePresence initial={false}>
            {messages.map((m, i) => (
              <motion.div
                key={i}
                initial={{ opacity: 0, y: 10, scale: 0.98 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                transition={{ duration: 0.3 }}
                className={cn(
                  "flex items-start gap-4",
                  m.role === "user" ? "flex-row-reverse" : "flex-row"
                )}
              >
                <div className="shrink-0 mt-1">
                    {m.role === "model" ? (
                        <div className="h-9 w-9 rounded-xl bg-primary flex items-center justify-center shadow-lg shadow-primary/20">
                            <Bot className="h-5 w-5 text-white" />
                        </div>
                    ) : (
                        <Avatar className="h-9 w-9 border-2 border-background shadow-md">
                            <AvatarImage src={currentUser?.photoURL ?? ''} />
                            <AvatarFallback className="bg-accent text-white font-bold">{currentUser?.displayName?.charAt(0) ?? 'U'}</AvatarFallback>
                        </Avatar>
                    )}
                </div>
                
                <div
                  className={cn(
                    "max-w-[85%] md:max-w-[70%] p-4 rounded-2xl shadow-sm leading-relaxed text-sm md:text-base",
                    m.role === "user"
                      ? "bg-primary text-primary-foreground rounded-tr-none"
                      : "bg-card border border-border/50 rounded-tl-none font-medium text-foreground/90"
                  )}
                >
                  <p className="whitespace-pre-wrap">{m.content}</p>
                </div>
              </motion.div>
            ))}
            
            {isLoading && (
              <motion.div 
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                className="flex items-start gap-4"
              >
                <div className="h-9 w-9 rounded-xl bg-primary/10 flex items-center justify-center">
                    <Bot className="h-5 w-5 text-primary animate-bounce" />
                </div>
                <div className="bg-card border border-border/50 p-4 rounded-2xl rounded-tl-none shadow-sm">
                    <div className="flex gap-1.5">
                        <motion.span animate={{ opacity: [0.3, 1, 0.3] }} transition={{ repeat: Infinity, duration: 1 }} className="h-2 w-2 rounded-full bg-primary/40" />
                        <motion.span animate={{ opacity: [0.3, 1, 0.3] }} transition={{ repeat: Infinity, duration: 1, delay: 0.2 }} className="h-2 w-2 rounded-full bg-primary/40" />
                        <motion.span animate={{ opacity: [0.3, 1, 0.3] }} transition={{ repeat: Infinity, duration: 1, delay: 0.4 }} className="h-2 w-2 rounded-full bg-primary/40" />
                    </div>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </ScrollArea>

      <div className="p-4 md:p-6 border-t bg-background/80 backdrop-blur-md shrink-0">
        <div className="max-w-3xl mx-auto">
            <form onSubmit={handleSubmit} className="relative flex items-end gap-3">
                <div className="relative flex-1 group">
                    <Textarea
                        ref={textareaRef}
                        value={input}
                        onChange={handleInputChange}
                        placeholder="Tanyakan sesuatu pada Elitera AI..."
                        className="w-full resize-none rounded-2xl border-none bg-muted/50 px-5 py-4 pr-14 min-h-[56px] max-h-40 focus-visible:ring-primary/20 focus-visible:bg-muted/80 transition-all shadow-inner"
                        onKeyDown={(e) => {
                            if (e.key === 'Enter' && !e.shiftKey) {
                                e.preventDefault();
                                handleSend(input);
                            }
                        }}
                        rows={1}
                        disabled={isLoading}
                    />
                    <div className="absolute right-2 bottom-2">
                        <Button 
                            type="submit" 
                            size="icon" 
                            className="h-10 w-10 rounded-xl shadow-lg transition-all active:scale-90" 
                            disabled={isLoading || !input.trim()}
                        >
                            {isLoading ? <Loader2 className="h-5 w-5 animate-spin" /> : <Send className="h-5 w-5" />}
                        </Button>
                    </div>
                </div>
            </form>
            <div className="flex items-center justify-center gap-4 mt-3 opacity-40 select-none">
                <div className="h-px bg-border flex-1" />
                <p className="text-[10px] font-black uppercase tracking-[0.2em] text-muted-foreground whitespace-nowrap">
                    Didukung oleh Elitera Intelligence
                </p>
                <div className="h-px bg-border flex-1" />
            </div>
        </div>
      </div>
    </div>
  );
}
