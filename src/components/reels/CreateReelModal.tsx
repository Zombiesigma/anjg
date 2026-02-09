'use client';

import { useState, useEffect, useRef } from 'react';
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
import { Input } from "@/components/ui/input";
import { Form, FormControl, FormField, FormItem, FormMessage } from '@/components/ui/form';
import { useToast } from '@/hooks/use-toast';
import { Loader2, X, ArrowLeft, Sparkles, Send, Video, Film, Trash2 } from 'lucide-react';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import type { User as AppUser } from '@/lib/types';
import { uploadVideo } from '@/lib/uploader';
import { motion, AnimatePresence } from 'framer-motion';

const reelSchema = z.object({
  caption: z.string().max(500, "Caption maksimal 500 karakter."),
});

interface CreateReelModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentUserProfile: AppUser | null;
}

export function CreateReelModal({ isOpen, onClose, currentUserProfile }: CreateReelModalProps) {
  const firestore = useFirestore();
  const { user: currentUser } = useUser();
  const { toast } = useToast();
  
  const [videoUrl, setVideoUrl] = useState<string | null>(null);
  const [videoFile, setVideoFile] = useState<File | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  const videoInputRef = useRef<HTMLInputElement>(null);

  const form = useForm<z.infer<typeof reelSchema>>({
    resolver: zodResolver(reelSchema),
    defaultValues: { caption: "" },
  });

  const resetState = () => {
    setVideoUrl(null);
    setVideoFile(null);
    setIsSubmitting(false);
    form.reset();
  };

  useEffect(() => {
    if (!isOpen) resetState();
  }, [isOpen]);

  const handleVideoSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.size > 20 * 1024 * 1024) {
        toast({ variant: 'destructive', title: 'Video Terlalu Besar', description: 'Maksimal 20MB.' });
        return;
      }
      const url = URL.createObjectURL(file);
      setVideoUrl(url);
      setVideoFile(file);
    }
  };

  async function onSubmit(values: z.infer<typeof reelSchema>) {
    if (!firestore || !currentUser || !currentUserProfile || !videoFile) return;
    setIsSubmitting(true);
    try {
      // Hanya gunakan GitHub untuk video
      const permanentVideoUrl = await uploadVideo(videoFile);

      await addDoc(collection(firestore, 'reels'), {
        authorId: currentUser.uid,
        authorName: currentUserProfile.displayName,
        authorAvatarUrl: currentUserProfile.photoURL,
        authorRole: currentUserProfile.role,
        caption: values.caption,
        videoUrl: permanentVideoUrl,
        likes: 0,
        commentCount: 0,
        viewCount: 0,
        createdAt: serverTimestamp(),
      });
      
      onClose();
      toast({ variant: 'success', title: "Reel Terbit!", description: "Video Anda telah dipublikasikan secara permanen." });
    } catch (error: any) {
      console.error(error);
      toast({ variant: 'destructive', title: 'Gagal', description: error.message || 'Gagal menerbitkan Reel.' });
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && !isSubmitting && onClose()}>
      <DialogContent 
        className="max-w-none w-screen h-screen p-0 border-0 m-0 bg-black overflow-hidden flex flex-col rounded-none z-[200] focus:outline-none"
        onCloseAutoFocus={(e) => { e.preventDefault(); document.body.style.pointerEvents = ''; }}
      >
        <DialogHeader className="sr-only">
          <DialogTitle>Buat Reel Baru</DialogTitle>
          <DialogDescription>Bagikan karya video permanen Anda.</DialogDescription>
        </DialogHeader>

        {/* Header */}
        <div className="absolute top-0 left-0 right-0 p-6 flex items-center justify-between z-[210] bg-gradient-to-b from-black/80 to-transparent">
          <Button variant="ghost" size="icon" className="text-white hover:bg-white/10 rounded-full h-12 w-12" onClick={onClose} disabled={isSubmitting}>
            <X className="h-6 w-6" />
          </Button>
          
          <div className="flex items-center gap-3">
             {videoUrl && (
                <Button 
                    className="bg-primary text-white hover:bg-primary/90 rounded-full px-8 h-12 font-black uppercase text-[10px] tracking-[0.2em] shadow-2xl" 
                    onClick={form.handleSubmit(onSubmit)} 
                    disabled={isSubmitting}
                >
                    {isSubmitting ? <Loader2 className="h-4 w-4 animate-spin" /> : <><Sparkles className="mr-2 h-4 w-4" /> Terbitkan Reel</>}
                </Button>
             )}
          </div>
        </div>

        {/* Content */}
        <div className="flex-1 relative overflow-hidden flex flex-col items-center justify-center">
            <AnimatePresence mode="wait">
                {!videoUrl ? (
                    <motion.div 
                        key="choice"
                        initial={{ opacity: 0, scale: 0.9 }}
                        animate={{ opacity: 1, scale: 1 }}
                        className="flex flex-col items-center gap-8 px-8"
                    >
                        <div className="p-8 rounded-[3rem] bg-white/5 border border-white/10 shadow-2xl">
                            <Film className="h-20 w-20 text-primary animate-pulse" />
                        </div>
                        <div className="text-center space-y-3">
                            <h2 className="text-white text-4xl font-headline font-black tracking-tight">Karya <span className="text-primary italic">Video.</span></h2>
                            <p className="text-white/40 text-sm font-medium">Unggah video permanen ke koleksi Reels Anda.</p>
                        </div>
                        <Button 
                            size="lg" 
                            className="h-16 rounded-2xl px-10 font-black text-lg gap-3"
                            onClick={() => videoInputRef.current?.click()}
                        >
                            <Video className="h-6 w-6" /> Pilih Video
                        </Button>
                        <input type="file" ref={videoInputRef} className="hidden" accept="video/*" onChange={handleVideoSelect} />
                    </motion.div>
                ) : (
                    <motion.div 
                        key="preview"
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        className="w-full h-full flex flex-col md:flex-row bg-black"
                    >
                        <div className="flex-1 relative bg-black flex items-center justify-center">
                            <video src={videoUrl} className="w-full h-full object-contain md:rounded-3xl p-2" autoPlay loop playsInline />
                            <button 
                                onClick={() => setVideoUrl(null)}
                                className="absolute bottom-6 left-6 bg-rose-500 text-white p-3 rounded-full shadow-xl hover:bg-rose-600 transition-all"
                            >
                                <Trash2 className="h-5 w-5" />
                            </button>
                        </div>
                        
                        <div className="w-full md:w-96 p-8 bg-zinc-900 flex flex-col gap-6 pt-20 md:pt-32">
                            <div className="flex items-center gap-4">
                                <Avatar className="h-12 w-12 border-2 border-white/10">
                                    <AvatarImage src={currentUserProfile?.photoURL} />
                                    <AvatarFallback>{currentUserProfile?.displayName?.charAt(0)}</AvatarFallback>
                                </Avatar>
                                <div>
                                    <p className="text-white font-black text-sm">{currentUserProfile?.displayName}</p>
                                    <p className="text-white/40 text-[10px] font-bold uppercase tracking-widest">Membuat Reel</p>
                                </div>
                            </div>

                            <Form {...form}>
                                <form onSubmit={(e) => e.preventDefault()} className="space-y-4">
                                    <FormField control={form.control} name="caption" render={({ field }) => (
                                        <FormItem>
                                            <FormControl>
                                                <Input 
                                                    placeholder="Tulis caption menarik..." 
                                                    className="bg-white/5 border-white/10 text-white h-14 rounded-xl px-5 focus-visible:ring-primary/50"
                                                    {...field}
                                                />
                                            </FormControl>
                                            <FormMessage />
                                        </FormItem>
                                    )} />
                                </form>
                            </Form>
                            
                            <div className="p-6 rounded-2xl bg-white/5 border border-white/10">
                                <p className="text-[10px] font-black text-white/40 uppercase tracking-widest mb-2">Informasi</p>
                                <p className="text-xs text-white/60 leading-relaxed italic">
                                    Reels berbeda dengan Story. Reels bersifat permanen dan akan tampil di tab khusus Reels untuk dilihat semua orang.
                                </p>
                            </div>
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
      </DialogContent>
    </Dialog>
  );
}