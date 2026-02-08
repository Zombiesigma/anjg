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
import { Loader2, X, Palette, Camera, Image as ImageIcon, Type, ArrowLeft, Send as SendIcon } from 'lucide-react';
import type { User as AppUser } from '@/lib/types';
import { cn } from '@/lib/utils';
import { uploadFile } from '@/lib/uploader';

const storySchema = z.object({
  content: z.string().max(280, "Terlalu panjang (maks 280).").optional(),
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
      // Reset pointer events to fix UI locking issues
      const timer = setTimeout(() => { 
        document.body.style.pointerEvents = ''; 
      }, 300);
      return () => clearTimeout(timer);
    }
  }, [isOpen]);

  // Handle stream attachment when entering camera mode
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
            console.error("Camera access error:", err);
            toast({ 
              variant: 'destructive', 
              title: "Kamera Tidak Terdeteksi", 
              description: "Gagal mengakses kamera. Silakan pilih dari galeri." 
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
      if (mode !== 'camera') {
        stopCamera();
      }
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
          if (blob) {
            const file = new File([blob], `story-${Date.now()}.jpg`, { type: 'image/jpeg' });
            setImageFile(file);
          }
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

      if (imageFile) {
        mediaUrl = await uploadFile(imageFile);
      }

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
      toast({ variant: 'success', title: "Terbit!", description: "Momen Anda berhasil dibagikan." });
    } catch (error) {
      console.error(error);
      toast({ variant: 'destructive', title: 'Gagal', description: 'Terjadi gangguan saat menerbitkan cerita.' });
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
        onCloseAutoFocus={(e) => { e.preventDefault(); document.body.style.pointerEvents = ''; }}
      >
        <DialogHeader className="sr-only">
          <DialogTitle>Cerita Baru</DialogTitle>
          <DialogDescription>Bagikan momen spesial Anda ke komunitas Elitera.</DialogDescription>
        </DialogHeader>

        {/* Toolbar Atas */}
        <div className="absolute top-0 left-0 right-0 p-4 flex items-center justify-between z-[210] bg-gradient-to-b from-black/60 to-transparent pt-[max(1rem,env(safe-area-inset-top))]">
          <Button variant="ghost" size="icon" className="text-white rounded-full h-12 w-12" onClick={mode === 'choice' ? onClose : () => setMode('choice')}>
            {mode === 'choice' ? <X className="h-6 w-6" /> : <ArrowLeft className="h-6 w-6" />}
          </Button>
          
          <div className="flex items-center gap-3">
             {mode === 'text' && (
                <Button variant="ghost" size="icon" className="text-white rounded-full h-12 w-12" onClick={() => setBgIndex((bgIndex + 1) % BACKGROUNDS.length)}>
                    <Palette className="h-6 w-6" />
                </Button>
             )}
             
             {mode !== 'choice' && mode !== 'camera' && (
                <Button 
                    className="bg-white text-black hover:bg-white/90 rounded-full px-6 h-10 font-black uppercase text-[10px] tracking-widest" 
                    onClick={form.handleSubmit(onSubmit)} 
                    disabled={isSubmitting || (mode === 'text' && !form.watch('content')?.trim())}
                >
                    {isSubmitting ? <Loader2 className="h-4 w-4 animate-spin" /> : "Terbitkan"}
                </Button>
             )}
          </div>
        </div>

        {/* Konten Utama */}
        <div className="flex-1 relative overflow-hidden flex flex-col items-center justify-center">
            {mode === 'choice' && (
                <div className="flex flex-col gap-6 w-full max-w-xs px-6">
                    <h2 className="text-white text-3xl font-headline font-black text-center mb-4">Bagikan Momen</h2>
                    <Button 
                        variant="outline" 
                        size="lg" 
                        className="h-20 rounded-3xl border-2 border-white/20 bg-white/10 text-white font-bold text-lg gap-4 hover:bg-white/20 transition-all"
                        onClick={() => setMode('text')}
                    >
                        <Type className="h-6 w-6" /> Teks Murni
                    </Button>
                    <Button 
                        variant="outline" 
                        size="lg" 
                        className="h-20 rounded-3xl border-2 border-white/20 bg-white/10 text-white font-bold text-lg gap-4 hover:bg-white/20 transition-all"
                        onClick={() => setMode('camera')}
                    >
                        <Camera className="h-6 w-6" /> Ambil Foto
                    </Button>
                    <Button 
                        variant="outline" 
                        size="lg" 
                        className="h-20 rounded-3xl border-2 border-white/20 bg-white/10 text-white font-bold text-lg gap-4 hover:bg-white/20 transition-all"
                        onClick={() => fileInputRef.current?.click()}
                    >
                        <ImageIcon className="h-6 w-6" /> Pilih Galeri
                    </Button>
                    <input type="file" ref={fileInputRef} className="hidden" accept="image/*" onChange={handleFileSelect} />
                </div>
            )}

            {mode === 'text' && (
                <div className={cn("w-full h-full flex flex-col items-center justify-center bg-gradient-to-br transition-all duration-700", BACKGROUNDS[bgIndex])}>
                    <div className="absolute inset-0 opacity-10 bg-[url('https://www.transparenttextures.com/patterns/cubes.png')]" />
                    <Form {...form}>
                        <form className="w-full max-w-lg px-8 relative z-[220]" onSubmit={(e) => e.preventDefault()}>
                            <FormField control={form.control} name="content" render={({ field }) => (
                                <FormItem>
                                    <FormControl>
                                        <Textarea 
                                            placeholder="Ada ide cerita?..." 
                                            className="bg-transparent border-none shadow-none text-3xl md:text-5xl font-headline font-black text-white text-center min-h-[300px] resize-none focus-visible:ring-0 placeholder:text-white/20 leading-tight" 
                                            {...field} 
                                            autoFocus 
                                        />
                                    </FormControl>
                                    <FormMessage className="text-white bg-black/20 backdrop-blur-md rounded-full px-4 py-1 w-fit mx-auto mt-4 text-[10px] font-black uppercase" />
                                </FormItem>
                            )} />
                        </form>
                    </Form>
                    <div className="absolute bottom-12 left-0 right-0 flex justify-center pointer-events-none pb-[max(0rem,env(safe-area-inset-bottom))]">
                        <p className="text-[9px] font-black uppercase tracking-[0.4em] text-white/40 px-4 py-2 rounded-full border border-white/10 bg-black/10 backdrop-blur-md">
                            {form.watch('content')?.length || 0} / 280
                        </p>
                    </div>
                </div>
            )}

            {mode === 'camera' && (
                <div className="w-full h-full bg-black flex flex-col items-center justify-center relative">
                    {isCameraLoading && (
                      <div className="absolute inset-0 flex flex-col items-center justify-center gap-4 z-10 bg-black">
                        <Loader2 className="h-10 w-10 text-white animate-spin" />
                        <p className="text-white/60 text-xs font-bold uppercase tracking-widest">Menyiapkan Kamera...</p>
                      </div>
                    )}
                    <video 
                      ref={videoRef} 
                      autoPlay 
                      playsInline 
                      muted 
                      className="w-full h-full object-cover" 
                    />
                    <div className="absolute bottom-12 left-0 right-0 flex items-center justify-center pb-[max(0rem,env(safe-area-inset-bottom))] z-20">
                        <button 
                            onClick={takePhoto}
                            disabled={isCameraLoading}
                            className="w-20 h-20 rounded-full border-4 border-white flex items-center justify-center active:scale-90 transition-transform bg-white/10 backdrop-blur-sm"
                        >
                            <div className="w-16 h-16 rounded-full bg-white shadow-xl" />
                        </button>
                    </div>
                </div>
            )}

            {mode === 'preview' && capturedImage && (
                <div className="w-full h-full bg-black relative flex flex-col">
                    <div className="flex-1 relative flex items-center justify-center">
                        <img src={capturedImage} alt="Preview" className="w-full h-full object-contain" />
                    </div>
                    
                    <div className="absolute bottom-0 left-0 right-0 p-6 bg-gradient-to-t from-black/80 to-transparent pb-[max(1.5rem,env(safe-area-inset-bottom))]">
                        <Form {...form}>
                            <form onSubmit={(e) => e.preventDefault()}>
                                <FormField control={form.control} name="content" render={({ field }) => (
                                    <FormItem>
                                        <FormControl>
                                            <Input 
                                                placeholder="Tambahkan keterangan... (Opsional)" 
                                                className="bg-white/10 border-white/20 text-white placeholder:text-white/40 h-14 rounded-2xl focus-visible:ring-white/30"
                                                {...field}
                                            />
                                        </FormControl>
                                    </FormItem>
                                )} />
                            </form>
                        </Form>
                    </div>
                </div>
            )}
        </div>
      </DialogContent>
    </Dialog>
  );
}