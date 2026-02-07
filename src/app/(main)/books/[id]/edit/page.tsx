'use client';

import { useState, useMemo, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { notFound, useParams, useRouter } from 'next/navigation';
import { useFirestore, useUser, useDoc, useCollection } from '@/firebase';
import { doc, updateDoc, collection, addDoc, serverTimestamp, query, orderBy, writeBatch, increment, deleteDoc } from 'firebase/firestore';
import type { Book, Chapter, User as AppUser } from '@/lib/types';
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Label } from "@/components/ui/label";
import { useToast } from '@/hooks/use-toast';
import { Loader2, PlusCircle, BookUp, GripVertical, FileEdit, Info, Trash2, Settings, FileImage, Upload, Sparkles, Globe, Users, CheckCircle2, ChevronLeft, Menu, X } from "lucide-react";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import { uploadFile } from '@/lib/uploader';
import Image from 'next/image';
import { motion, AnimatePresence } from 'framer-motion';
import { cn } from '@/lib/utils';
import Link from 'next/link';
import { Sheet, SheetContent, SheetTrigger, SheetHeader, SheetTitle } from '@/components/ui/sheet';

const chapterSchema = z.object({
  title: z.string().min(3, "Judul bab minimal 3 karakter."),
  content: z.string().min(10, "Konten bab minimal 10 karakter."),
});

const bookSettingsSchema = z.object({
  title: z.string().min(3, { message: "Judul minimal 3 karakter." }).max(100, { message: "Judul maksimal 100 karakter."}),
  genre: z.string({ required_error: "Genre harus dipilih."}),
  synopsis: z.string().min(10, { message: "Sinopsis minimal 10 karakter." }).max(1000, { message: "Sinopsis maksimal 1000 karakter."}),
  visibility: z.enum(['public', 'followers_only'], { required_error: "Pilih visibilitas buku." }),
});

export default function EditBookPage() {
  const params = useParams<{ id: string }>();
  const router = useRouter();
  const firestore = useFirestore();
  const { user: currentUser } = useUser();
  const { toast } = useToast();

  const [activeTab, setActiveTab] = useState<'editor' | 'settings'>('editor');
  const [isSubmittingReview, setIsSubmittingReview] = useState(false);
  const [isSavingSettings, setIsSavingSettings] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [activeChapterId, setActiveChapterId] = useState<string | null>(null);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [lastSaved, setLastSaved] = useState<Date | null>(null);
  
  const [isReviewDialogOpen, setIsReviewDialogOpen] = useState(false);
  const [isDeleteDialogOpen, setIsDeletingDialogOpen] = useState(false);
  const [isMobileSidebarOpen, setIsMobileSidebarOpen] = useState(false);

  useEffect(() => {
    if (!isReviewDialogOpen && !isDeleteDialogOpen) {
        const timer = setTimeout(() => {
            document.body.style.pointerEvents = '';
        }, 300);
        return () => clearTimeout(timer);
    }
  }, [isReviewDialogOpen, isDeleteDialogOpen]);

  const bookRef = useMemo(() => (
    firestore ? doc(firestore, 'books', params.id) : null
  ), [firestore, params.id]);
  const { data: book, isLoading: isBookLoading } = useDoc<Book>(bookRef);
  
  const { data: userProfile, isLoading: isProfileLoading } = useDoc<AppUser>(
    (firestore && currentUser) ? doc(firestore, 'users', currentUser.uid) : null
  );

  const chaptersQuery = useMemo(() => (
    firestore ? query(collection(firestore, 'books', params.id, 'chapters'), orderBy('order', 'asc')) : null
  ), [firestore, params.id]);
  const { data: chapters, isLoading: areChaptersLoading } = useCollection<Chapter>(chaptersQuery);

  const chapterForm = useForm<z.infer<typeof chapterSchema>>({
    resolver: zodResolver(chapterSchema),
    defaultValues: { title: '', content: '' },
  });

  const settingsForm = useForm<z.infer<typeof bookSettingsSchema>>({
    resolver: zodResolver(bookSettingsSchema),
    defaultValues: {
      title: "",
      synopsis: "",
      genre: "",
      visibility: "public",
    },
  });
  
  const isAdmin = userProfile?.role === 'admin';
  const isAuthor = book?.authorId === currentUser?.uid;
  const isReviewing = book?.status === 'pending_review' && !isAdmin;

  useEffect(() => {
    if (book) {
      settingsForm.reset({
        title: book.title,
        synopsis: book.synopsis,
        genre: book.genre,
        visibility: book.visibility || "public",
      });
      setPreviewUrl(book.coverUrl);
    }
  }, [book, settingsForm]);

  useEffect(() => {
    if (chapters && chapters.length > 0 && !activeChapterId && activeTab === 'editor') {
      setActiveChapterId(chapters[0].id);
    }
     if (chapters && activeChapterId && activeTab === 'editor') {
        const activeChapter = chapters.find(c => c.id === activeChapterId);
        if (activeChapter) {
            chapterForm.reset({
                title: activeChapter.title,
                content: activeChapter.content,
            });
        }
    }
  }, [chapters, activeChapterId, activeTab]);

  const saveCurrentChapter = async () => {
    if (!firestore || !activeChapterId || !chapterForm.formState.isDirty || activeTab !== 'editor' || isReviewing) {
      return;
    }
    const chapterRef = doc(firestore, 'books', params.id, 'chapters', activeChapterId);
    await updateDoc(chapterRef, chapterForm.getValues());
    chapterForm.reset(chapterForm.getValues()); 
    setLastSaved(new Date());
  };

  const handleTabSwitch = async (tab: 'editor' | 'settings') => {
    if (tab === activeTab) return;
    if (activeTab === 'editor') await saveCurrentChapter();
    setActiveTab(tab);
    if (tab === 'settings') {
        setActiveChapterId(null);
    }
    setIsMobileSidebarOpen(false);
  };

  const handleChapterSelection = async (chapterId: string) => {
    if (chapterId === activeChapterId) {
        setIsMobileSidebarOpen(false);
        return;
    };
    try {
      await saveCurrentChapter();
      setActiveTab('editor');
      setActiveChapterId(chapterId);
      setIsMobileSidebarOpen(false);
    } catch (e) {
      console.error("Error switching chapters:", e);
      toast({ variant: 'destructive', title: 'Gagal Pindah Bab', description: 'Gagal menyimpan perubahan pada bab saat ini.' });
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.size > 5 * 1024 * 1024) {
        toast({
          variant: 'destructive',
          title: 'File Terlalu Besar',
          description: 'Maksimal ukuran sampul buku adalah 5MB.',
        });
        return;
      }
      setSelectedFile(file);
      setPreviewUrl(URL.createObjectURL(file));
    }
  };

  const onSettingsSubmit = async (values: z.infer<typeof bookSettingsSchema>) => {
    if (!firestore || !bookRef) return;
    setIsSavingSettings(true);

    try {
      let coverUrl = book?.coverUrl || '';
      
      if (selectedFile) {
        try {
          coverUrl = await uploadFile(selectedFile);
        } catch (uploadError) {
          console.error("Upload failed", uploadError);
          toast({
            variant: "destructive",
            title: "Gagal Mengunggah Sampul",
            description: "Terjadi kesalahan saat mengunggah foto. Menggunakan sampul yang sudah ada.",
          });
        }
      }

      await updateDoc(bookRef, {
        ...values,
        coverUrl: coverUrl,
      });

      toast({
        title: "Detail Buku Diperbarui",
        description: "Informasi buku Anda telah berhasil diperbarui.",
      });
      setSelectedFile(null);
    } catch (error) {
      console.error("Error updating book settings:", error);
      toast({
        variant: "destructive",
        title: "Gagal Menyimpan",
        description: "Terjadi kesalahan saat memperbarui informasi buku.",
      });
    } finally {
      setIsSavingSettings(false);
    }
  };

  const handleSubmitForReview = async () => {
    if (!firestore || !bookRef) return;
    setIsSubmittingReview(true);
    setIsReviewDialogOpen(false);
    try {
      if (activeTab === 'editor') await saveCurrentChapter();
      await updateDoc(bookRef, { status: 'pending_review' });
      toast({ title: "Buku Dikirim untuk Ditinjau", description: "Admin akan meninjau buku Anda sebelum dipublikasikan." });
    } catch (error) {
      console.error("Error submitting for review:", error);
      toast({ variant: "destructive", title: "Gagal Mengirim", description: "Terjadi kesalahan saat mengirim." });
    } finally {
      setIsSubmittingReview(false);
    }
  };
  
  const handleAddChapter = async () => {
    if (!firestore || !bookRef || isReviewing) return;
    try {
      if (activeTab === 'editor') await saveCurrentChapter();

      const newOrder = chapters ? chapters.length + 1 : 1;
      const chapterData = {
          title: `Bab ${newOrder}`,
          content: "Mulai tulis bab baru Anda di sini...",
          order: newOrder,
          createdAt: serverTimestamp()
      };
      
      const batch = writeBatch(firestore);
      const chapterCollection = collection(firestore, 'books', params.id, 'chapters');
      const newChapterDoc = doc(chapterCollection);

      batch.set(newChapterDoc, chapterData);
      batch.update(bookRef, { chapterCount: increment(1) });
      await batch.commit();

      setActiveTab('editor');
      setActiveChapterId(newChapterDoc.id);
      setIsMobileSidebarOpen(false);
      
      toast({ title: "Bab Baru Dibuat", description: "Silakan mulai menulis konten untuk bab ini." });
    } catch (e) {
        console.error("Error adding chapter:", e);
        toast({ variant: 'destructive', title: 'Gagal Menambah Bab', description: 'Terjadi kesalahan teknis.' });
    }
  }

  const handleDeleteBook = async () => {
    if (!firestore || !bookRef || !userProfile || !book) return;
    setIsDeleting(true);
    setIsDeletingDialogOpen(false);
    
    try {
      await deleteDoc(bookRef);
      toast({ title: "Buku Dihapus", description: `"${book.title}" telah dihapus secara permanen.` });
      router.push(`/profile/${userProfile.username}`);
    } catch (error) {
      console.error("Error deleting book:", error);
      toast({ variant: "destructive", title: "Gagal Menghapus", description: "Terjadi kesalahan." });
      setIsDeleting(false);
    }
  };


  if (isBookLoading || areChaptersLoading || isProfileLoading) {
    return (
        <div className="flex flex-col items-center justify-center h-screen bg-background">
            <Loader2 className="h-12 w-12 animate-spin text-primary/40 mb-4" />
            <p className="text-muted-foreground font-medium animate-pulse">Mempersiapkan Ruang Menulis...</p>
        </div>
    );
  }

  if (!book) {
    notFound();
  }
  
  if (currentUser && book.authorId !== currentUser.uid && !isAdmin) {
    return (
        <div className="flex flex-col items-center justify-center h-screen text-center p-6">
            <div className="bg-destructive/10 p-4 rounded-full mb-6">
                <Trash2 className="h-12 w-12 text-destructive" />
            </div>
            <h1 className="text-3xl font-headline font-bold mb-2">Akses Ditolak</h1>
            <p className="text-muted-foreground max-w-sm mb-8">Anda tidak memiliki izin untuk mengedit buku ini. Ini adalah area khusus bagi penulis.</p>
             <Button asChild size="lg" className="rounded-full px-8">
                <Link href="/">Kembali ke Beranda</Link>
            </Button>
        </div>
    )
  }

  const activeChapter = chapters?.find(c => c.id === activeChapterId);

  const SidebarContent = () => (
    <div className="flex flex-col h-full">
        <div className="p-6 border-b bg-background/50 backdrop-blur">
            <Link href={`/books/${book.id}`} className="flex items-center gap-2 text-xs text-muted-foreground hover:text-primary transition-colors mb-4 group">
                <ChevronLeft className="h-3 w-3 transition-transform group-hover:-translate-x-1" /> Kembali ke Detail
            </Link>
            <p className="text-[10px] uppercase tracking-[0.2em] font-black text-primary/60 mb-1">Editor Buku</p>
            <h2 className="font-headline text-xl font-bold truncate leading-tight">{book.title}</h2>
        </div>
        
        <div className="flex-1 overflow-y-auto custom-scrollbar p-4 space-y-6">
            <div className="space-y-1">
                <Button 
                    variant={activeTab === 'settings' ? "secondary" : "ghost"}
                    className={cn(
                        "w-full justify-start gap-3 h-11 px-4 rounded-xl transition-all",
                        activeTab === 'settings' ? "shadow-sm border-primary/10 bg-primary/5 text-primary" : "hover:bg-primary/5 hover:text-primary"
                    )}
                    onClick={() => handleTabSwitch('settings')}
                >
                    <Settings className="h-4 w-4" />
                    <span className="font-bold text-sm">Pengaturan Buku</span>
                </Button>
            </div>
            
            <div className="space-y-3">
                <div className="flex items-center justify-between px-2">
                    <p className="text-[10px] uppercase tracking-widest font-bold text-muted-foreground">Daftar Bab</p>
                    <span className="text-[10px] font-mono bg-muted px-1.5 py-0.5 rounded text-muted-foreground">{chapters?.length || 0}</span>
                </div>

                <div className="space-y-1">
                    {chapters?.map(chapter => (
                        <Button 
                            key={chapter.id} 
                            variant={activeTab === 'editor' && activeChapterId === chapter.id ? "secondary" : "ghost"}
                            className={cn(
                                "w-full justify-start gap-3 h-11 px-4 rounded-xl group transition-all truncate",
                                activeTab === 'editor' && activeChapterId === chapter.id 
                                    ? "shadow-sm border-primary/10 bg-primary/10 text-primary" 
                                    : "hover:bg-primary/5 hover:text-primary"
                            )}
                            onClick={() => handleChapterSelection(chapter.id)}
                        >
                            <GripVertical className="h-4 w-4 text-muted-foreground/40 group-hover:text-primary/40 shrink-0" /> 
                            <span className="truncate flex-1 text-left text-sm font-medium">{chapter.title}</span>
                        </Button>
                    ))}
                </div>
            </div>
        </div>

        <div className="p-4 border-t bg-background/50">
            <Button 
                variant="outline" 
                className="w-full h-11 rounded-xl border-dashed border-2 hover:border-primary hover:bg-primary/5 hover:text-primary transition-all font-bold" 
                onClick={handleAddChapter} 
                disabled={isReviewing}
            >
                <PlusCircle className="mr-2 h-4 w-4" /> Tambah Bab Baru
            </Button>
        </div>
    </div>
  );

  return (
    <div className="flex h-[calc(100vh-theme(spacing.14))] -m-6 overflow-hidden bg-background">
      {/* Sidebar Desktop */}
      <aside className="hidden md:flex flex-col w-72 lg:w-80 border-r bg-muted/20 shrink-0">
        <SidebarContent />
      </aside>

      {/* Main Content Area */}
      <main className="flex-1 flex flex-col min-w-0 bg-background relative overflow-hidden">
         {/* Top Toolbar */}
         <header className="h-16 border-b flex items-center justify-between px-4 md:px-6 bg-background/95 backdrop-blur-md z-30 sticky top-0 shadow-sm">
            <div className="flex items-center gap-2 md:gap-4 min-w-0">
                {/* Mobile Menu Trigger */}
                <div className="md:hidden">
                    <Sheet open={isMobileSidebarOpen} onOpenChange={setIsMobileSidebarOpen}>
                        <SheetTrigger asChild>
                            <Button variant="ghost" size="icon" className="rounded-full">
                                <Menu className="h-5 w-5" />
                            </Button>
                        </SheetTrigger>
                        <SheetContent 
                            side="left" 
                            className="p-0 w-80"
                            onCloseAutoFocus={(e) => {
                                e.preventDefault();
                                document.body.style.pointerEvents = '';
                            }}
                        >
                            <SheetHeader className="sr-only"><SheetTitle>Navigasi Editor</SheetTitle></SheetHeader>
                            <SidebarContent />
                        </SheetContent>
                    </Sheet>
                </div>

                <div className={cn(
                    "flex items-center gap-2",
                    activeTab === 'settings' ? "text-primary" : "text-foreground"
                )}>
                    {activeTab === 'settings' ? <Settings className="h-5 w-5 hidden sm:block"/> : <FileEdit className="h-5 w-5 hidden sm:block"/>}
                    <h3 className="font-bold text-sm md:text-base truncate">
                        {activeTab === 'settings' ? 'Pengaturan Buku' : (activeChapter?.title || "Pilih Bab")}
                    </h3>
                </div>
                
                {lastSaved && activeTab === 'editor' && (
                    <div className="hidden lg:flex items-center gap-1.5 text-[10px] font-bold text-green-600 bg-green-50 px-2.5 py-1 rounded-full border border-green-100">
                        <CheckCircle2 className="h-3 w-3" />
                        Tersimpan {lastSaved.toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' })}
                    </div>
                )}
            </div>

            <div className="flex items-center gap-2 shrink-0">
                <div className="hidden sm:block">
                    {book.status === 'published' ? (
                        <Badge className="bg-green-500 hover:bg-green-600 text-[10px] uppercase font-black tracking-widest px-3 py-1">Terbit</Badge>
                    ) : book.status === 'pending_review' ? (
                        <Badge variant="secondary" className="text-[10px] uppercase font-black tracking-widest px-3 py-1">Ditinjau</Badge>
                    ) : book.status === 'rejected' ? (
                        <Badge variant="destructive" className="text-[10px] uppercase font-black tracking-widest px-3 py-1">Ditolak</Badge>
                    ) : (
                        <Badge variant="outline" className="text-[10px] uppercase font-black tracking-widest px-3 py-1">Draf</Badge>
                    )}
                </div>

                <div className="h-6 w-px bg-border mx-1 hidden sm:block" />

                <div className="flex items-center gap-1">
                    {book.status !== 'pending_review' || isAdmin ? (
                        <AlertDialog open={isReviewDialogOpen} onOpenChange={setIsReviewDialogOpen}>
                            <AlertDialogTrigger asChild>
                                <Button size="sm" className="rounded-full px-3 md:px-5 font-bold shadow-lg shadow-primary/20 text-xs md:text-sm" disabled={isSubmittingReview}>
                                    {isSubmittingReview ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <BookUp className="mr-2 h-4 w-4" />}
                                    {book.status === 'published' ? 'Update' : 'Terbitkan'}
                                </Button>
                            </AlertDialogTrigger>
                            <AlertDialogContent onCloseAutoFocus={(e) => { e.preventDefault(); document.body.style.pointerEvents = ''; }}>
                                <AlertDialogHeader>
                                    <AlertDialogTitle className="font-headline text-2xl">
                                        {book.status === 'published' ? 'Kirim Pembaruan Karya?' : 'Siap Untuk Terbit?'}
                                    </AlertDialogTitle>
                                    <AlertDialogDescription className="text-base">
                                        {book.status === 'published' 
                                            ? 'Pembaruan Anda akan ditinjau oleh tim admin kami sebelum dipublikasikan secara luas.' 
                                            : 'Karya Anda akan dikirim ke tim admin Elitera untuk proses moderasi kualitas. Setelah disetujui, buku Anda akan dapat dinikmati oleh pembaca!'
                                        }
                                    </AlertDialogDescription>
                                </AlertDialogHeader>
                                <AlertDialogFooter className="mt-6 gap-2">
                                    <AlertDialogCancel onClick={() => setIsReviewDialogOpen(false)} className="rounded-full">Batal</AlertDialogCancel>
                                    <AlertDialogAction onClick={handleSubmitForReview} className="rounded-full px-8 font-bold">
                                        Ya, Kirim Sekarang
                                    </AlertDialogAction>
                                </AlertDialogFooter>
                            </AlertDialogContent>
                        </AlertDialog>
                    ) : null}

                    <AlertDialog open={isDeleteDialogOpen} onOpenChange={setIsDeletingDialogOpen}>
                        <AlertDialogTrigger asChild>
                            <Button size="icon" variant="ghost" className="rounded-full text-destructive hover:text-destructive hover:bg-destructive/10" disabled={isDeleting}>
                                <Trash2 className="h-5 w-5" />
                            </Button>
                        </AlertDialogTrigger>
                        <AlertDialogContent onCloseAutoFocus={(e) => { e.preventDefault(); document.body.style.pointerEvents = ''; }}>
                            <AlertDialogHeader>
                                <AlertDialogTitle className="text-destructive font-headline text-2xl">Hapus Permanen?</AlertDialogTitle>
                                <AlertDialogDescription className="text-base">
                                    Tindakan ini akan menghapus buku <strong>"{book.title}"</strong> beserta seluruh kontennya secara permanen.
                                </AlertDialogDescription>
                            </AlertDialogHeader>
                            <AlertDialogFooter className="mt-6">
                                <AlertDialogCancel onClick={() => setIsDeletingDialogOpen(false)} className="rounded-full">Batal</AlertDialogCancel>
                                <AlertDialogAction onClick={handleDeleteBook} className="bg-destructive hover:bg-destructive/90 rounded-full px-8 font-bold text-white">
                                    {isDeleting ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : 'Hapus Selamanya'}
                                </AlertDialogAction>
                            </AlertDialogFooter>
                        </AlertDialogContent>
                    </AlertDialog>
                </div>
            </div>
        </header>

        {/* Writing/Settings Body */}
        <div className="flex-1 overflow-y-auto custom-scrollbar relative">
            <AnimatePresence mode="wait">
                {activeTab === 'settings' ? (
                    <motion.div 
                        key="settings"
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -10 }}
                        className="max-w-3xl mx-auto py-8 md:py-12 px-6"
                    >
                        <div className="mb-10">
                            <h2 className="text-2xl md:text-3xl font-headline font-bold mb-2">Identitas Karya</h2>
                            <p className="text-muted-foreground text-sm">Informasi ini akan membantu pembaca menemukan dan memahami cerita Anda.</p>
                        </div>

                        <Form {...settingsForm}>
                            <form onSubmit={settingsForm.handleSubmit(onSettingsSubmit)} className="space-y-10 pb-20">
                                <div className="grid md:grid-cols-12 gap-10">
                                    {/* Cover Side */}
                                    <div className="md:col-span-4 space-y-4">
                                        <Label className="text-xs font-black uppercase tracking-widest text-muted-foreground">Sampul Buku</Label>
                                        <div 
                                            className="aspect-[2/3] bg-muted rounded-2xl border-2 border-dashed border-primary/20 flex flex-col items-center justify-center relative overflow-hidden group cursor-pointer hover:border-primary/50 transition-all shadow-xl"
                                            onClick={() => document.getElementById('edit-cover-upload')?.click()}
                                        >
                                            {previewUrl ? (
                                                <Image src={previewUrl} alt="Preview Sampul" fill className="object-cover transition-transform duration-500 group-hover:scale-110" />
                                            ) : (
                                                <>
                                                    <FileImage className="h-12 w-12 text-muted-foreground/40 mb-3" />
                                                    <span className="text-[10px] font-bold uppercase text-muted-foreground px-4 text-center">Klik untuk ganti sampul</span>
                                                </>
                                            )}
                                            <div className="absolute inset-0 bg-primary/60 backdrop-blur-sm opacity-0 group-hover:opacity-100 flex flex-col items-center justify-center transition-opacity duration-300">
                                                <Upload className="h-8 w-8 text-white mb-2" />
                                                <span className="text-xs font-bold text-white uppercase tracking-wider">Unggah Baru</span>
                                            </div>
                                        </div>
                                        <input id="edit-cover-upload" type="file" accept="image/*" className="hidden" onChange={handleFileChange} />
                                    </div>

                                    {/* Form Side */}
                                    <div className="md:col-span-8 space-y-6">
                                        <FormField
                                            control={settingsForm.control}
                                            name="title"
                                            render={({ field }) => (
                                                <FormItem>
                                                    <FormLabel className="font-bold">Judul</FormLabel>
                                                    <FormControl><Input {...field} className="h-12 text-lg rounded-xl focus-visible:ring-primary/20 font-medium" /></FormControl>
                                                    <FormMessage />
                                                </FormItem>
                                            )}
                                        />
                                        
                                        <FormField
                                            control={settingsForm.control}
                                            name="genre"
                                            render={({ field }) => (
                                                <FormItem>
                                                    <FormLabel className="font-bold">Genre</FormLabel>
                                                    <Select onValueChange={field.onChange} defaultValue={field.value}>
                                                        <FormControl>
                                                            <SelectTrigger className="h-12 rounded-xl focus:ring-primary/20">
                                                                <SelectValue placeholder="Pilih genre" />
                                                            </SelectTrigger>
                                                        </FormControl>
                                                        <SelectContent className="rounded-xl">
                                                            <SelectItem value="self-improvement">Pengembangan Diri</SelectItem>
                                                            <SelectItem value="novel">Novel</SelectItem>
                                                            <SelectItem value="mental-health">Kesehatan Mental</SelectItem>
                                                            <SelectItem value="sci-fi">Fiksi Ilmiah</SelectItem>
                                                            <SelectItem value="fantasy">Fantasi</SelectItem>
                                                            <SelectItem value="mystery">Misteri</SelectItem>
                                                            <SelectItem value="romance">Romansa</SelectItem>
                                                            <SelectItem value="horror">Horor</SelectItem>
                                                        </SelectContent>
                                                    </Select>
                                                    <FormMessage />
                                                </FormItem>
                                            )}
                                        />

                                        <FormField
                                            control={settingsForm.control}
                                            name="visibility"
                                            render={({ field }) => (
                                            <FormItem className="space-y-3">
                                                <FormLabel className="font-bold">Privasi & Visibilitas</FormLabel>
                                                <FormControl>
                                                <RadioGroup
                                                    onValueChange={field.onChange}
                                                    value={field.value}
                                                    className="grid grid-cols-1 sm:grid-cols-2 gap-3"
                                                >
                                                    <FormItem className={cn(
                                                        "flex items-center space-x-3 space-y-0 p-4 rounded-xl border transition-all cursor-pointer",
                                                        field.value === 'public' ? "border-primary bg-primary/5 ring-1 ring-primary/20" : "hover:bg-muted/50"
                                                    )}>
                                                        <FormControl><RadioGroupItem value="public" className="sr-only" /></FormControl>
                                                        <Label className="flex items-center gap-3 cursor-pointer w-full font-normal" onClick={() => field.onChange('public')}>
                                                            <div className={cn("p-2 rounded-lg", field.value === 'public' ? "bg-primary text-white" : "bg-muted text-muted-foreground")}>
                                                                <Globe className="h-4 w-4" />
                                                            </div>
                                                            <div className="flex flex-col">
                                                                <span className="font-bold text-sm">Publik</span>
                                                                <span className="text-[10px] text-muted-foreground">Untuk semua</span>
                                                            </div>
                                                        </Label>
                                                    </FormItem>
                                                    
                                                    <FormItem className={cn(
                                                        "flex items-center space-x-3 space-y-0 p-4 rounded-xl border transition-all cursor-pointer",
                                                        field.value === 'followers_only' ? "border-primary bg-primary/5 ring-1 ring-primary/20" : "hover:bg-muted/50"
                                                    )}>
                                                        <FormControl><RadioGroupItem value="followers_only" className="sr-only" /></FormControl>
                                                        <Label className="flex items-center gap-3 cursor-pointer w-full font-normal" onClick={() => field.onChange('followers_only')}>
                                                            <div className={cn("p-2 rounded-lg", field.value === 'followers_only' ? "bg-primary text-white" : "bg-muted text-muted-foreground")}>
                                                                <Users className="h-4 w-4" />
                                                            </div>
                                                            <div className="flex flex-col">
                                                                <span className="font-bold text-sm">Pengikut</span>
                                                                <span className="text-[10px] text-muted-foreground">Khusus pembaca setia</span>
                                                            </div>
                                                        </Label>
                                                    </FormItem>
                                                </RadioGroup>
                                                </FormControl>
                                                <FormMessage />
                                            </FormItem>
                                            )}
                                        />
                                    </div>
                                </div>

                                <FormField
                                    control={settingsForm.control}
                                    name="synopsis"
                                    render={({ field }) => (
                                        <FormItem>
                                            <FormLabel className="font-bold">Sinopsis</FormLabel>
                                            <FormControl>
                                                <Textarea 
                                                    rows={8} 
                                                    {...field} 
                                                    className="rounded-2xl text-base leading-relaxed focus-visible:ring-primary/20 font-serif" 
                                                    placeholder="Tulis ringkasan cerita Anda..."
                                                />
                                            </FormControl>
                                            <FormMessage />
                                        </FormItem>
                                    )}
                                />

                                <div className="flex justify-end pt-4">
                                    <Button type="submit" size="lg" className="rounded-full px-10 h-14 font-bold shadow-xl shadow-primary/20" disabled={isSavingSettings}>
                                        {isSavingSettings ? <Loader2 className="mr-2 h-5 w-5 animate-spin" /> : <Sparkles className="mr-2 h-5 w-5" />}
                                        Simpan Pengaturan
                                    </Button>
                                </div>
                            </form>
                        </Form>
                    </motion.div>
                ) : activeChapter ? (
                    <motion.div 
                        key={activeChapterId}
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className="max-w-4xl mx-auto py-8 md:py-12 px-6 lg:px-12"
                    >
                        <Form {...chapterForm}>
                            <form className="space-y-8 pb-32">
                                {book.status === 'pending_review' && (
                                <Alert className="bg-primary/5 border-primary/20 rounded-2xl">
                                    <Info className="h-4 w-4 text-primary" />
                                    <AlertTitle className="font-bold">Sedang Ditinjau</AlertTitle>
                                    <AlertDescription className="text-muted-foreground">Konten dikunci selama peninjauan admin. {isAdmin && 'Anda dapat mengeditnya sebagai admin.'}</AlertDescription>
                                </Alert>
                                )}

                                <FormField
                                    control={chapterForm.control}
                                    name="title"
                                    render={({ field }) => (
                                    <FormItem>
                                        <FormControl>
                                            <Input 
                                                placeholder="Judul Bab..." 
                                                {...field} 
                                                disabled={isReviewing} 
                                                className="border-none shadow-none text-3xl md:text-5xl font-headline font-black px-0 h-auto focus-visible:ring-0 placeholder:text-muted-foreground/30 mb-2"
                                            />
                                        </FormControl>
                                        <FormMessage />
                                    </FormItem>
                                    )}
                                />

                                <div className="w-16 h-1 bg-primary/20 rounded-full mb-10" />

                                <FormField
                                    control={chapterForm.control}
                                    name="content"
                                    render={({ field }) => (
                                    <FormItem>
                                        <FormLabel className="sr-only">Konten Bab</FormLabel>
                                        <FormControl>
                                            <Textarea 
                                                placeholder="Mulai tulis cerita Anda di sini..." 
                                                {...field} 
                                                className="min-h-[70vh] border-none shadow-none px-0 focus-visible:ring-0 text-lg md:text-2xl leading-[1.8] font-serif resize-none bg-transparent placeholder:text-muted-foreground/20 scroll-smooth" 
                                                disabled={isReviewing} 
                                            />
                                        </FormControl>
                                        <FormMessage />
                                    </FormItem>
                                    )}
                                />
                            </form>
                        </Form>
                    </motion.div>
                ) : (
                    <div className="flex flex-col items-center justify-center h-full text-center p-12">
                        <div className="w-24 h-24 bg-muted rounded-full flex items-center justify-center mb-6 animate-bounce duration-[3000ms]">
                            <PlusCircle className="h-12 w-12 text-muted-foreground/40" />
                        </div>
                        <div className="space-y-2 mb-8">
                            <h4 className="text-2xl font-headline font-bold">Mulai Tuangkan Ide</h4>
                            <p className="text-muted-foreground max-w-sm mx-auto">Anda belum memilih bab. Gunakan menu di bilah sisi atau klik tombol di bawah untuk memulai bab pertama.</p>
                        </div>
                        <Button onClick={handleAddChapter} size="lg" className="rounded-full px-8 font-bold shadow-lg shadow-primary/10">
                            <PlusCircle className="mr-2 h-5 w-5" /> Buat Bab Pertama
                        </Button>
                    </div>
                )}
            </AnimatePresence>
        </div>
      </main>
      
      <style jsx global>{`
        .custom-scrollbar::-webkit-scrollbar {
          width: 6px;
        }
        .custom-scrollbar::-webkit-scrollbar-track {
          background: transparent;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb {
          background: rgba(0, 0, 0, 0.05);
          border-radius: 10px;
        }
        .dark .custom-scrollbar::-webkit-scrollbar-thumb {
          background: rgba(255, 255, 255, 0.05);
        }
      `}</style>
    </div>
  );
}
