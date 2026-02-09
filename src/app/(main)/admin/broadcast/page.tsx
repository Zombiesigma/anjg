
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
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage, FormDescription } from '@/components/ui/form';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useToast } from '@/hooks/use-toast';
import { Loader2, ArrowLeft, Send, Megaphone, Info, Sparkles } from 'lucide-react';
import { motion } from 'framer-motion';

const broadcastSchema = z.object({
  message: z.string().min(10, { message: "Pesan minimal 10 karakter." }).max(500, { message: "Pesan maksimal 500 karakter." }),
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

  const usersQuery = useMemo(() => (
    (firestore && currentUser) ? collection(firestore, 'users') : null
  ), [firestore, currentUser]);
  const { data: allUsers, isLoading: areUsersLoading } = useCollection<User>(usersQuery);

  const form = useForm<z.infer<typeof broadcastSchema>>({
    resolver: zodResolver(broadcastSchema),
    defaultValues: {
      message: '',
      link: '',
      target: 'all',
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
          title: "Target Tidak Ditemukan",
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
          displayName: 'Sistem Elitera',
          photoURL: 'https://raw.githubusercontent.com/Zombiesigma/elitera-asset/main/uploads/1770617037724-WhatsApp_Image_2026-02-07_at_13.45.35.jpeg',
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
        variant: 'success',
        title: "Pengumuman Disiarkan",
        description: `Notifikasi telah terkirim secara instan ke ${targetUsers.length} pengguna.`,
      });
      form.reset();

    } catch (error) {
      console.error("Error sending broadcast:", error);
      toast({
        variant: "destructive",
        title: "Gagal Menyiarkan",
        description: "Terjadi gangguan pada sistem pengiriman.",
      });
    } finally {
      setIsSending(false);
    }
  }

  return (
    <div className="max-w-4xl mx-auto space-y-10 pb-20">
      <div className="flex items-center gap-6">
        <Button variant="outline" size="icon" className="rounded-full border-2 h-12 w-12 shadow-sm shrink-0" asChild>
          <Link href="/admin"><ArrowLeft className="h-5 w-5" /></Link>
        </Button>
        <div>
          <h1 className="text-4xl font-headline font-black tracking-tight">Kirim <span className="text-primary italic">Siaran</span></h1>
          <p className="text-muted-foreground font-medium">Buat pengumuman resmi untuk komunitas Elitera.</p>
        </div>
      </div>

      <div className="grid lg:grid-cols-12 gap-10">
        <div className="lg:col-span-7">
            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
                <Card className="border-none shadow-2xl rounded-[2.5rem] overflow-hidden bg-card/50 backdrop-blur-sm">
                    <Form {...form}>
                        <form onSubmit={form.handleSubmit(onSubmit)}>
                            <CardHeader className="bg-primary/5 p-8 border-b border-primary/10">
                                <div className="flex items-center gap-4">
                                    <div className="p-3 rounded-2xl bg-white text-primary shadow-sm">
                                        <Megaphone className="h-6 w-6" />
                                    </div>
                                    <CardTitle className="text-2xl font-headline font-black">Editor Pengumuman</CardTitle>
                                </div>
                            </CardHeader>
                            <CardContent className="p-8 space-y-8">
                                <FormField
                                    control={form.control}
                                    name="target"
                                    render={({ field }) => (
                                    <FormItem>
                                        <FormLabel className="font-black text-xs uppercase tracking-widest ml-1">Penerima Siaran</FormLabel>
                                        <Select onValueChange={field.onChange} defaultValue={field.value}>
                                        <FormControl>
                                            <SelectTrigger className="h-12 rounded-xl focus:ring-primary/20 bg-muted/30 border-none px-5">
                                                <SelectValue placeholder="Pilih target audiens" />
                                            </SelectTrigger>
                                        </FormControl>
                                        <SelectContent className="rounded-xl">
                                            <SelectItem value="all">Semua Pengguna</SelectItem>
                                            <SelectItem value="penulis">Seluruh Penulis</SelectItem>
                                            <SelectItem value="pembaca">Seluruh Pembaca</SelectItem>
                                        </SelectContent>
                                        </Select>
                                        <FormMessage />
                                    </FormItem>
                                    )}
                                />

                                <FormField
                                    control={form.control}
                                    name="message"
                                    render={({ field }) => (
                                    <FormItem>
                                        <FormLabel className="font-black text-xs uppercase tracking-widest ml-1">Isi Pesan Notifikasi</FormLabel>
                                        <FormControl>
                                            <Textarea 
                                                placeholder="Contoh: Kami telah memperbarui fitur Elitera AI untuk membantu proses menulis Anda!" 
                                                {...field} 
                                                rows={5} 
                                                className="rounded-2xl bg-muted/30 border-none focus-visible:ring-primary/20 py-4 px-5 font-medium resize-none"
                                            />
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
                                        <FormLabel className="font-black text-xs uppercase tracking-widest ml-1">Tautan Navigasi (Opsional)</FormLabel>
                                        <FormControl>
                                            <Input placeholder="/about atau https://..." {...field} className="h-12 rounded-xl bg-muted/30 border-none focus-visible:ring-primary/20 px-5 font-medium" />
                                        </FormControl>
                                        <FormDescription className="text-[10px] ml-1 uppercase font-bold text-muted-foreground/60">Pengguna akan diarahkan ke sini saat notifikasi diklik.</FormDescription>
                                        <FormMessage />
                                    </FormItem>
                                    )}
                                />
                            </CardContent>
                            <CardFooter className="p-8 pt-0">
                                <Button type="submit" size="lg" className="w-full h-14 rounded-2xl font-black text-base shadow-xl shadow-primary/20 transition-all hover:scale-[1.02] active:scale-95" disabled={isSending || areUsersLoading}>
                                    {isSending ? (
                                        <><Loader2 className="mr-3 h-5 w-5 animate-spin" /> Sedang Menyiarkan...</>
                                    ) : (
                                        <><Send className="mr-3 h-5 w-5" /> Siarkan Sekarang</>
                                    )}
                                </Button>
                            </CardFooter>
                        </form>
                    </Form>
                </Card>
            </motion.div>
        </div>

        <div className="lg:col-span-5 space-y-6">
            <Card className="border-none shadow-xl rounded-[2rem] bg-indigo-950 text-white p-8 space-y-6">
                <div className="flex items-center gap-3 text-indigo-400">
                    <Sparkles className="h-5 w-5" />
                    <span className="text-[10px] font-black uppercase tracking-[0.2em]">Tips Siaran</span>
                </div>
                <div className="space-y-4">
                    <div className="flex gap-4">
                        <div className="h-6 w-6 rounded-full bg-white/10 flex items-center justify-center shrink-0 font-black text-[10px]">1</div>
                        <p className="text-sm text-indigo-100/80 leading-relaxed">Gunakan pesan yang singkat dan jelas agar mudah dibaca di bilah notifikasi ponsel.</p>
                    </div>
                    <div className="flex gap-4">
                        <div className="h-6 w-6 rounded-full bg-white/10 flex items-center justify-center shrink-0 font-black text-[10px]">2</div>
                        <p className="text-sm text-indigo-100/80 leading-relaxed">Pastikan tautan navigasi valid agar pengguna tidak diarahkan ke halaman kosong.</p>
                    </div>
                    <div className="flex gap-4">
                        <div className="h-6 w-6 rounded-full bg-white/10 flex items-center justify-center shrink-0 font-black text-[10px]">3</div>
                        <p className="text-sm text-indigo-100/80 leading-relaxed">Hindari penggunaan simbol berlebih agar kesan resmi tetap terjaga.</p>
                    </div>
                </div>
            </Card>

            <Card className="border-none shadow-xl rounded-[2rem] bg-card/50 backdrop-blur-sm p-8 space-y-4">
                <div className="flex items-center gap-3">
                    <Info className="h-5 w-5 text-primary" />
                    <span className="text-[10px] font-black uppercase tracking-[0.2em] text-muted-foreground">Status Jangkauan</span>
                </div>
                <div className="space-y-2">
                    <div className="flex justify-between items-baseline">
                        <p className="text-sm font-bold">Potensi Jangkauan</p>
                        <p className="text-2xl font-black text-primary">{areUsersLoading ? '...' : allUsers?.length}</p>
                    </div>
                    <p className="text-[10px] text-muted-foreground leading-relaxed">Siaran Anda akan muncul di pusat notifikasi pengguna dan (jika diaktifkan) melalui sistem notifikasi browser.</p>
                </div>
            </Card>
        </div>
      </div>
    </div>
  );
}
