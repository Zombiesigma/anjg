
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
  DialogFooter,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { useToast } from '@/hooks/use-toast';
import { Loader2, Plus, Camera, Type, Image as ImageIcon, X, Check, ArrowLeft, RefreshCw } from 'lucide-react';
import type { User as AppUser } from '@/lib/types';
import { uploadFile } from '@/lib/uploader';
import Image from 'next/image';
import { cn } from '@/lib/utils';
import { motion, AnimatePresence } from 'framer-motion';

const storySchema = z.object({
  content: z.string().max(280, "Cerita maksimal 280 karakter.").optional(),
});

interface CreateStoryModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentUserProfile: AppUser | null;
}

type CreatorMode = 'selection' | 'camera' | 'text' | 'preview';

export function CreateStoryModal({ isOpen, onClose, currentUserProfile }: CreateStoryModalProps) {
  const firestore = useFirestore();
  const { user: currentUser } = useUser();
  const { toast } = useToast();
  
  const [mode, setMode] = useState<CreatorMode>('selection');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [hasCameraPermission, setHasCameraPermission] = useState<boolean | null>(null);
  const [capturedImage, setCapturedImage] = useState<string | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const form = useForm<z.infer<typeof storySchema>>({
    resolver: zodResolver(storySchema),
    defaultValues: {
      content: "",
    },
  });

  // Reset state on close
  useEffect(() => {
    if (!isOpen) {
      const timer = setTimeout(() => {
        setMode('selection');
        setCapturedImage(null);
        form.reset();
        document.body.style.pointerEvents = '';
      }, 300);
      return () => clearTimeout(timer);
    }
  }, [isOpen, form]);

  // Handle Camera Permission and Stream
  useEffect(() => {
    if (mode === 'camera' && isOpen) {
      const getCameraPermission = async () => {
        try {
          const stream = await navigator.mediaDevices.getUserMedia({ 
            video: { facingMode: 'user', width: { ideal: 1080 }, height: { ideal: 1920 } } 
          });
          setHasCameraPermission(true);
          if (videoRef.current) {
            videoRef.current.srcObject = stream;
          }
        } catch (error) {
          console.error('Error accessing camera:', error);
          setHasCameraPermission(false);
          toast({
            variant: 'destructive',
            title: 'Akses Kamera Ditolak',
            description: 'Harap izinkan akses kamera di pengaturan browser Anda.',
          });
        }
      };
      getCameraPermission();
    } else if (mode !== 'camera' && videoRef.current?.srcObject) {
      // Stop stream when leaving camera mode
      const stream = videoRef.current.srcObject as MediaStream;
      stream.getTracks().forEach(track => track.stop());
    }
  }, [mode, isOpen, toast]);

  const handleCapture = () => {
    if (videoRef.current && canvasRef.current) {
      const video = videoRef.current;
      const canvas = canvasRef.current;
      canvas.width = video.videoWidth;
      canvas.height = video.videoHeight;
      const ctx = canvas.getContext('2d');
      if (ctx) {
        ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
        const dataUrl = canvas.toDataURL('image/jpeg', 0.8);
        setCapturedImage(dataUrl);
        setMode('preview');
      }
    }
  };

  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.size > 5 * 1024 * 1024) {
        toast({ variant: 'destructive', title: 'File Terlalu Besar', description: 'Maksimal 5MB.' });
        return;
      }
      const reader = new FileReader();
      reader.onload = (event) => {
        setCapturedImage(event.target?.result as string);
        setMode('preview');
      };
      reader.readAsDataURL(file);
    }
  };

  const dataURLtoFile = (dataurl: string, filename: string) => {
    const arr = dataurl.split(',');
    const mime = arr[0].match(/:(.*?);/)![1];
    const bstr = atob(arr[1]);
    let n = bstr.length;
    const u8arr = new Uint8Array(n);
    while (n--) {
      u8arr[n] = bstr.charCodeAt(n);
    }
    return new File([u8arr], filename, { type: mime });
  };

  async function onSubmit(values: z.infer<typeof storySchema>) {
    if (!firestore || !currentUser || !currentUserProfile) return;

    setIsSubmitting(true);
    try {
      let finalImageUrl = '';
      if (capturedImage && capturedImage.startsWith('data:')) {
        setIsUploading(true);
        const fileToUpload = dataURLtoFile(capturedImage, `story_${Date.now()}.jpg`);
        finalImageUrl = await uploadFile(fileToUpload);
        setIsUploading(false);
      }

      const storyData = {
        type: capturedImage ? 'image' : 'text',
        authorId: currentUser.uid,
        authorName: currentUser.displayName || currentUserProfile.displayName,
        authorAvatarUrl: currentUser.photoURL || currentUserProfile.photoURL,
        authorRole: currentUserProfile.role,
        content: values.content || '',
        imageUrl: finalImageUrl || null,
        likes: 0,
        commentCount: 0,
        viewCount: 0,
        createdAt: serverTimestamp(),
      };

      await addDoc(collection(firestore, 'stories'), storyData);
      
      onClose();
      setTimeout(() => {
        toast({ title: "Cerita Diterbitkan!", description: "Cerita Anda akan terlihat selama 24 jam." });
      }, 100);
      
    } catch (error) {
      console.error("Error creating story:", error);
      toast({ variant: 'destructive', title: 'Gagal', description: 'Gagal menerbitkan cerita.' });
    } finally {
      setIsSubmitting(false);
      setIsUploading(false);
    }
  }

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent 
        className="max-w-none w-screen h-screen p-0 border-0 m-0 bg-black overflow-hidden flex flex-col rounded-none"
        onCloseAutoFocus={(e) => { e.preventDefault(); document.body.style.pointerEvents = ''; }}
      >
        <DialogHeader className="sr-only">
          <DialogTitle>Buat Cerita</DialogTitle>
          <DialogDescription>Gunakan kamera atau teks untuk membagikan momen.</DialogDescription>
        </DialogHeader>

        {/* Top Header Controls */}
        <div className="absolute top-0 left-0 right-0 p-4 flex items-center justify-between z-50 bg-gradient-to-b from-black/60 to-transparent">
          <Button variant="ghost" size="icon" className="text-white hover:bg-white/20 rounded-full" onClick={onClose}>
            <X className="h-6 w-6" />
          </Button>
          {mode !== 'selection' && (
            <Button variant="ghost" className="text-white font-bold" onClick={() => setMode('selection')}>
              <ArrowLeft className="mr-2 h-4 w-4" /> Batal
            </Button>
          )}
        </div>

        <div className="flex-1 relative flex flex-col items-center justify-center overflow-hidden">
          <AnimatePresence mode="wait">
            {/* MODE: SELECTION */}
            {mode === 'selection' && (
              <motion.div 
                key="selection"
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 1.1 }}
                className="flex flex-col gap-6 w-full max-w-xs"
              >
                <h2 className="text-white text-2xl font-black text-center mb-4 uppercase tracking-tighter">Bagikan Cerita</h2>
                <Button 
                  size="lg" 
                  className="h-24 rounded-2xl flex flex-col gap-2 font-bold shadow-xl shadow-primary/20"
                  onClick={() => setMode('camera')}
                >
                  <Camera className="h-8 w-8" /> Kamera & Galeri
                </Button>
                <Button 
                  size="lg" 
                  variant="secondary" 
                  className="h-24 rounded-2xl flex flex-col gap-2 font-bold"
                  onClick={() => setMode('text')}
                >
                  <Type className="h-8 w-8" /> Cerita Teks
                </Button>
              </motion.div>
            )}

            {/* MODE: CAMERA */}
            {mode === 'camera' && (
              <motion.div 
                key="camera"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="w-full h-full relative"
              >
                <video 
                  ref={videoRef} 
                  autoPlay 
                  playsInline 
                  muted 
                  className="w-full h-full object-cover"
                />
                
                <canvas ref={canvasRef} className="hidden" />

                <div className="absolute bottom-12 left-0 right-0 flex items-center justify-around px-8">
                  <Button 
                    variant="ghost" 
                    size="icon" 
                    className="h-14 w-14 rounded-full bg-white/10 text-white"
                    onClick={() => fileInputRef.current?.click()}
                  >
                    <ImageIcon className="h-6 w-6" />
                  </Button>
                  
                  <button 
                    onClick={handleCapture}
                    className="h-20 w-20 rounded-full border-4 border-white p-1 flex items-center justify-center group"
                  >
                    <div className="h-full w-full rounded-full bg-white transition-transform group-active:scale-90" />
                  </button>

                  <div className="w-14" /> {/* Placeholder for layout balance */}
                </div>

                <input 
                  type="file" 
                  ref={fileInputRef} 
                  className="hidden" 
                  accept="image/*" 
                  onChange={handleFileSelect} 
                />
              </motion.div>
            )}

            {/* MODE: TEXT */}
            {mode === 'text' && (
              <motion.div 
                key="text"
                initial={{ y: 50, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                exit={{ y: -50, opacity: 0 }}
                className="w-full h-full flex items-center justify-center p-8 bg-gradient-to-br from-primary to-accent"
              >
                <Form {...form}>
                  <form className="w-full max-w-lg">
                    <FormField
                      control={form.control}
                      name="content"
                      render={({ field }) => (
                        <FormItem>
                          <FormControl>
                            <Textarea 
                              placeholder="Tuliskan pemikiranmu..." 
                              className="bg-transparent border-none shadow-none text-3xl md:text-4xl font-black text-white text-center min-h-[300px] resize-none focus-visible:ring-0 placeholder:text-white/40"
                              {...field}
                              autoFocus
                            />
                          </FormControl>
                          <FormMessage className="text-white bg-red-500/50 p-2 rounded text-center mt-4" />
                        </FormItem>
                      )}
                    />
                  </form>
                </Form>
                <div className="absolute bottom-12 right-8">
                  <Button 
                    size="lg" 
                    className="rounded-full h-16 w-16 shadow-2xl"
                    disabled={!form.watch('content')?.trim()}
                    onClick={() => setMode('preview')}
                  >
                    <ArrowLeft className="rotate-180 h-6 w-6" />
                  </Button>
                </div>
              </motion.div>
            )}

            {/* MODE: PREVIEW */}
            {mode === 'preview' && (
              <motion.div 
                key="preview"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="w-full h-full relative bg-zinc-900 flex flex-col"
              >
                {capturedImage ? (
                  <div className="relative flex-1">
                    <Image src={capturedImage} alt="Story Preview" fill className="object-contain" />
                    {/* Add caption overlay if needed in future */}
                  </div>
                ) : (
                  <div className="flex-1 flex items-center justify-center p-8 bg-gradient-to-br from-primary to-accent">
                    <p className="text-3xl md:text-4xl font-black text-white text-center whitespace-pre-wrap">
                      {form.getValues().content}
                    </p>
                  </div>
                )}

                <div className="p-6 bg-black/80 backdrop-blur-md flex items-center gap-4 border-t border-white/10">
                  <Button 
                    variant="outline" 
                    className="flex-1 rounded-xl h-12 text-white border-white/20 hover:bg-white/10"
                    onClick={() => capturedImage ? setMode('camera') : setMode('text')}
                    disabled={isSubmitting}
                  >
                    <RefreshCw className="mr-2 h-4 w-4" /> Ulangi
                  </Button>
                  <Button 
                    className="flex-1 rounded-xl h-12 font-bold"
                    onClick={form.handleSubmit(onSubmit)}
                    disabled={isSubmitting || isUploading}
                  >
                    {isSubmitting ? (
                      <><Loader2 className="mr-2 h-4 w-4 animate-spin" /> {isUploading ? 'Mengunggah...' : 'Memproses...'}</>
                    ) : (
                      <><Check className="mr-2 h-4 w-4" /> Terbitkan</>
                    )}
                  </Button>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </DialogContent>
    </Dialog>
  );
}
