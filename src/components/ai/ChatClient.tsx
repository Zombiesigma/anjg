"use client";

import { useState, useRef, useEffect } from 'react';
import type { FormEvent } from 'react';
import { Bot, Send, Loader2, Sparkles, Lightbulb, HelpCircle, BookOpen, User } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { chatWithEliteraAI } from "@/ai/flows/chat-with-litera-ai";
import type { AiChatMessage } from '@/lib/types';
import { useUser } from '@/firebase';
import { cn } from '@/lib/utils';
import { motion, AnimatePresence } from 'framer-motion';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';

const SUGGESTIONS = [
    { label: "Bantu ide plot fantasi", icon: Sparkles, color: "text-blue-500", bg: "bg-blue-500/5" },
    { label: "Cara jadi penulis Elitera", icon: BookOpen, color: "text-orange-500", bg: "bg-orange-500/5" },
    { label: "Tips mengatasi writer's block", icon: Lightbulb, color: "text-yellow-500", bg: "bg-yellow-500/5" },
    { label: "Cara kerja fitur Story", icon: HelpCircle, color: "text-emerald-500", bg: "bg-emerald-500/5" },
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
        userName: currentUser?.displayName || 'Pujangga Elitera',
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
        content: "Maaf, saya sedang mengalami gangguan sinyal inspirasi. Bisakah kita coba lagi sejenak?",
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

  useEffect(() => {
      if (textareaRef.current) {
          textareaRef.current.style.height = 'auto';
          textareaRef.current.style.height = `${Math.min(textareaRef.current.scrollHeight, 160)}px`;
      }
  }, [input]);

  return (
    <div className="flex flex-col h-full bg-background/50 overflow-hidden relative">
      {/* Background Glows */}
      <div className="absolute top-[-10%] left-[-10%] w-64 h-64 bg-primary/5 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute bottom-[-10%] right-[-10%] w-64 h-64 bg-accent/5 rounded-full blur-3xl pointer-events-none" />

      {/* Area Pesan */}
      <ScrollArea className="flex-1 min-h-0 relative z-10" ref={scrollAreaRef}>
        <div className="max-w-3xl mx-auto p-6 md:p-10 space-y-10 pb-20">
          {messages.length <= 1 && !isLoading && (
            <motion.div 
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                className="py-12 text-center space-y-10"
            >
                <div className="relative inline-flex mb-4">
                    <div className="absolute inset-0 bg-primary/20 blur-3xl rounded-full scale-150 animate-pulse" />
                    <div className="relative p-6 rounded-[2.5rem] bg-white dark:bg-zinc-900 border border-primary/10 shadow-2xl shadow-primary/10">
                        <Bot className="h-16 w-16 text-primary" />
                    </div>
                </div>
                
                <div className="space-y-3">
                    <h2 className="text-3xl md:text-4xl font-headline font-black tracking-tight">Halo, {currentUser?.displayName?.split(' ')[0]}!</h2>
                    <p className="text-muted-foreground max-w-sm mx-auto text-base leading-relaxed font-medium italic">
                        "Saya Elitera AI, rekan kreatif Anda. Ingin membangun plot, menghaluskan draf, atau sekadar berdiskusi sastra?"
                    </p>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 max-w-xl mx-auto">
                    {SUGGESTIONS.map((item, i) => (
                        <motion.button 
                            key={i}
                            initial={{ opacity: 0, y: 10 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: 0.1 * i }}
                            onClick={() => handleSend(item.label)}
                            className="flex items-center gap-4 p-4 rounded-2xl bg-card border border-border/50 hover:border-primary/30 hover:bg-primary/5 transition-all shadow-sm group text-left"
                        >
                            <div className={cn("p-2.5 rounded-xl transition-all group-hover:scale-110", item.bg, item.color)}>
                                <item.icon className="h-5 w-5" />
                            </div>
                            <span className="text-xs font-black uppercase tracking-tight opacity-80 group-hover:opacity-100">{item.label}</span>
                        </motion.button>
                    ))}
                </div>
            </motion.div>
          )}

          <AnimatePresence initial={false}>
            {messages.map((m, i) => (
              <motion.div
                key={i}
                initial={{ opacity: 0, y: 20, scale: 0.98 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                transition={{ duration: 0.4, ease: [0.16, 1, 0.3, 1] }}
                className={cn(
                  "flex items-start gap-4",
                  m.role === "user" ? "flex-row-reverse" : "flex-row"
                )}
              >
                <div className="shrink-0 mt-1">
                    {m.role === "model" ? (
                        <div className="h-10 w-10 rounded-2xl bg-primary flex items-center justify-center shadow-xl shadow-primary/20 ring-1 ring-white/20">
                            <Bot className="h-6 w-6 text-white" />
                        </div>
                    ) : (
                        <Avatar className="h-10 w-10 border-2 border-background shadow-xl">
                            <AvatarImage src={currentUser?.photoURL ?? ''} className="object-cover" />
                            <AvatarFallback className="bg-accent text-white font-black">{currentUser?.displayName?.charAt(0) ?? 'U'}</AvatarFallback>
                        </Avatar>
                    )}
                </div>
                
                <div
                  className={cn(
                    "max-w-[85%] md:max-w-[75%] p-5 md:p-6 rounded-[2rem] shadow-sm leading-relaxed relative",
                    m.role === "user"
                      ? "bg-primary text-white rounded-tr-none shadow-primary/20 ring-1 ring-white/10"
                      : "bg-card border border-border/50 rounded-tl-none font-medium"
                  )}
                >
                  <div className={cn(
                    "prose prose-sm md:prose-base max-w-none break-words dark:prose-invert prose-p:leading-relaxed prose-headings:font-headline prose-headings:mb-2 prose-headings:mt-4 first:prose-headings:mt-0 prose-pre:bg-muted prose-pre:text-muted-foreground prose-blockquote:border-l-4 prose-blockquote:border-primary/30 prose-blockquote:bg-primary/5 prose-blockquote:py-2 prose-blockquote:px-4 prose-blockquote:rounded-r-xl",
                    m.role === "user" ? "prose-invert text-white" : "text-foreground/90"
                  )}>
                    <ReactMarkdown remarkPlugins={[remarkGfm]}>
                      {m.content}
                    </ReactMarkdown>
                  </div>
                  
                  {/* Bubble Tail */}
                  <div className={cn(
                      "absolute top-0 w-4 h-4",
                      m.role === "user" 
                        ? "-right-1 bg-primary [clip-path:polygon(0_0,100%_0,0_100%)]" 
                        : "-left-1 bg-card border-l border-t border-border/50 [clip-path:polygon(0_0,100%_0,100%_100%)]"
                  )} />
                </div>
              </motion.div>
            ))}
            
            {isLoading && (
              <motion.div 
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                className="flex items-start gap-4"
              >
                <div className="h-10 w-10 rounded-2xl bg-primary/10 flex items-center justify-center border border-primary/20">
                    <Bot className="h-6 w-6 text-primary animate-bounce" />
                </div>
                <div className="bg-card border border-border/50 p-5 rounded-3xl rounded-tl-none shadow-sm shadow-black/5">
                    <div className="flex gap-2">
                        <motion.span animate={{ scale: [1, 1.5, 1], opacity: [0.3, 1, 0.3] }} transition={{ repeat: Infinity, duration: 1 }} className="h-2 w-2 rounded-full bg-primary" />
                        <motion.span animate={{ scale: [1, 1.5, 1], opacity: [0.3, 1, 0.3] }} transition={{ repeat: Infinity, duration: 1, delay: 0.2 }} className="h-2 w-2 rounded-full bg-primary" />
                        <motion.span animate={{ scale: [1, 1.5, 1], opacity: [0.3, 1, 0.3] }} transition={{ repeat: Infinity, duration: 1, delay: 0.4 }} className="h-2 w-2 rounded-full bg-primary" />
                    </div>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </ScrollArea>

      {/* Area Input Premium */}
      <div className="p-4 md:p-8 border-t border-border/40 bg-background/95 backdrop-blur-xl shrink-0 z-40 relative pb-[max(1rem,env(safe-area-inset-bottom))] shadow-[0_-15px_40px_-15px_rgba(0,0,0,0.05)]">
        <div className="max-w-3xl mx-auto relative">
            <form onSubmit={handleSubmit} className="relative flex items-end gap-4">
                <div className="relative flex-1 group">
                    <div className="absolute -inset-1 bg-gradient-to-r from-primary/20 to-accent/20 rounded-[2rem] blur opacity-0 group-focus-within:opacity-100 transition-opacity duration-500" />
                    <Textarea
                        ref={textareaRef}
                        value={input}
                        onChange={handleInputChange}
                        placeholder="Tuangkan pertanyaan atau ide Anda..."
                        className="relative w-full resize-none rounded-[1.75rem] border-none bg-muted/40 px-6 py-4 pr-16 min-h-[60px] max-h-40 focus-visible:ring-primary/20 focus-visible:bg-background transition-all shadow-inner text-base font-medium leading-relaxed"
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
                            className="h-11 w-11 rounded-[1.25rem] shadow-xl shadow-primary/30 transition-all active:scale-90 bg-primary hover:bg-primary/90" 
                            disabled={isLoading || !input.trim()}
                        >
                            {isLoading ? <Loader2 className="h-5 w-5 animate-spin" /> : <Send className="h-5 w-5" />}
                        </Button>
                    </div>
                </div>
            </form>
            
            <div className="flex items-center justify-center gap-4 mt-4 opacity-30 select-none">
                <div className="h-px bg-border flex-1" />
                <div className="flex items-center gap-2">
                    <Sparkles className="h-2.5 w-2.5 text-primary" />
                    <p className="text-[8px] font-black uppercase tracking-[0.4em] text-muted-foreground whitespace-nowrap">
                        Elitera Intelligence v1.5
                    </p>
                </div>
                <div className="h-px bg-border flex-1" />
            </div>
        </div>
      </div>
    </div>
  );
}
