'use client';

import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { useRouter } from 'next/navigation';
import { useFirestore, useUser } from '@/firebase';
import { collection, addDoc, serverTimestamp } from 'firebase/firestore';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from '@/hooks/use-toast';
import { Loader2, Sparkles } from "lucide-react";

const formSchema = z.object({
  title: z.string().min(3, { message: "Judul minimal 3 karakter." }).max(100, { message: "Judul maksimal 100 karakter."}),
  genre: z.string({ required_error: "Genre harus dipilih."}),
  synopsis: z.string().min(10, { message: "Sinopsis minimal 10 karakter." }).max(1000, { message: "Sinopsis maksimal 1000 karakter."}),
});

export default function CreateBookPage() {
  const router = useRouter();
  const firestore = useFirestore();
  const { user: currentUser } = useUser();
  const { toast } = useToast();
  const [isLoading, setIsLoading] = useState(false);

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      title: "",
      synopsis: "",
    },
  });

  async function onSubmit(values: z.infer<typeof formSchema>) {
    if (!firestore || !currentUser) {
        toast({
            variant: "destructive",
            title: "Gagal",
            description: "Anda harus masuk untuk membuat buku.",
        });
        return;
    }
    
    setIsLoading(true);

    try {
      const bookData = {
        ...values,
        authorId: currentUser.uid,
        authorName: currentUser.displayName,
        authorAvatarUrl: currentUser.photoURL,
        status: 'draft' as const,
        viewCount: 0,
        downloadCount: 0,
        // Use a random image from picsum.photos for the cover
        coverUrl: `https://picsum.photos/seed/${Date.now()}/400/600`,
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
      setIsLoading(false);
    }
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
              <Button type="submit" size="lg" className="w-full" disabled={isLoading}>
                {isLoading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Sparkles className="mr-2 h-4 w-4" />}
                Buat Buku & Mulai Menulis
              </Button>
            </CardContent>
          </form>
        </Form>
      </Card>
    </div>
  )
}
