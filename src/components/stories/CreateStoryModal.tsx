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
import { Loader2, X, Palette } from 'lucide-react';
import type { User as AppUser } from '@/lib/types';
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

  // Memastikan scroll/pointer-events kembali normal saat modal ditutup
  useEffect(() => {
    if (!isOpen) {
      form.reset();
      setBgIndex(0);
      // Safety reset untuk pointer events agar layar tidak terkunci
      const timer = setTimeout(() => {
        document.body.style.pointerEvents = '';
      }, 300);
      return () => clearTimeout(timer);
    }
  }, [isOpen, form]);

  async function onSubmit(values: z.infer<typeof storySchema>) {
    if (!firestore || !currentUser || !currentUserProfile) {
        toast({ variant: 'destructive', title: 'Akses Ditolak', description: 'Profil belum termuat.' });
        return;
    }

    setIsSubmitting(true);
    try {
      await addDoc(collection(firestore, 'stories'), {
        type: 'text',
        authorId: currentUser.uid,
        authorName: currentUserProfile.displayName || currentUser.displayName,
        authorAvatarUrl: currentUserProfile.photoURL || currentUser.photoURL || `https://api.dicebear.com/8.x/identicon/svg?seed=${currentUser.uid}`,
        authorRole: currentUserProfile.role || 'pembaca',
        content: values.content,
        background: BACKGROUNDS[bgIndex],
        likes: 0,
        commentCount: 0,
        viewCount: 0,
        createdAt: serverTimestamp(),
      });
      
      onClose();
      toast({ variant: 'success', title: "Terbit!", description: "Momen Anda berhasil diterbitkan." });
    } catch (error) {
      toast({ variant: 'destructive', title: 'Gagal', description: 'Terjadi kendala saat menerbitkan.' });
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent 
        className="max-w-none w-screen h-screen p-0 border-0 m-0 bg-black overflow-hidden flex flex-col rounded-none z-[200]"
        onPointerDownOutside={(e) => e.preventDefault()}
        onInteractOutside={(e) => e.preventDefault()}
        onCloseAutoFocus={(e) => {
            e.preventDefault();
            document.body.style.pointerEvents = '';
        }}
      >
        <DialogHeader className="sr-only">
          <DialogTitle>Tulis Momen</DialogTitle>
          <DialogDescription>Bagikan tulisan inspiratif Anda.</DialogDescription>
        </DialogHeader>

        <div className="absolute top-0 left-0 right-0 p-4 flex items-center justify-between z-[210] bg-gradient-to-b from-black/60 to-transparent">
          <Button variant="ghost" size="icon" className="text-white hover:bg-white/20 rounded-full h-12 w-12" onClick={onClose}>
            <X className="h-6 w-6" />
          </Button>
          <div className="flex items-center gap-3">
             <Button 
                variant="ghost" 
                size="icon" 
                className="text-white hover:bg-white/20 rounded-full h-12 w-12" 
                onClick={() => setBgIndex((bgIndex + 1) % BACKGROUNDS.length)}
                type="button"
             >
                <Palette className="h-6 w-6" />
             </Button>
             <Button 
                className="bg-white text-black hover:bg-white/90 rounded-full px-6 h-10 font-black" 
                onClick={form.handleSubmit(onSubmit)} 
                disabled={isSubmitting || !form.watch('content')?.trim()}
             >
                {isSubmitting ? <Loader2 className="h-4 w-4 animate-spin" /> : "Terbitkan"}
             </Button>
          </div>
        </div>

        <div className={cn(
            "flex-1 relative flex flex-col items-center justify-center bg-gradient-to-br px-8",
            BACKGROUNDS[bgIndex]
        )}>
            <div className="absolute inset-0 opacity-10 bg-[url('https://www.transparenttextures.com/patterns/cubes.png')]" />
            
            <Form {...form}>
                <form className="w-full max-w-2xl relative z-[220]" onSubmit={(e) => e.preventDefault()}>
                    <FormField control={form.control} name="content" render={({ field }) => (
                        <FormItem>
                            <FormControl>
                                <Textarea 
                                    placeholder="Apa yang Anda pikirkan?..." 
                                    className="bg-transparent border-none shadow-none text-3xl md:text-5xl font-headline font-black text-white text-center min-h-[300px] resize-none focus-visible:ring-0 placeholder:text-white/30 leading-tight" 
                                    {...field} 
                                    autoFocus 
                                />
                            </FormControl>
                            <FormMessage className="text-white bg-black/20 backdrop-blur-md rounded-full px-4 py-1 w-fit mx-auto mt-4" />
                        </FormItem>
                    )} />
                </form>
            </Form>

            <div className="absolute bottom-12 left-0 right-0 flex justify-center pointer-events-none">
                <p className="text-[10px] font-black uppercase tracking-[0.3em] text-white/50 px-4 py-2 rounded-full backdrop-blur-md border border-white/10">
                    {form.watch('content')?.length || 0} / 280
                </p>
            </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
