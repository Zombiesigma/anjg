
'use client';

import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { useRouter } from 'next/navigation';
import { useFirestore, useUser, useDoc } from '@/firebase';
import { collection, addDoc, serverTimestamp, doc } from 'firebase/firestore';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Label } from "@/components/ui/label";
import { useToast } from '@/hooks/use-toast';
import { Loader2, Sparkles, AlertTriangle, BookUser, Upload, FileImage, Globe, Users } from "lucide-react";
import type { User as AppUser } from '@/lib/types';
import Link from 'next/link';
import { uploadFile } from '@/lib/uploader';
import Image from 'next/image';

const formSchema = z.object({
  title: z.string().min(3, { message: "Judul minimal 3 karakter." }).max(100, { message: "Judul maksimal 100 karakter."}),
  genre: z.string({ required_error: "Genre harus dipilih."}),
  synopsis: z.string().min(10, { message: "Sinopsis minimal 10 karakter." }).max(1000, { message: "Sinopsis maksimal 1000 karakter."}),
  visibility: z.enum(['public', 'followers_only'], { required_error: "Pilih siapa yang dapat melihat buku ini." }),
});

export default function CreateBookPage() {
  const router = useRouter();
  const firestore = useFirestore();
  const { user: currentUser, isLoading: isUserAuthLoading } = useUser();
  const { toast } = useToast();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);

  const userProfileRef = (firestore && currentUser) ? doc(firestore, 'users', currentUser.uid) : null;
  const { data: userProfile, isLoading: isProfileLoading } = useDoc<AppUser>(userProfileRef);

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      title: "",
      synopsis: "",
      visibility: "public",
    },
  });

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

  async function onSubmit(values: z.infer<typeof formSchema>) {
    if (!firestore || !currentUser) {
        toast({
            variant: "destructive",
            title: "Gagal",
            description: "Anda harus masuk untuk membuat buku.",
        });
        return;
    }
    
    setIsSubmitting(true);

    try {
      let coverUrl = `https://picsum.photos/seed/${Date.now()}/400/600`;
      
      if (selectedFile) {
        try {
          coverUrl = await uploadFile(selectedFile);
        } catch (uploadError) {
          console.error("Upload failed, using placeholder", uploadError);
          toast({
            variant: "destructive",
            title: "Gagal Mengunggah Sampul",
            description: "Gagal mengunggah sampul buku. Menggunakan sampul sementara.",
          });
        }
      }

      const bookData = {
        ...values,
        authorId: currentUser.uid,
        authorName: currentUser.displayName,
        authorAvatarUrl: currentUser.photoURL,
        status: 'draft' as const,
        viewCount: 0,
        favoriteCount: 0,
        chapterCount: 0,
        coverUrl: coverUrl,
        createdAt: serverTimestamp(),
      };
      
      const booksCollection = collection(firestore, 'books');
      const docRef = await addDoc(booksCollection, bookData);
      
      toast({
        title: "Buku Dibuat",
        description: "Draf buku Anda telah disimpan. Sekarang Anda bisa mulai menulis bab.",
      });

      router.push(`/books/${docRef.id}/edit`);

    } catch (error) {
      console.error("Error creating book:", error);
      toast({
        variant: "destructive",
        title: "Gagal Membuat Buku",
        description: "Terjadi kesalahan. Silakan coba lagi.",
      });
      setIsSubmitting(false);
    }
  }

  const isLoading = isUserAuthLoading || isProfileLoading;
  const canUpload = userProfile?.role === 'penulis' || userProfile?.role === 'admin';

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!canUpload) {
    return (
      <div className="max-w-2xl mx-auto">
        <Card className="text-center">
            <CardHeader>
                <div className="mx-auto bg-destructive/10 p-3 rounded-full w-fit mb-4">
                    <AlertTriangle className="h-8 w-8 text-destructive" />
                </div>
                <CardTitle className="font-headline text-2xl">Akses Ditolak</CardTitle>
                <CardDescription>
                    Hanya pengguna dengan peran 'penulis' atau 'admin' yang dapat membuat buku baru.
                </CardDescription>
            </CardHeader>
            <CardContent>
                <p className="text-muted-foreground">Peran Anda saat ini adalah <span className="font-semibold capitalize">{userProfile?.role || 'pembaca'}</span>. Jika Anda ingin membagikan cerita Anda, silakan ajukan permohonan untuk menjadi penulis.</p>
            </CardContent>
            <CardContent>
                <Button asChild>
                    <Link href="/join-author">
                        <BookUser className="mr-2 h-4 w-4" />
                        Bergabung Sebagai Penulis
                    </Link>
                </Button>
            </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className="max-w-2xl mx-auto">
      <Card>
        <CardHeader>
          <CardTitle className="font-headline text-3xl">Mulai Cerita Baru</CardTitle>
          <CardDescription>Isi detail dasar buku Anda. Anda dapat mengubahnya nanti.</CardDescription>
        </CardHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)}>
            <CardContent className="space-y-6">
              <div className="flex flex-col md:flex-row gap-6">
                <div className="flex-1 space-y-6">
                  <FormField
                    control={form.control}
                    name="title"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Judul Buku</FormLabel>
                        <FormControl>
                          <Input placeholder="Petualangan di Negeri Awan" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="genre"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Genre</FormLabel>
                        <Select onValueChange={field.onChange} defaultValue={field.value}>
                            <FormControl>
                              <SelectTrigger>
                                <SelectValue placeholder="Pilih genre yang paling sesuai" />
                              </SelectTrigger>
                            </FormControl>
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
                    onClick={() => document.getElementById('cover-upload')?.click()}
                  >
                    {previewUrl ? (
                      <Image src={previewUrl} alt="Preview Sampul" fill className="object-cover" />
                    ) : (
                      <>
                        <FileImage className="h-10 w-10 text-muted-foreground mb-2" />
                        <span className="text-xs text-muted-foreground text-center px-2">Klik untuk pilih gambar</span>
                      </>
                    )}
                    <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 flex items-center justify-center transition-opacity">
                      <Upload className="h-6 w-6 text-white" />
                    </div>
                  </div>
                  <input id="cover-upload" type="file" accept="image/*" className="hidden" onChange={handleFileChange} />
                </div>
              </div>

              <FormField
                control={form.control}
                name="visibility"
                render={({ field }) => (
                  <FormItem className="space-y-3">
                    <FormLabel>Visibilitas</FormLabel>
                    <FormControl>
                      <RadioGroup
                        onValueChange={field.onChange}
                        defaultValue={field.value}
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
                control={form.control}
                name="synopsis"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Sinopsis</FormLabel>
                    <FormControl>
                      <Textarea placeholder="Ringkasan singkat tentang buku Anda..." rows={5} {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </CardContent>
            <CardContent>
              <Button type="submit" size="lg" className="w-full" disabled={isSubmitting}>
                {isSubmitting ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Sparkles className="mr-2 h-4 w-4" />}
                Buat Buku & Mulai Menulis
              </Button>
            </CardContent>
          </form>
        </Form>
      </Card>
    </div>
  )
}
