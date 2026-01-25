'use client';

import { useState, useMemo } from 'react';
import Link from 'next/link';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { useFirestore, useUser, useCollection } from '@/firebase';
import { collection, doc, writeBatch, serverTimestamp } from 'firebase/firestore';
import type { User } from '@/lib/types';
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useToast } from '@/hooks/use-toast';
import { Loader2, ArrowLeft, Send } from 'lucide-react';

const broadcastSchema = z.object({
  message: z.string().min(10, { message: "Pesan minimal 10 karakter." }),
  link: z.string().url({ message: "URL harus valid (cth: /about)." }).optional().or(z.literal('')),
  target: z.enum(['all', 'penulis', 'pembaca'], {
    required_error: "Anda harus memilih target audiens.",
  }),
});

export default function BroadcastPage() {
  const { user: currentUser } = useUser();
  const firestore = useFirestore();
  const { toast } = useToast();
  const [isSending, setIsSending] = useState(false);

  const usersQuery = useMemo(() => (firestore ? collection(firestore, 'users') : null), [firestore]);
  const { data: allUsers, isLoading: areUsersLoading } = useCollection<User>(usersQuery);

  const form = useForm<z.infer<typeof broadcastSchema>>({
    resolver: zodResolver(broadcastSchema),
    defaultValues: {
      message: '',
      link: '',
    },
  });

  async function onSubmit(values: z.infer<typeof broadcastSchema>) {
    if (!firestore || !currentUser || !allUsers) return;
    setIsSending(true);

    try {
      const targetUsers = allUsers.filter(user => {
        if (values.target === 'all') return true;
        return user.role === values.target;
      });

      if (targetUsers.length === 0) {
        toast({
          variant: "destructive",
          title: "Tidak ada target ditemukan",
          description: `Tidak ada pengguna dengan peran '${values.target}'.`,
        });
        setIsSending(false);
        return;
      }
      
      const batch = writeBatch(firestore);
      const notificationData = {
        type: 'broadcast' as const,
        text: values.message,
        link: values.link || '/',
        actor: {
          uid: currentUser.uid,
          displayName: currentUser.displayName || 'Admin Elitera',
          photoURL: currentUser.photoURL || '',
        },
        read: false,
        createdAt: serverTimestamp(),
      };

      targetUsers.forEach(user => {
        const notificationRef = doc(collection(firestore, `users/${user.id}/notifications`));
        batch.set(notificationRef, notificationData);
      });

      await batch.commit();

      toast({
        title: "Pengumuman Terkirim",
        description: `Notifikasi telah dikirim ke ${targetUsers.length} pengguna.`,
      });
      form.reset();

    } catch (error) {
      console.error("Error sending broadcast:", error);
      toast({
        variant: "destructive",
        title: "Gagal Mengirim",
        description: "Terjadi kesalahan saat mengirim pengumuman.",
      });
    } finally {
      setIsSending(false);
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Button variant="outline" size="icon" asChild>
          <Link href="/admin"><ArrowLeft /></Link>
        </Button>
        <div>
          <h1 className="text-3xl font-headline font-bold">Buat Pengumuman</h1>
          <p className="text-muted-foreground">Kirim notifikasi ke kelompok pengguna tertentu.</p>
        </div>
      </div>
      <Card>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)}>
            <CardHeader>
              <CardTitle>Detail Pengumuman</CardTitle>
              <CardDescription>Tulis pesan Anda dan pilih siapa yang akan menerimanya.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <FormField
                control={form.control}
                name="message"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Pesan Notifikasi</FormLabel>
                    <FormControl>
                      <Textarea placeholder="Contoh: Pemeliharaan terjadwal akan dilakukan malam ini pukul 23.00." {...field} rows={4} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="link"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Tautan (Opsional)</FormLabel>
                    <FormControl>
                      <Input placeholder="/about atau https://example.com" {...field} />
                    </FormControl>
                     <p className="text-sm text-muted-foreground">Tautan yang akan dibuka saat notifikasi diklik. Gunakan tautan relatif (cth: /books/id-buku) atau URL lengkap.</p>
                    <FormMessage />
                  </FormItem>
                )}
              />
               <FormField
                control={form.control}
                name="target"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Target Audiens</FormLabel>
                    <Select onValueChange={field.onChange} defaultValue={field.value}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Pilih target audiens" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="all">Semua Pengguna</SelectItem>
                        <SelectItem value="penulis">Hanya Penulis</SelectItem>
                        <SelectItem value="pembaca">Hanya Pembaca</SelectItem>
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </CardContent>
            <CardFooter className="border-t pt-6">
              <Button type="submit" disabled={isSending || areUsersLoading}>
                {(isSending || areUsersLoading) && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                Kirim Pengumuman
              </Button>
            </CardFooter>
          </form>
        </Form>
      </Card>
    </div>
  );
}
