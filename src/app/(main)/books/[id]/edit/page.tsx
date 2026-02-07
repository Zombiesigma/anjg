
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
import { Loader2, PlusCircle, BookUp, GripVertical, FileEdit, Info, Trash2, Settings, FileImage, Upload, Sparkles, Globe, Users } from "lucide-react";
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
  
  const [isReviewDialogOpen, setIsReviewDialogOpen] = useState(false);
  const [isDeleteDialogOpen, setIsDeletingDialogOpen] = useState(false);

  // Safety net: Pastikan pointer-events kembali normal saat modal ditutup
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

  // Initialize settings form when book data is available
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
    if (!firestore || !activeChapterId || !chapterForm.formState.isDirty || activeTab !== 'editor') {
      return;
    }
    const chapterRef = doc(firestore, 'books', params.id, 'chapters', activeChapterId);
    await updateDoc(chapterRef, chapterForm.getValues());
    chapterForm.reset(chapterForm.getValues()); 
    toast({ title: "Penyimpanan Otomatis", description: "Perubahan bab telah disimpan." });
  };

  const handleTabSwitch = async (tab: 'editor' | 'settings') => {
    if (tab === activeTab) return;
    if (activeTab === 'editor') await saveCurrentChapter();
    setActiveTab(tab);
    if (tab === 'settings') {
        setActiveChapterId(null);
    }
  };

  const handleChapterSelection = async (chapterId: string) => {
    if (chapterId === activeChapterId) return;
    try {
      await saveCurrentChapter();
      setActiveTab('editor');
      setActiveChapterId(chapterId);
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
    if (!firestore || !bookRef) return;
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
    } catch (e) {
        console.error("Error adding chapter:", e);
        toast({ variant: 'destructive', title: 'Gagal Menambah Bab', description: 'Gagal menyimpan perubahan pada bab saat ini.' });
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
    return <div className="flex items-center justify-center h-screen"><Loader2 className="h-8 w-8 animate-spin text-primary" /><p className="ml-2">Memuat editor...</p></div>;
  }

  if (!book) {
    notFound();
  }
  
  if (currentUser && book.authorId !== currentUser.uid && !isAdmin) {
    return (
        <div className="text-center py-20">
            <h1 className="text-2xl font-bold">Akses Ditolak</h1>
            <p className="text-muted-foreground">Anda bukan penulis buku ini.</p>
             <Button asChild className="mt-4">
                <a href="/">Kembali ke Beranda</a>
            </Button>
        </div>
    )
  }

  const activeChapter = chapters?.find(c => c.id === activeChapterId);

  return (
    <div className="grid md:grid-cols-12 gap-6 -m-6 h-screen">
      <div className="md:col-span-3 lg:col-span-2 bg-muted/50 border-r flex flex-col h-screen overflow-hidden">
        <div className="p-4 border-b">
            <p className="text-xs text-muted-foreground uppercase font-bold tracking-wider">Editor Buku</p>
            <h2 className="font-headline text-lg font-bold truncate mt-1">{book.title}</h2>
        </div>
        <div className="flex-1 overflow-y-auto">
            <div className="p-2 space-y-1">
                <Button 
                    variant={activeTab === 'settings' ? "secondary" : "ghost"}
                    className="w-full justify-start gap-2"
                    onClick={() => handleTabSwitch('settings')}
                >
                    <Settings className="h-4 w-4 text-primary" />
                    <span>Detail Buku</span>
                </Button>
                
                <div className="pt-4 pb-2 px-2">
                    <p className="text-[10px] text-muted-foreground uppercase font-bold">Daftar Bab</p>
                </div>

                {chapters?.map(chapter => (
                     <Button 
                        key={chapter.id} 
                        variant={activeTab === 'editor' && activeChapterId === chapter.id ? "secondary" : "ghost"}
                        className="w-full justify-start gap-2"
                        onClick={() => handleChapterSelection(chapter.id)}
                    >
                       <GripVertical className="h-4 w-4 text-muted-foreground" /> 
                       <span className="truncate flex-1 text-left">{chapter.title}</span>
                    </Button>
                ))}
            </div>
        </div>
        <div className="p-2 border-t">
            <Button variant="outline" className="w-full" onClick={handleAddChapter} disabled={isReviewing}><PlusCircle className="mr-2 h-4 w-4" /> Bab Baru</Button>
        </div>
      </div>

      <div className="md:col-span-9 lg:col-span-10 flex flex-col h-screen overflow-hidden">
         <div className="p-4 border-b flex justify-between items-center bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 sticky top-0 z-10">
            <h3 className="text-lg font-semibold flex items-center gap-2">
                {activeTab === 'settings' ? <Settings className="h-5 w-5"/> : <FileEdit className="h-5 w-5"/>}
                {activeTab === 'settings' ? 'Pengaturan Detail Buku' : (activeChapter?.title || "Pilih Bab")}
            </h3>
            <div className="flex items-center gap-2">
                {book.status === 'draft' || book.status === 'rejected' || book.status === 'published' ? (
                  <AlertDialog open={isReviewDialogOpen} onOpenChange={setIsReviewDialogOpen}>
                      <AlertDialogTrigger asChild>
                          <Button size="sm" disabled={isSubmittingReview}>
                              {isSubmittingReview ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <BookUp className="mr-2 h-4 w-4" />}
                              {book.status === 'published' ? 'Kirim Pembaruan' : 'Kirim Tinjauan'}
                          </Button>
                      </AlertDialogTrigger>
                      <AlertDialogContent onCloseAutoFocus={(e) => { e.preventDefault(); document.body.style.pointerEvents = ''; }}>
                          <AlertDialogHeader>
                            <AlertDialogTitle>
                                {book.status === 'published' ? 'Kirim pembaruan untuk ditinjau?' : 'Kirim buku untuk ditinjau?'}
                            </AlertDialogTitle>
                            <AlertDialogDescription>
                                {book.status === 'published' 
                                    ? 'Pembaruan Anda akan ditinjau oleh admin sebelum dipublikasikan. Versi saat ini akan tetap tayang hingga pembaruan disetujui.' 
                                    : 'Setelah dikirim, admin akan meninjau buku Anda sebelum dipublikasikan. Anda tidak dapat mengedit buku ini selama proses peninjauan.'
                                }
                            </AlertDialogDescription>
                          </AlertDialogHeader>
                          <AlertDialogFooter>
                            <AlertDialogCancel onClick={() => setIsReviewDialogOpen(false)}>Batal</AlertDialogCancel>
                            <AlertDialogAction onClick={handleSubmitForReview}>
                                {book.status === 'published' ? 'Ya, Kirim Pembaruan' : 'Ya, Kirim'}
                            </AlertDialogAction>
                          </AlertDialogFooter>
                      </AlertDialogContent>
                  </AlertDialog>
                ) : (
                  <Badge variant='secondary'>Sedang Ditinjau</Badge>
                )}
                 <AlertDialog open={isDeleteDialogOpen} onOpenChange={setIsDeletingDialogOpen}>
                    <AlertDialogTrigger asChild>
                      <Button size="sm" variant="ghost" className="text-destructive hover:text-destructive hover:bg-destructive/10" disabled={isDeleting}>
                        <Trash2 className="mr-2 h-4 w-4" />
                        Hapus
                      </Button>
                    </AlertDialogTrigger>
                    <AlertDialogContent onCloseAutoFocus={(e) => { e.preventDefault(); document.body.style.pointerEvents = ''; }}>
                      <AlertDialogHeader>
                        <AlertDialogTitle>Hapus Buku?</AlertDialogTitle>
                        <AlertDialogDescription>Tindakan ini tidak dapat dibatalkan. Buku dan semua bab akan dihapus secara permanen.</AlertDialogDescription>
                      </AlertDialogHeader>
                      <AlertDialogFooter>
                        <AlertDialogCancel onClick={() => setIsDeletingDialogOpen(false)}>Batal</AlertDialogCancel>
                        <AlertDialogAction onClick={handleDeleteBook} className="bg-destructive hover:bg-destructive/90">
                          {isDeleting ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : 'Ya, Hapus'}
                        </AlertDialogAction>
                      </AlertDialogFooter>
                    </AlertDialogContent>
                  </AlertDialog>
            </div>
        </div>

        <div className="flex-1 overflow-y-auto p-6 bg-background">
            {activeTab === 'settings' ? (
                <div className="max-w-2xl mx-auto space-y-8">
                    <Form {...settingsForm}>
                        <form onSubmit={settingsForm.handleSubmit(onSettingsSubmit)} className="space-y-6">
                            <div className="flex flex-col md:flex-row gap-6">
                                <div className="flex-1 space-y-6">
                                    <FormField
                                        control={settingsForm.control}
                                        name="title"
                                        render={({ field }) => (
                                            <FormItem>
                                                <FormLabel>Judul Buku</FormLabel>
                                                <FormControl><Input {...field} /></FormControl>
                                                <FormMessage />
                                            </FormItem>
                                        )}
                                    />
                                    <FormField
                                        control={settingsForm.control}
                                        name="genre"
                                        render={({ field }) => (
                                            <FormItem>
                                                <FormLabel>Genre</FormLabel>
                                                <Select onValueChange={field.onChange} defaultValue={field.value}>
                                                    <FormControl><SelectTrigger><SelectValue placeholder="Pilih genre" /></SelectTrigger></FormControl>
                                                    <SelectContent>
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
                                </div>
                                <div className="w-full md:w-48 shrink-0">
                                    <FormLabel>Sampul Buku</FormLabel>
                                    <div 
                                        className="mt-2 aspect-[2/3] bg-muted rounded-md border-2 border-dashed flex flex-col items-center justify-center relative overflow-hidden group cursor-pointer"
                                        onClick={() => document.getElementById('edit-cover-upload')?.click()}
                                    >
                                        {previewUrl ? (
                                            <Image src={previewUrl} alt="Preview Sampul" fill className="object-cover" />
                                        ) : (
                                            <>
                                                <FileImage className="h-10 w-10 text-muted-foreground mb-2" />
                                                <span className="text-xs text-muted-foreground text-center px-2">Klik untuk ganti</span>
                                            </>
                                        )}
                                        <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 flex items-center justify-center transition-opacity">
                                            <Upload className="h-6 w-6 text-white" />
                                        </div>
                                    </div>
                                    <input id="edit-cover-upload" type="file" accept="image/*" className="hidden" onChange={handleFileChange} />
                                </div>
                            </div>

                            <FormField
                                control={settingsForm.control}
                                name="visibility"
                                render={({ field }) => (
                                <FormItem className="space-y-3">
                                    <FormLabel>Visibilitas</FormLabel>
                                    <FormControl>
                                    <RadioGroup
                                        onValueChange={field.onChange}
                                        value={field.value}
                                        className="flex flex-col space-y-1"
                                    >
                                        <FormItem className="flex items-center space-x-3 space-y-0 p-3 rounded-md border border-input bg-background hover:bg-accent transition-colors">
                                        <FormControl>
                                            <RadioGroupItem value="public" />
                                        </FormControl>
                                        <Label className="flex items-center gap-2 cursor-pointer w-full font-normal">
                                            <Globe className="h-4 w-4 text-primary" />
                                            <div className="flex flex-col">
                                                <span className="font-semibold">Publik</span>
                                                <span className="text-xs text-muted-foreground">Semua orang dapat melihat dan membaca buku ini.</span>
                                            </div>
                                        </Label>
                                        </FormItem>
                                        <FormItem className="flex items-center space-x-3 space-y-0 p-3 rounded-md border border-input bg-background hover:bg-accent transition-colors">
                                        <FormControl>
                                            <RadioGroupItem value="followers_only" />
                                        </FormControl>
                                        <Label className="flex items-center gap-2 cursor-pointer w-full font-normal">
                                            <Users className="h-4 w-4 text-primary" />
                                            <div className="flex flex-col">
                                                <span className="font-semibold">Hanya Pengikut</span>
                                                <span className="text-xs text-muted-foreground">Hanya pengikut Anda yang dapat melihat dan membaca buku ini.</span>
                                            </div>
                                        </Label>
                                        </FormItem>
                                    </RadioGroup>
                                    </FormControl>
                                    <FormMessage />
                                </FormItem>
                                )}
                            />

                            <FormField
                                control={settingsForm.control}
                                name="synopsis"
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel>Sinopsis</FormLabel>
                                        <FormControl><Textarea rows={6} {...field} /></FormControl>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />
                            <Button type="submit" size="lg" className="w-full" disabled={isSavingSettings}>
                                {isSavingSettings ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Sparkles className="mr-2 h-4 w-4" />}
                                Simpan Perubahan Detail
                            </Button>
                        </form>
                    </Form>
                </div>
            ) : activeChapter ? (
                 <Form {...chapterForm}>
                    <form className="space-y-6 max-w-3xl mx-auto">
                        {book.status === 'pending_review' && (
                          <Alert>
                            <Info className="h-4 w-4" />
                            <AlertTitle>Sedang Ditinjau</AlertTitle>
                            <AlertDescription>Buku ini sedang dalam peninjauan. {isAdmin ? 'Sebagai admin, Anda masih dapat mengeditnya.' : 'Anda tidak dapat mengeditnya saat ini.'}</AlertDescription>
                          </Alert>
                        )}
                        {book.status === 'rejected' && (
                           <Alert variant="destructive">
                            <Info className="h-4 w-4" />
                            <AlertTitle>Ditolak</AlertTitle>
                            <AlertDescription>Buku ini ditolak oleh admin. Anda dapat melakukan perubahan dan mengirimkannya kembali.</AlertDescription>
                          </Alert>
                        )}
                        <FormField
                            control={chapterForm.control}
                            name="title"
                            render={({ field }) => (
                            <FormItem>
                                <FormLabel>Judul Bab</FormLabel>
                                <FormControl>
                                    <Input placeholder="Judul Bab Anda" {...field} disabled={isReviewing} />
                                </FormControl>
                                <FormMessage />
                            </FormItem>
                            )}
                        />
                        <FormField
                            control={chapterForm.control}
                            name="content"
                            render={({ field }) => (
                            <FormItem>
                                <FormLabel className="sr-only">Konten Bab</FormLabel>
                                <FormControl>
                                    <Textarea placeholder="Mulai menulis..." {...field} className="min-h-[60vh] border-0 shadow-none px-0 focus-visible:ring-0 text-lg leading-relaxed resize-none" disabled={isReviewing} />
                                </FormControl>
                                <FormMessage />
                            </FormItem>
                            )}
                        />
                    </form>
                 </Form>
            ) : (
                <div className="flex flex-col items-center justify-center h-full text-center space-y-4">
                    <div className="p-4 bg-muted rounded-full"><PlusCircle className="h-12 w-12 text-muted-foreground" /></div>
                    <div className="space-y-2">
                        <h4 className="text-xl font-semibold">Mulai Menulis</h4>
                        <p className="text-muted-foreground max-w-sm">Pilih bab dari bilah sisi atau buat bab baru untuk mulai berbagi cerita Anda.</p>
                    </div>
                    <Button onClick={handleAddChapter}><PlusCircle className="mr-2 h-4 w-4" /> Buat Bab Pertama</Button>
                </div>
            )}
        </div>
      </div>
    </div>
  );
}
