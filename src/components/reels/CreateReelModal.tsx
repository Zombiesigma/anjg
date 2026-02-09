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
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { useToast } from '@/hooks/use-toast';
import { Loader2, X, Sparkles, Video, Film, Trash2, User } from 'lucide-react';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import type { User as AppUser } from '@/lib/types';
import { uploadVideo } from '@/lib/uploader';
import { motion, AnimatePresence } from 'framer-motion';
import { cn } from '@/lib/utils';

const reelSchema = z.object({
  caption: z.string().max(500, "Caption maksimal 500 karakter.").min(1, "Berikan sedikit deskripsi pada karya Anda."),
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
        toast({ 
          variant: 'destructive', 
          title: 'Video Terlalu Besar', 
          description: 'Maksimal ukuran video adalah 20MB untuk menjaga kualitas akses.' 
        });
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
      // 1. Unggah video ke GitHub Storage (Eksklusif)
      const permanentVideoUrl = await uploadVideo(videoFile);

      // 2. Simpan dokumen Reel ke Firestore dengan caption
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
      toast({ 
        variant: 'success', 
        title: "Reel Berhasil Diterbitkan", 
        description: "Karya video Anda kini dapat dinikmati oleh seluruh komunitas Elitera." 
      });
    } catch (error: any) {
      console.error("[Reel Upload Error]", error);
      toast({ 
        variant: 'destructive', 
        title: 'Gagal Menerbitkan', 
        description: error.message || 'Terjadi kendala saat menghubungkan ke penyimpanan GitHub.' 
      });
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
          <DialogDescription>Tambahkan caption dan bagikan karya video permanen Anda.</DialogDescription>
        </DialogHeader>

        {/* Floating Top Nav */}
        <div className="absolute top-0 left-0 right-0 p-6 flex items-center justify-between z-[210] bg-gradient-to-b from-black/80 to-transparent pt-[max(1.5rem,env(safe-area-inset-top))]">
          <Button 
            variant="ghost" 
            size="icon" 
            className="text-white hover:bg-white/10 rounded-full h-12 w-12 transition-all" 
            onClick={onClose} 
            disabled={isSubmitting}
          >
            <X className="h-6 w-6" />
          </Button>
          
          <div className="flex items-center gap-3">
             {videoUrl && (
                <Button 
                    className="bg-primary text-white hover:bg-primary/90 rounded-full px-8 h-12 font-black uppercase text-[10px] tracking-[0.2em] shadow-2xl transition-all active:scale-95 disabled:opacity-50" 
                    onClick={form.handleSubmit(onSubmit)} 
                    disabled={isSubmitting}
                >
                    {isSubmitting ? (
                        <><Loader2 className="mr-2 h-4 w-4 animate-spin" /> Memproses...</>
                    ) : (
                        <><Sparkles className="mr-2 h-4 w-4" /> Terbitkan Sekarang</>
                    )}
                </Button>
             )}
          </div>
        </div>

        {/* Main Interface */}
        <div className="flex-1 relative overflow-hidden flex flex-col items-center justify-center">
            <AnimatePresence mode="wait">
                {!videoUrl ? (
                    <motion.div 
                        key="choice"
                        initial={{ opacity: 0, scale: 0.9 }}
                        animate={{ opacity: 1, scale: 1 }}
                        exit={{ opacity: 0, scale: 1.1 }}
                        className="flex flex-col items-center gap-8 px-8"
                    >
                        <div className="p-10 rounded-[3.5rem] bg-white/5 border border-white/10 shadow-2xl relative">
                            <div className="absolute inset-0 bg-primary/10 blur-3xl rounded-full animate-pulse" />
                            <Film className="h-20 w-20 text-primary relative z-10" />
                        </div>
                        <div className="text-center space-y-3 mb-4">
                            <h2 className="text-white text-4xl font-headline font-black tracking-tight">Karya <span className="text-primary italic">Video.</span></h2>
                            <p className="text-white/40 text-sm font-medium max-w-xs mx-auto">Bagikan rekaman inspiratif atau cuplikan proses kreatif Anda di panggung Reels.</p>
                        </div>
                        <Button 
                            size="lg" 
                            className="h-16 rounded-2xl px-10 font-black text-lg gap-4 shadow-xl shadow-primary/20 transition-all active:scale-95"
                            onClick={() => videoInputRef.current?.click()}
                        >
                            <Video className="h-6 w-6" /> Pilih dari Galeri
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
                        {/* Video Preview Left Section */}
                        <div className="flex-1 relative bg-zinc-950 flex items-center justify-center overflow-hidden">
                            <video 
                                src={videoUrl} 
                                className="w-full h-full object-contain p-2 md:p-8 md:rounded-[3rem]" 
                                autoPlay 
                                loop 
                                playsInline 
                            />
                            
                            {/* Re-select Button */}
                            <button 
                                onClick={() => setVideoUrl(null)}
                                className="absolute bottom-10 left-10 bg-rose-500/20 hover:bg-rose-500 backdrop-blur-xl text-white p-4 rounded-2xl shadow-xl transition-all border border-rose-500/30 group"
                                disabled={isSubmitting}
                            >
                                <Trash2 className="h-5 w-5 transition-transform group-hover:scale-110" />
                            </button>
                        </div>
                        
                        {/* Sidebar Editor Right Section */}
                        <div className="w-full md:w-[400px] lg:w-[450px] p-8 md:p-12 bg-zinc-900 border-l border-white/5 flex flex-col gap-10 pt-24 md:pt-32 shrink-0">
                            <div className="flex items-center gap-5">
                                <div className="relative">
                                    <Avatar className="h-14 w-14 border-2 border-primary/20 shadow-xl">
                                        <AvatarImage src={currentUserProfile?.photoURL} className="object-cover" />
                                        <AvatarFallback className="bg-primary/10 text-primary font-black">
                                            {currentUserProfile?.displayName?.charAt(0) || 'U'}
                                        </AvatarFallback>
                                    </Avatar>
                                    <div className="absolute -bottom-1 -right-1 bg-primary text-white p-1 rounded-full ring-2 ring-zinc-900">
                                        <Sparkles className="h-3 w-3" />
                                    </div>
                                </div>
                                <div>
                                    <p className="text-white font-black text-base">{currentUserProfile?.displayName}</p>
                                    <p className="text-white/40 text-[10px] font-bold uppercase tracking-[0.2em]">Penyuntingan Reel</p>
                                </div>
                            </div>

                            <Form {...form}>
                                <form onSubmit={(e) => e.preventDefault()} className="space-y-6">
                                    <FormField 
                                        control={form.control} 
                                        name="caption" 
                                        render={({ field }) => (
                                            <FormItem className="space-y-3">
                                                <FormLabel className="text-xs font-black uppercase tracking-widest text-white/40 ml-1">Keterangan Karya</FormLabel>
                                                <FormControl>
                                                    <div className="relative group">
                                                        <div className="absolute -inset-1 bg-gradient-to-r from-primary/20 to-accent/20 rounded-2xl blur opacity-0 group-focus-within:opacity-100 transition-opacity" />
                                                        <textarea 
                                                            placeholder="Tuliskan pesan puitis atau deskripsi video Anda di sini..." 
                                                            className="relative w-full min-h-[160px] bg-white/5 border-white/10 text-white placeholder:text-white/20 rounded-2xl p-6 text-sm font-medium focus:ring-2 focus:ring-primary/30 focus:bg-white/[0.08] transition-all resize-none no-scrollbar"
                                                            {...field}
                                                            disabled={isSubmitting}
                                                        />
                                                    </div>
                                                </FormControl>
                                                <div className="flex justify-between items-center px-1">
                                                    <FormMessage className="text-[10px] font-bold" />
                                                    <span className={cn(
                                                        "text-[10px] font-mono font-bold",
                                                        field.value.length > 450 ? "text-rose-400" : "text-white/20"
                                                    )}>
                                                        {field.value.length} / 500
                                                    </span>
                                                </div>
                                            </FormItem>
                                        )} 
                                    />
                                </form>
                            </Form>
                            
                            <div className="mt-auto p-6 rounded-3xl bg-primary/5 border border-primary/10">
                                <p className="text-[10px] font-black text-primary uppercase tracking-[0.2em] mb-3">Ketentuan Publikasi</p>
                                <p className="text-xs text-white/50 leading-relaxed font-medium italic">
                                    "Reels adalah jejak permanen dalam semesta Elitera. Pastikan caption Anda mencerminkan kualitas narasi sang pujangga."
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