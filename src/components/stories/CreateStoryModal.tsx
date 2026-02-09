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
import { Textarea } from '@/components/ui/textarea';
import { Input } from "@/components/ui/input";
import { Form, FormControl, FormField, FormItem, FormMessage } from '@/components/ui/form';
import { useToast } from '@/hooks/use-toast';
import { Loader2, X, Palette, Camera, Image as ImageIcon, Type, ArrowLeft, Sparkles, Send } from 'lucide-react';
import type { User as AppUser } from '@/lib/types';
import { cn } from '@/lib/utils';
import { uploadFile } from '@/lib/uploader';
import { motion, AnimatePresence } from 'framer-motion';

const storySchema = z.object({
  content: z.string().max(280, "Terlalu panjang (maks 280).").optional(),
});

interface CreateStoryModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentUserProfile: AppUser | null;
}

const BACKGROUNDS = [
  "from-primary via-accent to-indigo-600",
  "from-emerald-500 to-teal-700",
  "from-orange-500 to-rose-500",
  "from-purple-600 to-blue-500",
  "from-rose-400 to-red-600",
  "from-zinc-800 to-black",
  "from-amber-400 to-orange-600",
  "from-cyan-500 to-blue-700",
];

type StoryMode = 'choice' | 'text' | 'camera' | 'preview';

export function CreateStoryModal({ isOpen, onClose, currentUserProfile }: CreateStoryModalProps) {
  const firestore = useFirestore();
  const { user: currentUser } = useUser();
  const { toast } = useToast();
  
  const [mode, setMode] = useState<StoryMode>('choice');
  const [bgIndex, setBgIndex] = useState(0);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [capturedImage, setCapturedImage] = useState<string | null>(null);
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [isCameraLoading, setIsCameraLoading] = useState(false);
  
  const videoRef = useRef<HTMLVideoElement>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const form = useForm<z.infer<typeof storySchema>>({
    resolver: zodResolver(storySchema),
    defaultValues: { content: "" },
  });

  const stopCamera = () => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(track => track.stop());
      streamRef.current = null;
    }
    if (videoRef.current) {
      videoRef.current.srcObject = null;
    }
  };

  const resetState = () => {
    stopCamera();
    setMode('choice');
    setBgIndex(0);
    setCapturedImage(null);
    setImageFile(null);
    setIsCameraLoading(false);
    form.reset();
  };

  useEffect(() => {
    if (!isOpen) {
      resetState();
      const timer = setTimeout(() => { 
        document.body.style.pointerEvents = ''; 
      }, 300);
      return () => clearTimeout(timer);
    }
  }, [isOpen]);

  useEffect(() => {
    let active = true;
    const initCamera = async () => {
      if (mode === 'camera') {
        setIsCameraLoading(true);
        try {
          const stream = await navigator.mediaDevices.getUserMedia({ 
            video: { facingMode: 'user', width: { ideal: 1280 }, height: { ideal: 720 } },
            audio: false 
          });
          
          if (active && videoRef.current) {
            streamRef.current = stream;
            videoRef.current.srcObject = stream;
            setIsCameraLoading(false);
          } else {
            stream.getTracks().forEach(t => t.stop());
          }
        } catch (err) {
          if (active) {
            console.error("Camera error:", err);
            toast({ 
              variant: 'destructive', 
              title: "Kamera Gagal", 
              description: "Harap berikan izin akses kamera." 
            });
            setMode('choice');
            setIsCameraLoading(false);
          }
        }
      }
    };
    initCamera();
    return () => {
      active = false;
      if (mode !== 'camera') stopCamera();
    };
  }, [mode, toast]);

  const takePhoto = () => {
    if (videoRef.current) {
      const video = videoRef.current;
      const canvas = document.createElement('canvas');
      canvas.width = video.videoWidth;
      canvas.height = video.videoHeight;
      const ctx = canvas.getContext('2d');
      if (ctx) {
        ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
        const dataUrl = canvas.toDataURL('image/jpeg', 0.9);
        setCapturedImage(dataUrl);
        canvas.toBlob((blob) => {
          if (blob) setImageFile(new File([blob], `story-${Date.now()}.jpg`, { type: 'image/jpeg' }));
        }, 'image/jpeg', 0.9);
        setMode('preview');
        stopCamera();
      }
    }
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.size > 5 * 1024 * 1024) {
        toast({ variant: 'destructive', title: 'File Terlalu Besar', description: 'Maksimal 5MB.' });
        return;
      }
      const reader = new FileReader();
      reader.onload = (event) => {
        setCapturedImage(event.target?.result as string);
        setImageFile(file);
        setMode('preview');
      };
      reader.readAsDataURL(file);
    }
  };

  async function onSubmit(values: z.infer<typeof storySchema>) {
    if (!firestore || !currentUser || !currentUserProfile) return;
    setIsSubmitting(true);
    try {
      let mediaUrl = "";
      const type = imageFile ? 'image' : 'text';
      if (imageFile) mediaUrl = await uploadFile(imageFile);

      await addDoc(collection(firestore, 'stories'), {
        type,
        authorId: currentUser.uid,
        authorName: currentUserProfile.displayName || currentUser.displayName,
        authorAvatarUrl: currentUserProfile.photoURL || currentUser.photoURL,
        authorRole: currentUserProfile.role || 'pembaca',
        content: values.content || "",
        background: type === 'text' ? BACKGROUNDS[bgIndex] : "",
        mediaUrl: mediaUrl || null,
        likes: 0,
        commentCount: 0,
        viewCount: 0,
        createdAt: serverTimestamp(),
      });
      
      onClose();
      toast({ variant: 'success', title: "Terbit!", description: "Momen Anda telah dibagikan." });
    } catch (error) {
      console.error(error);
      toast({ variant: 'destructive', title: 'Gagal', description: 'Gagal menerbitkan cerita.' });
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent 
        className="max-w-none w-screen h-screen p-0 border-0 m-0 bg-black overflow-hidden flex flex-col rounded-none z-[200] focus:outline-none"
        onCloseAutoFocus={(e) => { e.preventDefault(); document.body.style.pointerEvents = ''; }}
      >
        <DialogHeader className="sr-only">
          <DialogTitle>Buat Cerita Baru</DialogTitle>
          <DialogDescription>Bagikan momen puitis Anda.</DialogDescription>
        </DialogHeader>

        {/* Floating Top Nav */}
        <div className="absolute top-0 left-0 right-0 p-6 flex items-center justify-between z-[210] bg-gradient-to-b from-black/80 to-transparent pt-[max(1.5rem,env(safe-area-inset-top))]">
          <Button variant="ghost" size="icon" className="text-white hover:bg-white/10 rounded-full h-12 w-12" onClick={mode === 'choice' ? onClose : () => setMode('choice')}>
            {mode === 'choice' ? <X className="h-6 w-6" /> : <ArrowLeft className="h-6 w-6" />}
          </Button>
          
          <div className="flex items-center gap-3">
             {mode === 'text' && (
                <button 
                    onClick={() => setBgIndex((bgIndex + 1) % BACKGROUNDS.length)}
                    className="h-12 w-12 rounded-full bg-white/10 backdrop-blur-xl border border-white/20 flex items-center justify-center text-white active:scale-90 transition-transform"
                >
                    <Palette className="h-6 w-6" />
                </button>
             )}
             
             {mode !== 'choice' && mode !== 'camera' && (
                <Button 
                    className="bg-white text-black hover:bg-zinc-200 rounded-full px-8 h-12 font-black uppercase text-[10px] tracking-[0.2em] shadow-2xl" 
                    onClick={form.handleSubmit(onSubmit)} 
                    disabled={isSubmitting || (mode === 'text' && !form.watch('content')?.trim())}
                >
                    {isSubmitting ? <Loader2 className="h-4 w-4 animate-spin" /> : <><Sparkles className="mr-2 h-4 w-4" /> Terbit</>}
                </Button>
             )}
          </div>
        </div>

        {/* Immersive Main Area */}
        <div className="flex-1 relative overflow-hidden flex flex-col">
            <AnimatePresence mode="wait">
                {mode === 'choice' && (
                    <motion.div 
                        key="choice"
                        initial={{ opacity: 0, scale: 0.9 }}
                        animate={{ opacity: 1, scale: 1 }}
                        exit={{ opacity: 0, scale: 1.1 }}
                        className="flex-1 flex flex-col items-center justify-center gap-8 px-8 bg-zinc-950 relative"
                    >
                        <div className="absolute inset-0 bg-primary/5 rounded-full blur-[120px] -z-10" />
                        
                        <div className="text-center space-y-3 mb-4">
                            <h2 className="text-white text-4xl font-headline font-black tracking-tight leading-tight">Ukir <span className="text-primary italic">Momen.</span></h2>
                            <p className="text-white/40 text-sm font-medium tracking-wide">Pilih medium untuk karyamu hari ini.</p>
                        </div>

                        <div className="grid gap-4 w-full max-w-xs">
                            <Button 
                                variant="outline" 
                                size="lg" 
                                className="h-20 rounded-[2rem] border-white/10 bg-white/5 text-white font-black text-lg gap-5 hover:bg-white/10 transition-all hover:border-primary/50 group"
                                onClick={() => setMode('text')}
                            >
                                <div className="p-3 rounded-2xl bg-primary/20 text-primary group-hover:scale-110 transition-transform"><Type className="h-6 w-6" /></div>
                                Teks Puitis
                            </Button>
                            <Button 
                                variant="outline" 
                                size="lg" 
                                className="h-20 rounded-[2rem] border-white/10 bg-white/5 text-white font-black text-lg gap-5 hover:bg-white/10 transition-all hover:border-accent/50 group"
                                onClick={() => setMode('camera')}
                            >
                                <div className="p-3 rounded-2xl bg-accent/20 text-accent group-hover:scale-110 transition-transform"><Camera className="h-6 w-6" /></div>
                                Kamera
                            </Button>
                            <Button 
                                variant="outline" 
                                size="lg" 
                                className="h-20 rounded-[2rem] border-white/10 bg-white/5 text-white font-black text-lg gap-5 hover:bg-white/10 transition-all hover:border-emerald-500/50 group"
                                onClick={() => fileInputRef.current?.click()}
                            >
                                <div className="p-3 rounded-2xl bg-emerald-500/20 text-emerald-400 group-hover:scale-110 transition-transform"><ImageIcon className="h-6 w-6" /></div>
                                Galeri
                            </Button>
                            <input type="file" ref={fileInputRef} className="hidden" accept="image/*" onChange={handleFileSelect} />
                        </div>
                    </motion.div>
                )}

                {mode === 'text' && (
                    <motion.div 
                        key="text"
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        className={cn("flex-1 flex flex-col items-center justify-center bg-gradient-to-br transition-all duration-1000 p-8", BACKGROUNDS[bgIndex])}
                    >
                        <div className="absolute inset-0 opacity-10 bg-[url('https://www.transparenttextures.com/patterns/cubes.png')]" />
                        <Form {...form}>
                            <form className="w-full max-w-lg relative z-10" onSubmit={(e) => e.preventDefault()}>
                                <FormField control={form.control} name="content" render={({ field }) => (
                                    <FormItem>
                                        <FormControl>
                                            <Textarea 
                                                placeholder="Ada inspirasi?..." 
                                                className="bg-transparent border-none shadow-none text-3xl md:text-5xl font-headline font-black text-white text-center min-h-[400px] resize-none focus-visible:ring-0 placeholder:text-white/20 leading-[1.3] drop-shadow-2xl no-scrollbar" 
                                                {...field} 
                                                autoFocus 
                                            />
                                        </FormControl>
                                    </FormItem>
                                )} />
                            </form>
                        </Form>
                        
                        <div className="absolute bottom-16 left-0 right-0 flex justify-center pb-[max(0rem,env(safe-area-inset-bottom))]">
                            <div className="px-5 py-2 rounded-full border border-white/10 bg-black/20 backdrop-blur-xl text-[9px] font-black uppercase tracking-[0.3em] text-white/60">
                                {form.watch('content')?.length || 0} / 280
                            </div>
                        </div>
                    </motion.div>
                )}

                {mode === 'camera' && (
                    <motion.div 
                        key="camera"
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        className="flex-1 bg-black relative flex items-center justify-center"
                    >
                        {isCameraLoading && (
                          <div className="absolute inset-0 flex flex-col items-center justify-center gap-4 z-20 bg-black">
                            <Loader2 className="h-12 w-12 text-primary animate-spin" />
                            <p className="text-white/40 text-[10px] font-black uppercase tracking-widest">Sinkronisasi Lensa...</p>
                          </div>
                        )}
                        <video ref={videoRef} autoPlay playsInline muted className="w-full h-full object-cover" />
                        
                        <div className="absolute bottom-16 left-0 right-0 flex items-center justify-center pb-[max(0rem,env(safe-area-inset-bottom))] z-30">
                            <button 
                                onClick={takePhoto}
                                disabled={isCameraLoading}
                                className="w-24 h-24 rounded-full border-4 border-white/30 p-1 flex items-center justify-center active:scale-90 transition-transform group"
                            >
                                <div className="w-full h-full rounded-full bg-white shadow-[0_0_30px_rgba(255,255,255,0.5)] group-hover:scale-95 transition-transform" />
                            </button>
                        </div>
                    </motion.div>
                )}

                {mode === 'preview' && capturedImage && (
                    <motion.div 
                        key="preview"
                        initial={{ opacity: 0, scale: 1.1 }}
                        animate={{ opacity: 1, scale: 1 }}
                        className="flex-1 bg-black relative flex flex-col"
                    >
                        <div className="flex-1 relative flex items-center justify-center p-2">
                            <img src={capturedImage} alt="Captured" className="w-full h-full object-contain rounded-3xl" />
                        </div>
                        
                        <div className="p-6 bg-gradient-to-t from-black via-black/80 to-transparent pb-[max(2rem,env(safe-area-inset-bottom))] relative z-20">
                            <Form {...form}>
                                <form onSubmit={(e) => e.preventDefault()} className="relative">
                                    <FormField control={form.control} name="content" render={({ field }) => (
                                        <FormItem>
                                            <FormControl>
                                                <div className="relative group">
                                                    <Input 
                                                        placeholder="Tambahkan keterangan cerita..." 
                                                        className="bg-white/10 border-white/10 text-white placeholder:text-white/30 h-16 rounded-[1.5rem] px-6 text-base font-medium focus-visible:ring-primary/50 focus-visible:bg-white/20 transition-all pr-16"
                                                        {...field}
                                                    />
                                                    <div className="absolute right-4 top-1/2 -translate-y-1/2">
                                                        <Send className="h-5 w-5 text-white/40" />
                                                    </div>
                                                </div>
                                            </FormControl>
                                        </FormItem>
                                    )} />
                                </form>
                            </Form>
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
      </DialogContent>
    </Dialog>
  );
}
