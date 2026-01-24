"use client";

import { useState, useRef, useEffect } from 'react';
import type { FormEvent } from 'react';
import { Bot, Send, Loader2, User, CornerDownLeft } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { chatWithLiteraAI } from "@/ai/flows/chat-with-litera-ai";
import type { AiChatMessage } from '@/lib/types';
import { useUser } from '@/firebase';
import { cn } from '@/lib/utils';
import { motion, AnimatePresence } from 'framer-motion';

export function ChatClient({ history }: { history: AiChatMessage[] }) {
  const { user: currentUser } = useUser();
  const [messages, setMessages] = useState<AiChatMessage[]>(history);
  const [input, setInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const scrollAreaRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    if (scrollAreaRef.current) {
        const viewport = scrollAreaRef.current.querySelector('div');
        if (viewport) {
            viewport.scrollTop = viewport.scrollHeight;
        }
    }
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const handleInputChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setInput(e.target.value);
  };

  const handleSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!input.trim() || isLoading) return;

    const userMessage: AiChatMessage = { role: "user", content: input };
    setMessages((prev) => [...prev, userMessage]);
    setInput("");
    setIsLoading(true);

    try {
      const chatHistory = messages.map(msg => ({
        role: msg.role,
        content: msg.content
      }));

      const result = await chatWithLiteraAI({ 
        message: input, 
        chatHistory,
        userName: currentUser?.displayName || 'Pengguna',
      });
      
      const assistantMessage: AiChatMessage = {
        role: "model",
        content: result.response,
      };
      setMessages((prev) => [...prev, assistantMessage]);

    } catch (error) {
      console.error("Error with Litera AI:", error);
      const errorMessage: AiChatMessage = {
        role: "model",
        content: "Maaf, saya mengalami kesalahan. Silakan coba lagi.",
      };
      setMessages((prev) => [...prev, errorMessage]);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="flex flex-col h-full">
      <ScrollArea className="flex-1" ref={scrollAreaRef}>
        <div className="p-4 md:p-6 space-y-6">
          <AnimatePresence>
            {messages.map((m, i) => (
              <motion.div
                key={i}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.3, ease: "easeOut" }}
                className={cn(
                  "flex items-start gap-3",
                  m.role === "user" && "justify-end"
                )}
              >
                {m.role === "model" && (
                   <Avatar className="w-8 h-8 border-2 border-primary">
                    <AvatarFallback><Bot size={18} /></AvatarFallback>
                  </Avatar>
                )}
                <div
                  className={cn(
                    "max-w-xl p-3 rounded-xl shadow-sm",
                    m.role === "user"
                      ? "bg-primary text-primary-foreground rounded-br-none"
                      : "bg-card border rounded-bl-none"
                  )}
                >
                  <p className="whitespace-pre-wrap">{m.content}</p>
                </div>
                 {m.role === "user" && (
                   <Avatar className="w-8 h-8">
                    <AvatarImage src={currentUser?.photoURL ?? ''} alt={currentUser?.displayName ?? ''} />
                    <AvatarFallback>{currentUser?.displayName?.charAt(0) ?? 'U'}</AvatarFallback>
                  </Avatar>
                )}
              </motion.div>
            ))}
            {isLoading && (
              <motion.div 
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.3, ease: "easeOut" }}
                className="flex items-start gap-3"
              >
                <Avatar className="w-8 h-8 border-2 border-primary">
                    <AvatarFallback><Bot size={18} /></AvatarFallback>
                </Avatar>
                <div className="max-w-xl p-3 rounded-xl shadow-sm bg-card border rounded-bl-none">
                    <div className="flex items-center gap-2 text-muted-foreground">
                        <Loader2 className="w-5 h-5 animate-spin" />
                        <span>Litera Sedang Berpikir...</span>
                    </div>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </ScrollArea>
      <div className="p-4 border-t bg-background">
        <form onSubmit={handleSubmit} className="relative">
          <Textarea
            value={input}
            onChange={handleInputChange}
            placeholder="Tanyakan apa saja pada Litera AI..."
            className="w-full pr-20 resize-none"
            onKeyDown={(e) => {
              if (e.key === 'Enter' && !e.shiftKey) {
                e.preventDefault();
                handleSubmit(e as unknown as FormEvent<HTMLFormElement>);
              }
            }}
            disabled={isLoading}
          />
          <div className="absolute top-1/2 right-3 -translate-y-1/2 flex items-center gap-2">
             <p className="text-xs text-muted-foreground hidden sm:block">
                <kbd className="pointer-events-none inline-flex h-5 select-none items-center gap-1 rounded border bg-muted px-1.5 font-mono text-[10px] font-medium text-muted-foreground opacity-100">
                    <CornerDownLeft className="h-3 w-3" /> Shift+Enter untuk baris baru
                </kbd>
            </p>
            <Button type="submit" size="icon" disabled={isLoading || !input.trim()}>
                {isLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
                <span className="sr-only">Kirim</span>
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}
