
'use client';

import { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { useFirestore, useUser } from '@/firebase';
import { collection, addDoc, serverTimestamp } from 'firebase/firestore';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Form, FormControl, FormField, FormItem, FormMessage } from '@/components/ui/form';
import { useToast } from '@/hooks/use-toast';
import { Loader2, X, Check, Type, Palette } from 'lucide-react';
import type { User as AppUser } from '@/lib/types';
import { motion, AnimatePresence } from 'framer-motion';
import { cn } from '@/lib/utils';

const storySchema = z.object({
  content: z.string().min(1, "Konten tidak boleh kosong.").max(280, "Maksimal 280 karakter."),
});

interface CreateStoryModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentUserProfile: AppUser | null;
}

const BACKGROUNDS = [
  "from-indigo-600 to-rose-500",
  "from-emerald-500 to-teal-700",
  "from-orange-500 to-yellow-500",
  "from-purple-600 to-blue-500",
  "from-rose-400 to-red-600",
  "from-slate-800 to-slate-950",
];

export function CreateStoryModal({ isOpen, onClose, currentUserProfile }: CreateStoryModalProps) {
  const firestore = useFirestore();
  const { user: currentUser } = useUser();
  const { toast } = useToast();
  
  const [bgIndex, setBgIndex] = useState(0);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const form = useForm<z.infer<typeof storySchema>>({
    resolver: zodResolver(storySchema),
    defaultValues: { content: "" },
  });

  useEffect(() => {
    if (!isOpen) {
      const timer = setTimeout(() => {
        form.reset();
        setBgIndex(0);
        document.body.style.pointerEvents = '';
      }, 300);
      return () => clearTimeout(timer);
    }
  }, [isOpen, form]);

  async function onSubmit(values: z.infer<typeof storySchema>) {
    if (!firestore || !currentUser || !currentUserProfile) return;
    setIsSubmitting(true);
    try {
      await addDoc(collection(firestore, 'stories'), {
        type: 'text',
        authorId: currentUser.uid,
        authorName: currentUser.displayName || currentUserProfile.displayName,
        authorAvatarUrl: currentUser.photoURL || currentUserProfile.photoURL,
        authorRole: currentUserProfile.role,
        content: values.content,
        background: BACKGROUNDS[bgIndex],
        likes: 0,
        commentCount: 0,
        viewCount: 0,
        createdAt: serverTimestamp(),
      });
      
      onClose();
      setTimeout(() => toast({ title: "Cerita Teks Diterbitkan!" }), 100);
    } catch (error) {
      console.error(error);
      toast({ variant: 'destructive', title: 'Gagal menerbitkan cerita.' });
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent 
        className="max-w-none w-screen h-screen p-0 border-0 m-0 bg-black overflow-hidden flex flex-col rounded-none z-[100]"
        onCloseAutoFocus={(e) => { e.preventDefault(); document.body.style.pointerEvents = ''; }}
      >
        <DialogHeader className="sr-only">
          <DialogTitle>Buat Cerita Teks</DialogTitle>
          <DialogDescription>Bagikan pemikiran Anda melalui kata-kata.</DialogDescription>
        </DialogHeader>

        <div className="absolute top-0 left-0 right-0 p-4 flex items-center justify-between z-[110] bg-gradient-to-b from-black/40 to-transparent">
          <Button variant="ghost" size="icon" className="text-white hover:bg-white/20 rounded-full" onClick={onClose}>
            <X className="h-6 w-6" />
          </Button>
          <div className="flex items-center gap-2">
             <Button variant="ghost" size="icon" className="text-white hover:bg-white/20 rounded-full" onClick={() => setBgIndex((bgIndex + 1) % BACKGROUNDS.length)}>
                <Palette className="h-5 w-5" />
             </Button>
             <Button 
                variant="ghost" 
                className="text-white font-black uppercase tracking-widest text-xs" 
                onClick={form.handleSubmit(onSubmit)} 
                disabled={isSubmitting || !form.watch('content')?.trim()}
             >
                {isSubmitting ? <Loader2 className="h-4 w-4 animate-spin" /> : "Terbitkan"}
             </Button>
          </div>
        </div>

        <div className={cn(
            "flex-1 relative flex flex-col items-center justify-center transition-all duration-700 bg-gradient-to-br px-8",
            BACKGROUNDS[bgIndex]
        )}>
            <div className="absolute inset-0 opacity-10 bg-[url('https://www.transparenttextures.com/patterns/cubes.png')]" />
            
            <Form {...form}>
                <form className="w-full max-w-lg relative z-10">
                    <FormField control={form.control} name="content" render={({ field }) => (
                        <FormItem>
                            <FormControl>
                                <Textarea 
                                    placeholder="Apa yang Anda pikirkan hari ini?..." 
                                    className="bg-transparent border-none shadow-none text-3xl md:text-5xl font-headline font-black text-white text-center min-h-[300px] resize-none focus-visible:ring-0 placeholder:text-white/20" 
                                    {...field} 
                                    autoFocus 
                                />
                            </FormControl>
                            <FormMessage className="text-white/80 text-center font-bold" />
                        </FormItem>
                    )} />
                </form>
            </Form>

            <div className="absolute bottom-12 left-0 right-0 flex flex-col items-center gap-4 px-8">
                <p className={cn(
                    "text-[10px] font-black uppercase tracking-[0.2em] transition-all",
                    form.watch('content')?.length > 250 ? "text-yellow-300" : "text-white/40"
                )}>
                    {form.watch('content')?.length || 0} / 280 Karakter
                </p>
            </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
