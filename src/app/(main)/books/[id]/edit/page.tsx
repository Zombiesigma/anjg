'use client';

import { useState, useMemo, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { notFound, useParams, useRouter } from 'next/navigation';
import { useFirestore, useUser, useDoc, useCollection } from '@/firebase';
import { doc, updateDoc, collection, addDoc, serverTimestamp, query, orderBy, writeBatch } from 'firebase/firestore';
import type { Book, Chapter } from '@/lib/types';
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from '@/hooks/use-toast';
import { Loader2, PlusCircle, BookUp, Trash2, GripVertical, FileEdit } from "lucide-react";
import { Skeleton } from '@/components/ui/skeleton';
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

const chapterSchema = z.object({
  title: z.string().min(3, "Judul bab minimal 3 karakter."),
  content: z.string().min(10, "Konten bab minimal 10 karakter."),
});

export default function EditBookPage() {
  const params = useParams<{ id: string }>();
  const router = useRouter();
  const firestore = useFirestore();
  const { user: currentUser } = useUser();
  const { toast } = useToast();

  const [isPublishing, setIsPublishing] = useState(false);
  const [isSavingChapter, setIsSavingChapter] = useState(false);
  const [activeChapterId, setActiveChapterId] = useState<string | null>(null);

  const bookRef = useMemo(() => (
    firestore ? doc(firestore, 'books', params.id) : null
  ), [firestore, params.id]);
  const { data: book, isLoading: isBookLoading, error: bookError } = useDoc<Book>(bookRef);

  const chaptersQuery = useMemo(() => (
    firestore ? query(collection(firestore, 'books', params.id, 'chapters'), orderBy('order', 'asc')) : null
  ), [firestore, params.id]);
  const { data: chapters, isLoading: areChaptersLoading } = useCollection<Chapter>(chaptersQuery);

  const form = useForm<z.infer<typeof chapterSchema>>({
    resolver: zodResolver(chapterSchema),
    defaultValues: { title: '', content: '' },
  });

  useEffect(() => {
    if (chapters && chapters.length > 0 && !activeChapterId) {
      setActiveChapterId(chapters[0].id);
    }
     if (chapters && activeChapterId) {
        const activeChapter = chapters.find(c => c.id === activeChapterId);
        if (activeChapter) {
            form.reset({
                title: activeChapter.title,
                content: activeChapter.content,
            });
        }
    }
  }, [chapters, activeChapterId, form]);

  const handlePublish = async () => {
    if (!firestore || !bookRef) return;
    setIsPublishing(true);
    try {
        const batch = writeBatch(firestore);

        // Save the current chapter's content if one is active
        if (activeChapterId) {
            const chapterRef = doc(firestore, 'books', params.id, 'chapters', activeChapterId);
            const currentChapterValues = form.getValues();
            batch.update(chapterRef, currentChapterValues);
        }

        // Update the book's status to published
        batch.update(bookRef, { status: 'published' });

        await batch.commit();
      
        toast({ title: "Buku Diterbitkan!", description: "Buku Anda sekarang dapat dilihat oleh semua orang." });
        router.push(`/books/${params.id}`);
    } catch (error) {
      console.error("Error publishing book:", error);
      toast({ variant: "destructive", title: "Gagal Menerbitkan", description: "Terjadi kesalahan saat menyimpan dan menerbitkan." });
    } finally {
      setIsPublishing(false);
    }
  };
  
  const handleAddChapter = async () => {
      if (!firestore || !chapters) return;
      const newOrder = chapters.length + 1;
      const chapterData = {
          title: `Bab ${newOrder}`,
          content: "Mulai tulis bab baru Anda di sini...",
          order: newOrder,
          createdAt: serverTimestamp()
      };
      const newChapterRef = await addDoc(collection(firestore, 'books', params.id, 'chapters'), chapterData);
      setActiveChapterId(newChapterRef.id);
  }
  
  const onChapterSubmit = async (values: z.infer<typeof chapterSchema>) => {
      if (!firestore || !activeChapterId) return;
      setIsSavingChapter(true);
      const chapterRef = doc(firestore, 'books', params.id, 'chapters', activeChapterId);
      try {
          await updateDoc(chapterRef, values);
          toast({ title: "Bab Disimpan", description: "Perubahan Anda telah disimpan."});
      } catch (error) {
          console.error(error);
          toast({ variant: "destructive", title: "Gagal Menyimpan", description: "Tidak dapat menyimpan perubahan bab."});
      } finally {
          setIsSavingChapter(false);
      }
  }

  if (isBookLoading || areChaptersLoading) {
    return <p>Memuat editor...</p>;
  }

  if (!book) {
    notFound();
  }
  
  if (currentUser && book.authorId !== currentUser.uid) {
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
      <div className="md:col-span-3 lg:col-span-2 bg-muted/50 border-r flex flex-col h-screen">
        <div className="p-4 border-b">
            <p className="text-sm text-muted-foreground">Editor Konten</p>
            <h2 className="font-headline text-xl font-bold truncate">{book.title}</h2>
        </div>
        <div className="flex-1 overflow-y-auto">
            <div className="p-2 space-y-1">
                {chapters?.map(chapter => (
                     <Button 
                        key={chapter.id} 
                        variant={activeChapterId === chapter.id ? "secondary" : "ghost"}
                        className="w-full justify-start gap-2"
                        onClick={() => setActiveChapterId(chapter.id)}
                    >
                       <GripVertical className="h-4 w-4 text-muted-foreground" /> 
                       <span className="truncate flex-1 text-left">{chapter.title}</span>
                    </Button>
                ))}
            </div>
        </div>
        <div className="p-2 border-t">
            <Button variant="outline" className="w-full" onClick={handleAddChapter}><PlusCircle className="mr-2 h-4 w-4" /> Bab Baru</Button>
        </div>
      </div>
      <div className="md:col-span-9 lg:col-span-10 flex flex-col h-screen">
         <div className="p-4 border-b flex justify-between items-center">
            <h3 className="text-lg font-semibold flex items-center gap-2"><FileEdit/> {activeChapter?.title || "Pilih Bab"}</h3>
            <div className="flex items-center gap-2">
                <Button variant="outline" size="sm" onClick={() => form.handleSubmit(onChapterSubmit)()} disabled={isSavingChapter}>
                    {isSavingChapter && <Loader2 className="mr-2 h-4 w-4 animate-spin"/>}
                    Simpan Draf
                </Button>
                <AlertDialog>
                    <AlertDialogTrigger asChild>
                        <Button size="sm" disabled={isPublishing}>
                            {isPublishing ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <BookUp className="mr-2 h-4 w-4" />}
                            Terbitkan
                        </Button>
                    </AlertDialogTrigger>
                    <AlertDialogContent>
                        <AlertDialogHeader>
                        <AlertDialogTitle>Apakah Anda siap menerbitkan buku ini?</AlertDialogTitle>
                        <AlertDialogDescription>
                            Setelah dipublikasikan, buku ini akan dapat dilihat oleh semua orang di Litera. Anda masih dapat mengeditnya nanti.
                        </AlertDialogDescription>
                        </AlertDialogHeader>
                        <AlertDialogFooter>
                        <AlertDialogCancel>Batal</AlertDialogCancel>
                        <AlertDialogAction onClick={handlePublish}>Ya, Terbitkan</AlertDialogAction>
                        </AlertDialogFooter>
                    </AlertDialogContent>
                </AlertDialog>
            </div>
        </div>
        <div className="flex-1 overflow-y-auto p-6">
            {activeChapter ? (
                 <Form {...form}>
                    <form onSubmit={form.handleSubmit(onChapterSubmit)} className="space-y-6 max-w-3xl mx-auto">
                        <FormField
                            control={form.control}
                            name="title"
                            render={({ field }) => (
                            <FormItem>
                                <FormLabel className="sr-only">Judul Bab</FormLabel>
                                <FormControl>
                                    <Input placeholder="Judul Bab" {...field} className="text-2xl font-bold font-headline border-0 shadow-none px-0 focus-visible:ring-0" />
                                </FormControl>
                                <FormMessage />
                            </FormItem>
                            )}
                        />
                        <FormField
                            control={form.control}
                            name="content"
                            render={({ field }) => (
                            <FormItem>
                                <FormLabel className="sr-only">Konten Bab</FormLabel>
                                <FormControl>
                                    <Textarea placeholder="Mulai menulis..." {...field} className="min-h-[60vh] border-0 shadow-none px-0 focus-visible:ring-0 text-lg leading-relaxed" />
                                </FormControl>
                                <FormMessage />
                            </FormItem>
                            )}
                        />
                    </form>
                 </Form>
            ) : (
                <div className="flex flex-col items-center justify-center h-full text-center">
                    <p className="text-muted-foreground">Pilih bab untuk diedit atau buat bab baru.</p>
                </div>
            )}
        </div>
      </div>
    </div>
  );
}
